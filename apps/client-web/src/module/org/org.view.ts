import { Button } from "@qaveai/client-ds/button";
import { Input } from "@qaveai/client-ds/input";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import type { OrgModel } from "./org.model";
import { OrgCreateClicked, OrgDraftChanged, OrgSelected, type OrgMessage } from "./org.message";

export const orgSwitcherView = <Message>(model: OrgModel, wrap: (message: OrgMessage) => Message): Html => {
  const { div, form, p, Class, OnSubmit } = html<Message>();

  return div(
    [Class("mb-5 grid gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm")],
    [
      div(
        [Class("flex flex-wrap gap-2")],
        model.orgs.map((item) =>
          Button<Message>({
            onClick: wrap(OrgSelected({ id: item.org.id })),
            variant: item.status === "selected" ? "default" : "secondary",
            size: "sm",
            children: [item.org.name],
          }),
        ),
      ),
      form(
        [Class("grid gap-2 sm:grid-cols-[1fr_auto]"), OnSubmit(wrap(OrgCreateClicked()))],
        [
          Input<Message>({
            id: "org-name",
            value: model.draft,
            onInput: (value) => wrap(OrgDraftChanged({ value })),
            placeholder: "Create an org...",
          }),
          Button<Message>({
            type: "submit",
            isDisabled: model.status.creatingOrg,
            children: [model.status.creatingOrg ? "Creating..." : "New org"],
          }),
        ],
      ),
      model.error ? p([Class("text-sm text-destructive")], [model.error]) : div([], []),
    ],
  );
};
