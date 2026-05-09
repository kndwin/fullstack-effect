import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Button } from "../button/button.view";
import { Input } from "../input/input.view";
import { Select } from "../select/select.view";
import { Textarea } from "../textarea/textarea.view";
import { Fieldset } from "./fieldset.view";

const ChangedFieldsetText = m("ChangedFieldsetText", { value: Schema.String });
const ChangedFieldsetSelect = m("ChangedFieldsetSelect", { value: Schema.String });
const ClickedFieldsetSave = m("ClickedFieldsetSave");

export const FieldsetPreview = Preview.module({
  title: "Ui/Fieldset",
  previews: [
    Preview.preview({
      name: "States",
      controls: {
        isDisabled: Preview.boolean(false),
      },
      view: (controls: PreviewControlValues) => {
        const { div, Class } = html<typeof Message.Type>();

        return div(
          [Class("w-[min(34rem,calc(100vw-4rem))]")],
          [
            Fieldset({
              id: "preview-profile-fieldset",
              legend: "Profile",
              description: "Grouped controls with native disabled propagation.",
              isDisabled: Boolean(controls.isDisabled),
              children: [
                Input({
                  id: "fieldset-name",
                  label: "Name",
                  value: "Ada Lovelace",
                  onInput: (value) => ChangedFieldsetText({ value }),
                }),
                Select({
                  id: "fieldset-role",
                  label: "Role",
                  value: "admin",
                  options: [
                    { label: "Admin", value: "admin" },
                    { label: "Member", value: "member" },
                  ],
                  onChange: (value) => ChangedFieldsetSelect({ value }),
                }),
                Textarea({
                  id: "fieldset-notes",
                  label: "Notes",
                  value: "Prefers concise UI systems.",
                  rows: 3,
                  onInput: (value) => ChangedFieldsetText({ value }),
                }),
                Button({ onClick: ClickedFieldsetSave(), children: ["Save profile"] }),
              ],
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      view: () => {
        const { div, Class } = html<typeof Message.Type>();

        return div(
          [Class("w-[min(34rem,calc(100vw-4rem))]")],
          [
            Fieldset({
              id: "preview-replay-fieldset",
              legend: "Replay profile",
              description: "Replay nested field changes and submit actions.",
              children: [
                Input({
                  id: "fieldset-replay-name",
                  label: "Name",
                  value: "Ada Lovelace",
                  onInput: (value) => ChangedFieldsetText({ value }),
                }),
                Select({
                  id: "fieldset-replay-role",
                  label: "Role",
                  value: "admin",
                  options: [
                    { label: "Admin", value: "admin" },
                    { label: "Member", value: "member" },
                  ],
                  onChange: (value) => ChangedFieldsetSelect({ value }),
                }),
                Textarea({
                  id: "fieldset-replay-notes",
                  label: "Notes",
                  value: "Prefers concise UI systems.",
                  rows: 3,
                  onInput: (value) => ChangedFieldsetText({ value }),
                }),
                Button({ onClick: ClickedFieldsetSave(), children: ["Save profile"] }),
              ],
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Edit name", [ChangedFieldsetText({ value: "Grace Hopper" })]),
        Preview.scenario("Change role and save", [ChangedFieldsetSelect({ value: "member" }), ClickedFieldsetSave()]),
        Preview.scenario("Full edit", [
          ChangedFieldsetText({ value: "Grace Hopper" }),
          ChangedFieldsetSelect({ value: "member" }),
          ChangedFieldsetText({ value: "Compiler pioneer." }),
          ClickedFieldsetSave(),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ChangedFieldsetText, ChangedFieldsetSelect, ClickedFieldsetSave]);
