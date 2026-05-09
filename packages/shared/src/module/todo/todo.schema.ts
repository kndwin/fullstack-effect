import { Schema } from "effect";

export const TodoSchema = Schema.Struct({
  id: Schema.String,
  projectId: Schema.String,
  title: Schema.String,
  completed: Schema.Boolean,
});

export class ErrorTodoNotFound extends Schema.TaggedErrorClass<ErrorTodoNotFound>()("ErrorTodoNotFound", {
  id: Schema.String,
}) {}
