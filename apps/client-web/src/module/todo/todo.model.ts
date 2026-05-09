import { TodoSchema } from "@qaveai/shared/module/todo/todo.schema";
import { Schema } from "effect";

export const TodoItemStatus = Schema.Union([
  Schema.Literal("idle"),
  Schema.Literal("toggling"),
  Schema.Literal("deleting"),
]);
export type TodoItemStatus = typeof TodoItemStatus.Type;

export const TodoItem = Schema.Struct({
  todo: TodoSchema,
  status: TodoItemStatus,
});
export type TodoItem = typeof TodoItem.Type;

export const TodoModel = Schema.Struct({
  draft: Schema.String,
  todos: Schema.Array(TodoItem),
  status: Schema.Struct({
    loadingTodos: Schema.Boolean,
    creatingTodo: Schema.Boolean,
  }),
  error: Schema.NullOr(Schema.String),
});
export type TodoModel = typeof TodoModel.Type;
