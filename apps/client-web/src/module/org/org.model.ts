import { OrgSchema } from "@qaveai/shared/module/org/org.schema";
import { Schema } from "effect";

export const OrgItemStatus = Schema.Union([Schema.Literal("idle"), Schema.Literal("selected")]);
export type OrgItemStatus = typeof OrgItemStatus.Type;

export const OrgItem = Schema.Struct({ org: OrgSchema, status: OrgItemStatus });
export type OrgItem = typeof OrgItem.Type;

export const OrgModel = Schema.Struct({
  draft: Schema.String,
  orgs: Schema.Array(OrgItem),
  status: Schema.Struct({ loadingOrgs: Schema.Boolean, creatingOrg: Schema.Boolean }),
  error: Schema.NullOr(Schema.String),
});
export type OrgModel = typeof OrgModel.Type;
