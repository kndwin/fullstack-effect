import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { todoRpc } from "../../rpc";
import { TodoCreated, TodoDeleted, TodoFailed, TodoLoaded, TodoToggled } from "./todo.message";

const TodoCommandLoad = Command.define("TodoCommandLoad", TodoLoaded, TodoFailed);
const TodoCommandCreate = Command.define("TodoCommandCreate", TodoCreated, TodoFailed);
const TodoCommandToggle = Command.define("TodoCommandToggle", TodoToggled, TodoFailed);
const TodoCommandDelete = Command.define("TodoCommandDelete", TodoDeleted, TodoFailed);

export const loadTodos = TodoCommandLoad(
  todoRpc.list.pipe(
    Effect.map((todos) => TodoLoaded({ todos })),
    Effect.catchCause((cause) => Effect.succeed(TodoFailed({ message: Cause.pretty(cause) }))),
  ),
);

export const createTodo = (title: string, projectId: string) =>
  TodoCommandCreate(
    todoRpc.create(title, projectId).pipe(
      Effect.map((todo) => TodoCreated({ todo })),
      Effect.catchCause((cause) => Effect.succeed(TodoFailed({ message: Cause.pretty(cause) }))),
    ),
  );

export const toggleTodo = (id: string) =>
  TodoCommandToggle(
    todoRpc.toggle(id).pipe(
      Effect.map((todo) => TodoToggled({ todo })),
      Effect.catchCause((cause) => Effect.succeed(TodoFailed({ message: Cause.pretty(cause) }))),
    ),
  );

export const deleteTodo = (id: string) =>
  TodoCommandDelete(
    todoRpc.delete(id).pipe(
      Effect.as(TodoDeleted({ id })),
      Effect.catchCause((cause) => Effect.succeed(TodoFailed({ message: Cause.pretty(cause) }))),
    ),
  );
