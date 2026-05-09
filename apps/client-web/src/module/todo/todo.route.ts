import { pipe } from "effect";
import { Route } from "foldkit";
import { r } from "foldkit/route";

export const TodoListRoute = r("TodoList");

export const todoListRouter = pipe(Route.root, Route.mapTo(TodoListRoute));
