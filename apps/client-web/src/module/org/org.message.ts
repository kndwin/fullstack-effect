import { OrgSchema } from "@qaveai/shared/module/org/org.schema";
import { Schema } from "effect";
import { m } from "foldkit/message";

export const OrgStarted = m("OrgStarted");
export const OrgDraftChanged = m("OrgDraftChanged", { value: Schema.String });
export const OrgCreateClicked = m("OrgCreateClicked");
export const OrgSelected = m("OrgSelected", { id: Schema.String });
export const OrgLoaded = m("OrgLoaded", { orgs: Schema.Array(OrgSchema) });
export const OrgCreated = m("OrgCreated", { org: OrgSchema });
export const OrgFailed = m("OrgFailed", { message: Schema.String });

export const OrgMessage = Schema.Union([
  OrgStarted,
  OrgDraftChanged,
  OrgCreateClicked,
  OrgSelected,
  OrgLoaded,
  OrgCreated,
  OrgFailed,
]);
export type OrgMessage = typeof OrgMessage.Type;
