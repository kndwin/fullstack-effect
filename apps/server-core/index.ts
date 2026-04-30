import { HttpRouter } from "@effect/platform";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { TodoRpcs } from "@qaveai/shared/rpc";
import { Effect, Layer } from "effect";
import { TodoHandlersLive } from "./src/todos.rpc";
import { renderedTodoQueries } from "./src/todos.sql";

const RpcLayer = RpcServer.layer(TodoRpcs).pipe(Layer.provide(TodoHandlersLive));

const HttpProtocol = RpcServer.layerProtocolHttp({
  path: "/rpc",
}).pipe(Layer.provide(RpcSerialization.layerNdjson));

const Server = HttpRouter.Default.serve().pipe(
  Layer.provide(RpcLayer),
  Layer.provide(HttpProtocol),
  Layer.provide(BunHttpServer.layer({ hostname: "127.0.0.1", port: 3010 })),
);

Effect.runSync(
  Effect.logInfo("effect-qb rendered todo SQL", renderedTodoQueries),
);

BunRuntime.runMain(Layer.launch(Server));
