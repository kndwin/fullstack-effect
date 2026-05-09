import { Schema } from "effect";

export const ProjectSchema = Schema.Struct({
  id: Schema.String,
  orgId: Schema.String,
  name: Schema.String,
});

export class ErrorProjectNotFound extends Schema.TaggedErrorClass<ErrorProjectNotFound>()("ErrorProjectNotFound", {
  id: Schema.String,
}) {}
