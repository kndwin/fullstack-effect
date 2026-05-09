import { Schema } from "effect";

export const AuthProviderSchema = Schema.Union([Schema.Literal("google")]);

export const UserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  avatarUrl: Schema.NullOr(Schema.String),
});

export const SessionUserSchema = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  name: Schema.String,
  avatarUrl: Schema.NullOr(Schema.String),
});

export const AuthSessionSchema = Schema.Struct({
  user: SessionUserSchema,
});

export class ErrorAuthInvalidOAuthState extends Schema.TaggedErrorClass<ErrorAuthInvalidOAuthState>()(
  "ErrorAuthInvalidOAuthState",
  {},
) {}

export class ErrorAuthProviderFailed extends Schema.TaggedErrorClass<ErrorAuthProviderFailed>()(
  "ErrorAuthProviderFailed",
  { message: Schema.String },
) {}
