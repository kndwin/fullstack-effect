import { TodoSchema } from "@qaveai/shared/module/todo/todo.schema";
import { Schema } from "effect";
import { m } from "foldkit/message";

export const TodoStarted = m("TodoStarted");
export const TodoDraftChanged = m("TodoDraftChanged", { value: Schema.String });
export const TodoAddClicked = m("TodoAddClicked", { projectId: Schema.String });
export const TodoToggleClicked = m("TodoToggleClicked", { id: Schema.String });
export const TodoDeleteClicked = m("TodoDeleteClicked", { id: Schema.String });
export const TodoLoaded = m("TodoLoaded", { todos: Schema.Array(TodoSchema) });
export const TodoCreated = m("TodoCreated", { todo: TodoSchema });
export const TodoToggled = m("TodoToggled", { todo: TodoSchema });
export const TodoDeleted = m("TodoDeleted", { id: Schema.String });
export const TodoFailed = m("TodoFailed", { message: Schema.String });

export const TodoMessage = Schema.Union([
  TodoStarted,
  TodoDraftChanged,
  TodoAddClicked,
  TodoToggleClicked,
  TodoDeleteClicked,
  TodoLoaded,
  TodoCreated,
  TodoToggled,
  TodoDeleted,
  TodoFailed,
]);
export type TodoMessage = typeof TodoMessage.Type;
