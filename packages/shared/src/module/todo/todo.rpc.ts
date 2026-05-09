import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import { ErrorTodoNotFound, TodoSchema } from "./todo.schema";

export const TodoRpcs = RpcGroup.make(
  Rpc.make("TodoList", { success: TodoSchema, stream: true }),
  Rpc.make("TodoCreate", { success: TodoSchema, payload: { title: Schema.String, projectId: Schema.String } }),
  Rpc.make("TodoToggle", { success: TodoSchema, payload: { id: Schema.String }, error: ErrorTodoNotFound }),
  Rpc.make("TodoDelete", { success: Schema.Void, payload: { id: Schema.String } }),
);
