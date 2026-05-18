import { pipe } from "effect";
import { Route } from "foldkit";
import { literal, r } from "foldkit/route";

export const TaskListRoute = r("TaskList");
export type TaskListRoute = typeof TaskListRoute.Type;

export const taskListRouter = () => "/tasks";

export const taskRouteParser = pipe(literal("tasks"), Route.mapTo(TaskListRoute));
