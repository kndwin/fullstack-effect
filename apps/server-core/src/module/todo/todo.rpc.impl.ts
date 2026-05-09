import { TodoRpcs } from "@qaveai/shared/module/todo/todo.rpc";
import { Effect, Layer, Stream } from "effect";
import { TodoService, TodoServiceLive } from "./todo.service";

export const TodoRpcLive = TodoRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* TodoService;

    return TodoRpcs.of({
      TodoList: () => Stream.fromIterableEffect(service.findMany).pipe(Stream.orDie),
      TodoCreate: ({ title, projectId }) => service.create(title, projectId).pipe(Effect.orDie),
      TodoToggle: ({ id }) => service.toggle(id).pipe(Effect.catchTag("EffectDrizzleQueryError", Effect.die)),
      TodoDelete: ({ id }) => service.delete(id).pipe(Effect.orDie),
    });
  }),
).pipe(Layer.provide(TodoServiceLive));
