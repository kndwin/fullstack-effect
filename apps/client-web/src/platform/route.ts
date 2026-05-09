import { Schema } from "effect";
import { Route } from "foldkit";
import { r } from "foldkit/route";
import {
  ProjectDetailRoute,
  ProjectListRoute,
  ProjectTodoDetailRoute,
  projectRouteParser,
} from "../module/project/project.route";
import { TodoListRoute, todoListRouter } from "../module/todo/todo.route";

export const NotFoundRoute = r("NotFound", { path: Schema.String });
export const AppRoute = Schema.Union([
  TodoListRoute,
  ProjectListRoute,
  ProjectDetailRoute,
  ProjectTodoDetailRoute,
  NotFoundRoute,
]);
export type AppRoute = typeof AppRoute.Type;

export const routeParser = Route.oneOf(projectRouteParser, todoListRouter);
export const urlToAppRoute = Route.parseUrlWithFallback(routeParser, NotFoundRoute);
