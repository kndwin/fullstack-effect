import type { Rpc } from "@effect/rpc";
import { TodoRpcs } from "@qaveai/shared/rpc";
import { Effect, Layer, Stream } from "effect";
import { TodoRepository } from "./todos.repo";

export const TodoHandlersLive: Layer.Layer<
  | Rpc.Handler<"TodoList">
  | Rpc.Handler<"TodoCreate">
  | Rpc.Handler<"TodoToggle">
  | Rpc.Handler<"TodoDelete">
> = TodoRpcs.toLayer(
  Effect.gen(function* () {
    const repo = yield* TodoRepository;

    return {
      TodoList: () => Stream.fromIterableEffect(repo.findMany),
      TodoCreate: ({ title }) => repo.create(title.trim()),
      TodoToggle: ({ id }) => repo.toggle(id),
      TodoDelete: ({ id }) => repo.delete(id),
    };
  }),
).pipe(Layer.provide(TodoRepository.Default));
