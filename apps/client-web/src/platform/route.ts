import { Schema } from "effect";
import { Route } from "foldkit";
import { r } from "foldkit/route";
import { ChannelListRoute, channelRouteParser } from "../module/channel/channel.route";
import { TaskListRoute, taskRouteParser } from "../module/task/task.route";

export const NotFoundRoute = r("NotFound", { path: Schema.String });
export const AppRoute = Schema.Union([ChannelListRoute, TaskListRoute, NotFoundRoute]);
export type AppRoute = typeof AppRoute.Type;

export const routeParser = Route.oneOf(channelRouteParser, taskRouteParser);
export const urlToAppRoute = Route.parseUrlWithFallback(routeParser, NotFoundRoute);
