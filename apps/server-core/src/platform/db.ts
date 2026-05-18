import * as PgClient from "@effect/sql-pg/PgClient";
import { Config, Effect, Redacted } from "effect";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { defineRelations } from "drizzle-orm/relations";
import * as authTables from "../module/auth/auth.table";
import * as orgTables from "../module/org/org.table";
import * as projectTables from "../module/project/project.table";
import * as syncTables from "../module/sync/sync.table";
import * as taskTables from "../module/task/task.table";
import * as todoTables from "../module/todo/todo.table";

export const schema = {
  ...authTables,
  ...orgTables,
  ...projectTables,
  ...syncTables,
  ...taskTables,
  ...todoTables,
};

export const PgLive = PgClient.layerConfig({
  url: Config.string("DATABASE_URL").pipe(
    Config.withDefault("postgres://postgres:postgres@127.0.0.1:5432/qaveai"),
    Config.map(Redacted.make),
  ),
});

export const relations = defineRelations(schema);

export const DB = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));
