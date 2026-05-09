import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Textarea } from "./textarea.view";

const ChangedPreviewTextarea = m("ChangedPreviewTextarea", { value: Schema.String });

const textareaStates = () => {
  const { div, Class } = html<typeof ChangedPreviewTextarea.Type>();

  return div(
    [Class("grid w-[min(32rem,calc(100vw-4rem))] gap-4")],
    [
      Textarea({
        id: "preview-textarea-default",
        label: "Default",
        value: "",
        placeholder: "Type a longer response...",
        rows: 4,
        onInput: (value) => ChangedPreviewTextarea({ value }),
      }),
      Textarea({
        id: "preview-textarea-filled",
        label: "Filled",
        description: "A normal populated textarea.",
        value: "Foldkit handles behavior; Radix colors handle the skin.",
        rows: 4,
        onInput: (value) => ChangedPreviewTextarea({ value }),
      }),
      Textarea({
        id: "preview-textarea-invalid",
        label: "Invalid",
        description: "This response is too short.",
        value: "No",
        rows: 3,
        isInvalid: true,
        onInput: (value) => ChangedPreviewTextarea({ value }),
      }),
      Textarea({
        id: "preview-textarea-disabled",
        label: "Disabled",
        value: "Locked notes",
        rows: 3,
        isDisabled: true,
        onInput: (value) => ChangedPreviewTextarea({ value }),
      }),
    ],
  );
};

export const TextareaPreview = Preview.module({
  title: "Ui/Textarea",
  previews: [
    Preview.preview({ name: "States", view: textareaStates }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Bio"),
        value: Preview.text("Foldkit handles behavior; Radix colors handle the skin."),
        isInvalid: Preview.boolean(false),
      },
      view: (controls: PreviewControlValues) =>
        Textarea({
          id: "preview-textarea-replay",
          label: String(controls.label),
          description: "Replay textarea input events from the Scenarios tab.",
          value: String(controls.value),
          placeholder: "Tell us about yourself...",
          rows: 4,
          isInvalid: Boolean(controls.isInvalid),
          onInput: (value) => ChangedPreviewTextarea({ value }),
        }),
      scenarios: [
        Preview.scenario("Short note", [ChangedPreviewTextarea({ value: "Short note" })]),
        Preview.scenario("Draft then revise", [
          ChangedPreviewTextarea({ value: "Draft" }),
          ChangedPreviewTextarea({ value: "Revised draft with more context." }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ChangedPreviewTextarea]);
