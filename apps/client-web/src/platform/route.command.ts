import * as Effect from "effect/Effect";
import { Command, Navigation } from "foldkit";
import { toString as urlToString, type Url } from "foldkit/url";
import { CompletedLoadExternal, CompletedNavigateInternal } from "./route.message";

const NavigateInternal = Command.define("NavigateInternal", CompletedNavigateInternal);
const LoadExternal = Command.define("LoadExternal", CompletedLoadExternal);

export const navigateInternal = (url: Url) =>
  NavigateInternal(Navigation.pushUrl(urlToString(url)).pipe(Effect.as(CompletedNavigateInternal())));

export const loadExternal = (href: string) =>
  LoadExternal(Navigation.load(href).pipe(Effect.as(CompletedLoadExternal())));
