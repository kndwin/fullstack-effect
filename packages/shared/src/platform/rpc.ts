import { AuthRpcs } from "../module/auth/auth.rpc";
import { OrgRpcs } from "../module/org/org.rpc";
import { ProjectRpcs } from "../module/project/project.rpc";
import { TodoRpcs } from "../module/todo/todo.rpc";

export const AppRpcs = TodoRpcs.merge(ProjectRpcs, OrgRpcs, AuthRpcs);

export { AuthRpcs } from "../module/auth/auth.rpc";
export { OrgRpcs } from "../module/org/org.rpc";
export { ProjectRpcs } from "../module/project/project.rpc";
export { TodoRpcs } from "../module/todo/todo.rpc";
