import { Match } from "effect";
import { Command } from "foldkit";
import { createOrg, loadOrgs } from "./org.command";
import type { OrgModel } from "./org.model";
import { OrgMessage } from "./org.message";

const idleStatus: OrgModel["status"] = { loadingOrgs: false, creatingOrg: false };

export const selectedOrgId = (model: OrgModel) =>
  model.orgs.find((item) => item.status === "selected")?.org.id ?? model.orgs[0]?.org.id ?? null;

export const init = () => [{ draft: "", orgs: [], status: { ...idleStatus }, error: null }, []] as const;

export const update = (
  model: OrgModel,
  message: OrgMessage,
): readonly [OrgModel, ReadonlyArray<Command.Command<OrgMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [OrgModel, ReadonlyArray<Command.Command<OrgMessage>>]>(),
    Match.tagsExhaustive({
      OrgStarted: () => [{ ...model, status: { ...model.status, loadingOrgs: true }, error: null }, [loadOrgs]],
      OrgDraftChanged: ({ value }) => [{ ...model, draft: value }, []],
      OrgCreateClicked: () => {
        const name = model.draft.trim();
        return name.length === 0
          ? [model, []]
          : [{ ...model, draft: "", status: { ...model.status, creatingOrg: true }, error: null }, [createOrg(name)]];
      },
      OrgSelected: ({ id }) => [
        { ...model, orgs: model.orgs.map((item) => ({ ...item, status: item.org.id === id ? "selected" : "idle" })) },
        [],
      ],
      OrgLoaded: ({ orgs }) => [
        {
          ...model,
          orgs: orgs.map((org, index) => ({ org, status: index === 0 ? "selected" : "idle" })),
          status: { ...model.status, loadingOrgs: false },
          error: null,
        },
        [],
      ],
      OrgCreated: ({ org }) => [
        {
          ...model,
          orgs: [...model.orgs.map((item) => ({ ...item, status: "idle" as const })), { org, status: "selected" }],
          status: { ...model.status, creatingOrg: false },
          error: null,
        },
        [],
      ],
      OrgFailed: ({ message }) => [{ ...model, status: idleStatus, error: message }, []],
    }),
  );
