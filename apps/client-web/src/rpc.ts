import { AppRpcs } from "@qaveai/shared/platform/rpc";
import { AuthSessionSchema } from "@qaveai/shared/module/auth/auth.schema";
import { ChannelSchema } from "@qaveai/shared/module/channel/channel.schema";
import { OrgSchema } from "@qaveai/shared/module/org/org.schema";
import { ProjectSchema } from "@qaveai/shared/module/project/project.schema";
import { TaskSchema, TaskStatus } from "@qaveai/shared/module/task/task.schema";
import { TodoSchema } from "@qaveai/shared/module/todo/todo.schema";
import { Effect, Layer, Stream } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import { backendUrl } from "./backend-origin";

const ProtocolLive = RpcClient.layerProtocolHttp({ url: "/rpc" }).pipe(
  Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]),
);

const withClient = <A>(f: (client: RpcClient.FromGroup<typeof AppRpcs, unknown>) => Effect.Effect<A, unknown>) =>
  Effect.gen(function* () {
    const client = yield* RpcClient.make(AppRpcs);
    return yield* f(client as RpcClient.FromGroup<typeof AppRpcs, unknown>);
  }).pipe(Effect.scoped, Effect.provide(ProtocolLive));

type AuthSession = typeof AuthSessionSchema.Type;
type Channel = typeof ChannelSchema.Type;
type Org = typeof OrgSchema.Type;
type Project = typeof ProjectSchema.Type;
type Task = typeof TaskSchema.Type;
type TaskStatusValue = typeof TaskStatus.Type;
type Todo = typeof TodoSchema.Type;

export const todoRpc = {
  list: withClient((client) =>
    Stream.runCollect(client.TodoList()).pipe(Effect.map((todos) => todos as ReadonlyArray<Todo>)),
  ),
  create: (title: string, projectId: string) => withClient((client) => client.TodoCreate({ title, projectId })),
  toggle: (id: string) => withClient((client) => client.TodoToggle({ id })),
  delete: (id: string) => withClient((client) => client.TodoDelete({ id })),
};

export const projectRpc = {
  list: (orgId: string) =>
    withClient((client) =>
      Stream.runCollect(client.ProjectList({ orgId })).pipe(
        Effect.map((projects) => projects as ReadonlyArray<Project>),
      ),
    ),
  create: (orgId: string, name: string) => withClient((client) => client.ProjectCreate({ orgId, name })),
};

export const taskRpc = {
  create: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly title: string;
    readonly clientMutationId: string;
  }) => withClient((client) => client.TaskCreate(input)) as Effect.Effect<Task, unknown>,
  updateStatus: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly taskId: string;
    readonly status: TaskStatusValue;
  }) => withClient((client) => client.TaskUpdateStatus(input)) as Effect.Effect<Task, unknown>,
};

export const channelRpc = {
  create: (input: {
    readonly tenantId: string;
    readonly userId: string;
    readonly name: string;
    readonly clientMutationId: string;
  }) => withClient((client) => client.ChannelCreate(input)) as Effect.Effect<Channel, unknown>,
};

export const orgRpc = {
  list: withClient((client) =>
    Stream.runCollect(client.OrgList()).pipe(Effect.map((orgs) => orgs as ReadonlyArray<Org>)),
  ),
  create: (name: string) => withClient((client) => client.OrgCreate({ name })),
};

export const authHttp = {
  me: Effect.tryPromise({
    try: async () => (await (await fetch(backendUrl("/auth/me"), { credentials: "include" })).json()) as AuthSession | null,
    catch: (error) => error,
  }),
  logout: Effect.tryPromise({
    try: async () => {
      await fetch(backendUrl("/auth/logout"), { credentials: "include", method: "POST" });
    },
    catch: (error) => error,
  }),
};
