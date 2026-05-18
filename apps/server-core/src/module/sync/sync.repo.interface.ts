import type { SqlSyncAdapter } from "@qaveai/sync/server/sync.service.interface";
import { Context, Effect } from "effect";

export class SyncRepository extends Context.Service<SyncRepository>()("SyncRepository", {
  make: Effect.succeed({} as SqlSyncAdapter),
}) {}
