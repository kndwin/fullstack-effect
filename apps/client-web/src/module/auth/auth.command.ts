import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { Command } from "foldkit";
import { authHttp } from "../../rpc";
import { AuthFailed, AuthLoaded, AuthLoggedOut } from "./auth.message";

const AuthCommandMe = Command.define("AuthCommandMe", AuthLoaded, AuthFailed);
const AuthCommandLogout = Command.define("AuthCommandLogout", AuthLoggedOut, AuthFailed);

export const loadAuth = AuthCommandMe(
  authHttp.me.pipe(
    Effect.map((session) => AuthLoaded({ session })),
    Effect.catchCause((cause) => Effect.succeed(AuthFailed({ message: Cause.pretty(cause) }))),
  ),
);

export const logout = AuthCommandLogout(
  authHttp.logout.pipe(
    Effect.as(AuthLoggedOut()),
    Effect.catchCause((cause) => Effect.succeed(AuthFailed({ message: Cause.pretty(cause) }))),
  ),
);
