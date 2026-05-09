import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Select } from "./select.view";

const ChangedPreviewSelect = m("ChangedPreviewSelect", { value: Schema.String });

const options = [
  { label: "Inbox", value: "inbox" },
  { label: "Product", value: "product" },
  { label: "Engineering", value: "engineering" },
  { label: "Archived", value: "archived", isDisabled: true },
] as const;

const selectStates = () => {
  const { div, Class } = html<typeof ChangedPreviewSelect.Type>();

  return div(
    [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-4")],
    [
      Select({
        id: "preview-select-default",
        label: "Default",
        value: "inbox",
        options,
        onChange: (value) => ChangedPreviewSelect({ value }),
      }),
      Select({
        id: "preview-select-filled",
        label: "Filled",
        description: "Native select behavior with Foldkit ARIA wiring.",
        value: "product",
        options,
        onChange: (value) => ChangedPreviewSelect({ value }),
      }),
      Select({
        id: "preview-select-invalid",
        label: "Invalid",
        description: "Choose a valid project.",
        value: "archived",
        options,
        isInvalid: true,
        onChange: (value) => ChangedPreviewSelect({ value }),
      }),
      Select({
        id: "preview-select-disabled",
        label: "Disabled",
        value: "product",
        options,
        isDisabled: true,
        onChange: (value) => ChangedPreviewSelect({ value }),
      }),
    ],
  );
};

export const SelectPreview = Preview.module({
  title: "Ui/Select",
  previews: [
    Preview.preview({ name: "States", view: selectStates }),
    Preview.preview({
      name: "Replay",
      controls: {
        value: Preview.text("product"),
        isInvalid: Preview.boolean(false),
      },
      view: (controls: PreviewControlValues) =>
        Select({
          id: "preview-select-replay",
          label: "Project",
          description: "Replay selection changes from the Scenarios tab.",
          value: String(controls.value),
          options,
          isInvalid: Boolean(controls.isInvalid),
          onChange: (value) => ChangedPreviewSelect({ value }),
        }),
      scenarios: [
        Preview.scenario("Choose inbox", [ChangedPreviewSelect({ value: "inbox" })]),
        Preview.scenario("Choose sequence", [
          ChangedPreviewSelect({ value: "engineering" }),
          ChangedPreviewSelect({ value: "product" }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ChangedPreviewSelect]);
