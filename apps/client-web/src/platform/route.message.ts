import { Schema } from "effect";
import { Runtime } from "foldkit";
import { m } from "foldkit/message";

export const ClickedLink = m("ClickedLink", { request: Runtime.UrlRequest });
export const ChangedUrl = m("ChangedUrl", { url: Schema.Any });
export const CompletedNavigateInternal = m("CompletedNavigateInternal");
export const CompletedLoadExternal = m("CompletedLoadExternal");

export const RouteMessage = Schema.Union([ClickedLink, ChangedUrl, CompletedNavigateInternal, CompletedLoadExternal]);
export type RouteMessage = typeof RouteMessage.Type;
