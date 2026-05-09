import { Context, Effect, Layer } from "effect";
import { TodoRepository, TodoRepositoryLive } from "./todo.repo";

export class TodoService extends Context.Service<TodoService>()("TodoService", {
  make: Effect.gen(function* () {
    const repo = yield* TodoRepository;

    return {
      findMany: repo.findMany,
      create: (title: string, projectId: string) => repo.create(title.trim(), projectId),
      toggle: repo.toggle,
      delete: repo.delete,
    };
  }),
}) {}

export const TodoServiceLive = Layer.effect(TodoService)(TodoService.make).pipe(Layer.provide(TodoRepositoryLive));
