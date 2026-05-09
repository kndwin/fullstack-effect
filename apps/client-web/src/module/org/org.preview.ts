import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import {
  OrgCreateClicked,
  OrgCreated,
  OrgDraftChanged,
  OrgFailed,
  OrgLoaded,
  OrgMessage,
  OrgSelected,
  OrgStarted,
} from "./org.message";
import type { OrgModel } from "./org.model";
import { update } from "./org.update";
import { orgSwitcherView } from "./org.view";

const orgA = { id: "org_acme", name: "Acme" };
const orgB = { id: "org_labs", name: "Labs" };
const orgs = [orgA, orgB];
const wrap = (message: typeof OrgMessage.Type) => message;
const idleStatus = { loadingOrgs: false, creatingOrg: false };
const frame = (model: OrgModel) => orgSwitcherView(model, wrap);

export const OrgPreview = Preview.module({
  title: "Module/Org",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof OrgMessage.Type>();
        const example = (label: string, model: OrgModel) =>
          div([Class("grid gap-3")], [h2([Class("text-sm font-medium text-muted-foreground")], [label]), frame(model)]);
        return div(
          [Class("w-[min(42rem,calc(100vw-4rem))] grid gap-8")],
          [
            example("No orgs", { draft: "", orgs: [], status: idleStatus, error: null }),
            example("Selected", {
              draft: "",
              orgs: orgs.map((org, index) => ({ org, status: index === 0 ? "selected" : "idle" })),
              status: idleStatus,
              error: null,
            }),
            example("Creating", {
              draft: "New org",
              orgs: [{ org: orgA, status: "selected" }],
              status: { ...idleStatus, creatingOrg: true },
              error: null,
            }),
            example("Error", {
              draft: "",
              orgs: [{ org: orgA, status: "selected" }],
              status: idleStatus,
              error: "Could not create org.",
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init: (): OrgModel => ({ draft: "", orgs: [], status: { ...idleStatus, loadingOrgs: true }, error: null }),
      update,
      view: frame,
      scenarios: [
        Preview.scenario("Load orgs", [OrgStarted(), OrgLoaded({ orgs })]),
        Preview.scenario("Create org", [
          OrgLoaded({ orgs: [orgA] }),
          OrgDraftChanged({ value: "Design" }),
          OrgCreateClicked(),
          OrgCreated({ org: { id: "org_design", name: "Design" } }),
        ]),
        Preview.scenario("Select org", [OrgLoaded({ orgs }), OrgSelected({ id: orgB.id })]),
        Preview.scenario("Create failed", [
          OrgLoaded({ orgs: [orgA] }),
          OrgDraftChanged({ value: "Bad org" }),
          OrgCreateClicked(),
          OrgFailed({ message: "Org name is unavailable." }),
        ]),
        Preview.scenario("Kitchen sink", [
          OrgStarted(),
          Preview.step(OrgLoaded({ orgs }), { delayMs: 400 }),
          OrgSelected({ id: orgB.id }),
          OrgDraftChanged({ value: "Design" }),
          OrgCreateClicked(),
          Preview.step(OrgCreated({ org: { id: "org_design", name: "Design" } }), { delayMs: 500 }),
          OrgSelected({ id: orgA.id }),
          OrgDraftChanged({ value: "Acme" }),
          OrgCreateClicked(),
          Preview.step(OrgFailed({ message: "Org already exists." }), { delayMs: 500 }),
        ]),
      ],
      commandResolutions: {
        OrgCommandLoad: [{ label: "Resolve loaded", message: () => OrgLoaded({ orgs }) }],
        OrgCommandCreate: [
          { label: "Resolve created", message: () => OrgCreated({ org: { id: "org_created", name: "Created org" } }) },
          { label: "Resolve failed", message: () => OrgFailed({ message: "Mocked org create failed." }) },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([OrgMessage]);
