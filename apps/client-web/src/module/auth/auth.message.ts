import { AuthSessionSchema } from "@qaveai/shared/module/auth/auth.schema";
import { Schema } from "effect";
import { m } from "foldkit/message";

export const AuthStarted = m("AuthStarted");
export const AuthLoaded = m("AuthLoaded", { session: Schema.NullOr(AuthSessionSchema) });
export const AuthLogoutClicked = m("AuthLogoutClicked");
export const AuthLoggedOut = m("AuthLoggedOut");
export const AuthFailed = m("AuthFailed", { message: Schema.String });

export const AuthMessage = Schema.Union([AuthStarted, AuthLoaded, AuthLogoutClicked, AuthLoggedOut, AuthFailed]);
export type AuthMessage = typeof AuthMessage.Type;
