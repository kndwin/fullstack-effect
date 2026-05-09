import { Schema } from "effect";

export const OrgSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

export const OrgRoleSchema = Schema.Union([Schema.Literal("owner"), Schema.Literal("member")]);

export const OrgMembershipSchema = Schema.Struct({
  orgId: Schema.String,
  userId: Schema.String,
  role: OrgRoleSchema,
});

export class ErrorOrgInvalidName extends Schema.TaggedErrorClass<ErrorOrgInvalidName>()("ErrorOrgInvalidName", {
  message: Schema.String,
}) {}
