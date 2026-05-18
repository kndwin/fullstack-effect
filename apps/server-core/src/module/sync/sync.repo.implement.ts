import type { ClientMutation } from "@qaveai/sync/shared/client-mutation.schema";
import { ClientMutationSchema } from "@qaveai/sync/shared/client-mutation.schema";
import {
  ErrorClientMutationInsertFailed,
  ErrorInvalidSyncEventVisibility,
  ErrorSyncEventInsertFailed,
} from "@qaveai/sync/shared/sync-error.schema";
import type { SyncEvent } from "@qaveai/sync/shared/sync-event.schema";
import { SyncEventSchema } from "@qaveai/sync/shared/sync-event.schema";
import type { SyncVisibility } from "@qaveai/sync/shared/sync-visibility.schema";
import type { TenantContext } from "@qaveai/sync/shared/tenant-context.schema";
import { createSqlSyncStore } from "@qaveai/sync/server/sync.service.implement.sql";
import { SyncStore, type PullEventsInput, type SqlSyncAdapter } from "@qaveai/sync/server/sync.service.interface";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { DB, PgLive } from "../../platform/db";
import { SyncRepository } from "./sync.repo.interface";
import { clientMutations, syncEvents } from "./sync.table";

export const SyncRepositoryLive = Layer.effect(SyncRepository)(
  Effect.gen(function* () {
    const db = yield* DB;

    const appendEvent = Effect.fn("SyncRepository.appendEvent")(function* (ctx: TenantContext, input) {
      const [nextSeq] = yield* db
        .select({ value: sql<number>`coalesce(max(${syncEvents.seq}), 0) + 1` })
        .from(syncEvents)
        .where(eq(syncEvents.tenantId, ctx.tenantId));
      const [event] = yield* db
        .insert(syncEvents)
        .values({
          tenantId: ctx.tenantId,
          seq: nextSeq?.value ?? 1,
          userId: ctx.userId,
          domain: input.domain,
          type: input.type,
          visibilityType: input.visibility.type,
          visibilityResourceType: input.visibility.type === "resource" ? input.visibility.resourceType : null,
          visibilityResourceId: input.visibility.type === "resource" ? input.visibility.resourceId : null,
          targetUserId: input.visibility.type === "user" ? input.visibility.userId : null,
          aggregateType: input.aggregateType,
          aggregateId: input.aggregateId,
          payload: input.payload,
          createdAt: new Date(),
        })
        .returning();

      if (!event) return yield* new ErrorSyncEventInsertFailed({ message: "Sync event insert returned no rows" });
      return yield* decodeSyncEventRow(event);
    });

    const pullEvents = Effect.fn("SyncRepository.pullEvents")(function* (ctx: TenantContext, input: PullEventsInput) {
      const rows = yield* db
        .select()
        .from(syncEvents)
        .where(and(eq(syncEvents.tenantId, ctx.tenantId), gt(syncEvents.seq, input.afterSeq)))
        .orderBy(asc(syncEvents.seq))
        .limit(input.limit);
      return yield* Effect.all(rows.map(decodeSyncEventRow));
    });

    const findClientMutation = Effect.fn("SyncRepository.findClientMutation")(function* (ctx: TenantContext, input) {
      const row = yield* db.query.clientMutations.findFirst({
        where: { tenantId: ctx.tenantId, userId: ctx.userId, clientMutationId: input.clientMutationId },
      });
      if (!row) return null;

      const resultEvent =
        row.resultEventSeq === null
          ? null
          : yield* db.query.syncEvents.findFirst({ where: { tenantId: ctx.tenantId, seq: row.resultEventSeq } });

      return {
        mutation: decodeClientMutationRow(row),
        result: resultEvent ? yield* decodeSyncEventRow(resultEvent) : null,
      };
    });

    return SyncRepository.of({
      appendEvent,
      pullEvents,
      findClientMutation,
      withClientMutationTransaction: <TResult>(
        ctx: Parameters<SqlSyncAdapter["withClientMutationTransaction"]>[0],
        input: Parameters<SqlSyncAdapter["withClientMutationTransaction"]>[1],
        run: Parameters<SqlSyncAdapter["withClientMutationTransaction"]>[2],
      ) =>
        Effect.gen(function* () {
          const output = yield* run({ appendEvent });
          const [mutation] = yield* db
            .insert(clientMutations)
            .values({
              tenantId: ctx.tenantId,
              userId: ctx.userId,
              clientMutationId: input.clientMutationId,
              domain: input.domain,
              commandType: input.commandType,
              resultEventSeq: output.resultEventSeq,
              status: "completed",
              createdAt: new Date(),
            })
            .returning();

          if (!mutation)
            return yield* new ErrorClientMutationInsertFailed({ message: "Client mutation insert returned no rows" });
          return { mutation: decodeClientMutationRow(mutation), result: output.result as TResult };
        }),
    });
  }),
).pipe(Layer.provide(PgLive));

export const SyncStoreSqlLive = Layer.effect(SyncStore)(
  Effect.gen(function* () {
    const repo = yield* SyncRepository;
    return SyncStore.of(createSqlSyncStore(repo));
  }),
).pipe(Layer.provide(SyncRepositoryLive));

const decodeSyncEventRow = (row: typeof syncEvents.$inferSelect) =>
  Effect.gen(function* () {
    return Schema.decodeUnknownSync(SyncEventSchema)({
      tenantId: row.tenantId,
      userId: row.userId,
      seq: row.seq,
      domain: row.domain,
      type: row.type,
      visibility: yield* decodeVisibility(row),
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      payload: row.payload,
      createdAt: row.createdAt.toISOString(),
    }) satisfies SyncEvent;
  });

const decodeVisibility = (
  row: typeof syncEvents.$inferSelect,
): Effect.Effect<SyncVisibility, ErrorInvalidSyncEventVisibility> => {
  switch (row.visibilityType) {
    case "tenant":
      return Effect.succeed({ type: "tenant" });
    case "user":
      return row.targetUserId
        ? Effect.succeed({ type: "user", userId: row.targetUserId })
        : Effect.fail(
            new ErrorInvalidSyncEventVisibility({
              message: "User-visible sync event is missing target_user_id",
              visibilityType: row.visibilityType,
            }),
          );
    case "resource":
      return row.visibilityResourceType && row.visibilityResourceId
        ? Effect.succeed({
            type: "resource",
            resourceType: row.visibilityResourceType,
            resourceId: row.visibilityResourceId,
          })
        : Effect.fail(
            new ErrorInvalidSyncEventVisibility({
              message: "Resource-visible sync event is missing resource columns",
              visibilityType: row.visibilityType,
            }),
          );
  }
};

const decodeClientMutationRow = (row: typeof clientMutations.$inferSelect): ClientMutation =>
  Schema.decodeUnknownSync(ClientMutationSchema)({
    tenantId: row.tenantId,
    userId: row.userId,
    clientMutationId: row.clientMutationId,
    domain: row.domain,
    commandType: row.commandType,
    resultEventSeq: row.resultEventSeq,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  });
