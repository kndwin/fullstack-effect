import { Schema, pipe } from "effect";
import { Route } from "foldkit";
import { literal, r, slash, string } from "foldkit/route";

export const ProjectListRoute = r("ProjectList");
export const ProjectDetailRoute = r("ProjectDetail", { projectId: Schema.String });
export const ProjectTodoDetailRoute = r("ProjectTodoDetail", { projectId: Schema.String, todoId: Schema.String });

export const projectListRouter = pipe(literal("projects"), Route.mapTo(ProjectListRoute));
export const projectDetailRouter = pipe(
  literal("projects"),
  slash(string("projectId")),
  Route.mapTo(ProjectDetailRoute),
);
export const projectTodoDetailRouter = pipe(
  literal("projects"),
  slash(string("projectId")),
  slash(string("todoId")),
  Route.mapTo(ProjectTodoDetailRoute),
);
export const projectRouteParser = Route.oneOf(projectTodoDetailRouter, projectDetailRouter, projectListRouter);
