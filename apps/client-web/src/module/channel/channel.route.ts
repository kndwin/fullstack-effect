import { pipe } from "effect";
import { Route } from "foldkit";
import { literal, r } from "foldkit/route";

export const ChannelListRoute = r("ChannelList");
export type ChannelListRoute = typeof ChannelListRoute.Type;

export const channelListRouter = () => "/channels";

export const channelRouteParser = pipe(literal("channels"), Route.mapTo(ChannelListRoute));
