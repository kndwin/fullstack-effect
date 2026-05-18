import { integer, jsonb, pgSchema, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const syncSchema = pgSchema("sync");

export const syncEvents = syncSchema.table(
  "sync_event",
  {
    tenantId: text("tenant_id").notNull(),
    seq: integer("seq").notNull(),
    userId: text("user_id").notNull(),
    domain: text("domain").notNull(),
    type: text("type").notNull(),
    visibilityType: text("visibility_type", { enum: ["tenant", "user", "resource"] }).notNull(),
    visibilityResourceType: text("visibility_resource_type"),
    visibilityResourceId: text("visibility_resource_id"),
    targetUserId: text("target_user_id"),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    payload: jsonb("payload").notNull().$type<unknown>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.seq] })],
);

export const clientMutations = syncSchema.table(
  "client_mutation",
  {
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    clientMutationId: text("client_mutation_id").notNull(),
    domain: text("domain").notNull(),
    commandType: text("command_type").notNull(),
    resultEventSeq: integer("result_event_seq"),
    status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.tenantId, table.userId, table.clientMutationId] })],
);
