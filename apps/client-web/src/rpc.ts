import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import type { RpcClientError } from "@effect/rpc/RpcClientError";
import type { FromGroup } from "@effect/rpc/RpcClient";
import { TodoRpcs } from "@qaveai/shared/rpc";
import { Chunk, Effect, Layer, Stream } from "effect";

const ProtocolLive = RpcClient.layerProtocolHttp({
  url: "/rpc",
}).pipe(
  Layer.provide([
    FetchHttpClient.layer,
    RpcSerialization.layerNdjson,
  ]),
);

const withClient = <A, E>(
  f: (client: FromGroup<typeof TodoRpcs, RpcClientError>) => Effect.Effect<A, E, never>,
) =>
  Effect.gen(function* () {
    const client = yield* RpcClient.make(TodoRpcs);
    return yield* f(client);
  }).pipe(Effect.scoped, Effect.provide(ProtocolLive));

export const todoRpc = {
  list: withClient((client) =>
    Stream.runCollect(client.TodoList()).pipe(Effect.map(Chunk.toReadonlyArray)),
  ),
  create: (title: string) => withClient((client) => client.TodoCreate({ title })),
  toggle: (id: string) => withClient((client) => client.TodoToggle({ id })),
  delete: (id: string) => withClient((client) => client.TodoDelete({ id })),
};
