import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

export class Todo extends Schema.Class<Todo>("Todo")({
  id: Schema.String,
  title: Schema.String,
  completed: Schema.Boolean,
}) {}

export class TodoRpcs extends RpcGroup.make(
  Rpc.make("TodoList", {
    success: Todo,
    stream: true,
  }),
  Rpc.make("TodoCreate", {
    success: Todo,
    payload: {
      title: Schema.String,
    },
  }),
  Rpc.make("TodoToggle", {
    success: Todo,
    payload: {
      id: Schema.String,
    },
  }),
  Rpc.make("TodoDelete", {
    success: Schema.Void,
    payload: {
      id: Schema.String,
    },
  }),
) {}
