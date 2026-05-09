import { AuthSessionSchema } from "@qaveai/shared/module/auth/auth.schema";
import { Schema } from "effect";

export const AuthModel = Schema.Struct({
  session: Schema.NullOr(AuthSessionSchema),
  loading: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
});
export type AuthModel = typeof AuthModel.Type;
