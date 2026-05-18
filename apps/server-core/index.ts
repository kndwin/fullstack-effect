import { AppRpcs } from "@qaveai/shared/platform/rpc";
import { Effect, Layer } from "effect";
import { HttpEffect } from "effect/unstable/http";
import { RpcSerialization, RpcServer } from "effect/unstable/rpc";
import { handleAuthRequest } from "./src/module/auth/auth.http";
import { AuthRpcLive } from "./src/module/auth/auth.rpc.impl";
import { ChannelRpcLive } from "./src/module/channel/channel.rpc.implement";
import { OrgRpcLive } from "./src/module/org/org.rpc.impl";
import { ProjectRpcLive } from "./src/module/project/project.rpc.impl";
import { TaskRpcLive } from "./src/module/task/task.rpc.implement";
import { TodoRpcLive } from "./src/module/todo/todo.rpc.impl";

const RpcLive = Layer.mergeAll(
  TodoRpcLive,
  ProjectRpcLive,
  TaskRpcLive,
  ChannelRpcLive,
  OrgRpcLive,
  AuthRpcLive,
  RpcSerialization.layerNdjson,
) as never;

const rpc = HttpEffect.toWebHandlerLayer(Effect.flatten(RpcServer.toHttpEffect(AppRpcs)), RpcLive);

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3010),
  fetch: async (request) => (await handleAuthRequest(request)) ?? rpc.handler(request),
});

console.log(`Server listening on http://${server.hostname}:${server.port}`);
