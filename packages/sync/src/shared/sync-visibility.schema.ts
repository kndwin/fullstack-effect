import { Schema } from "effect";

export const SyncVisibilitySchema = Schema.Union([
  Schema.Struct({ type: Schema.Literal("tenant") }),
  Schema.Struct({ type: Schema.Literal("user"), userId: Schema.String }),
  Schema.Struct({
    type: Schema.Literal("resource"),
    resourceType: Schema.String,
    resourceId: Schema.String,
  }),
]);
export type SyncVisibility = typeof SyncVisibilitySchema.Type;
