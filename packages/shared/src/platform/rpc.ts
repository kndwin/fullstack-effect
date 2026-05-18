import { AuthRpcs } from "../module/auth/auth.rpc";
import { ChannelRpcs } from "../module/channel/channel.rpc.interface";
import { OrgRpcs } from "../module/org/org.rpc";
import { ProjectRpcs } from "../module/project/project.rpc";
import { TaskRpcs } from "../module/task/task.rpc.interface";
import { TodoRpcs } from "../module/todo/todo.rpc";

export const AppRpcs = TodoRpcs.merge(ProjectRpcs, OrgRpcs, AuthRpcs, TaskRpcs, ChannelRpcs);

export { AuthRpcs } from "../module/auth/auth.rpc";
export { ChannelRpcs } from "../module/channel/channel.rpc.interface";
export { OrgRpcs } from "../module/org/org.rpc";
export { ProjectRpcs } from "../module/project/project.rpc";
export { TaskRpcs } from "../module/task/task.rpc.interface";
export { TodoRpcs } from "../module/todo/todo.rpc";
