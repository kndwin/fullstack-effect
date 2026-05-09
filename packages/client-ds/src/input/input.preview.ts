import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Input } from "./input.view";

const ChangedPreviewInput = m("ChangedPreviewInput", { value: Schema.String });

const inputStates = () => {
  const { div, Class } = html<typeof ChangedPreviewInput.Type>();

  return div(
    [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-4")],
    [
      Input({
        id: "preview-input-default",
        label: "Default",
        value: "",
        placeholder: "Type something...",
        onInput: (value) => ChangedPreviewInput({ value }),
      }),
      Input({
        id: "preview-input-filled",
        label: "Filled",
        description: "A normal populated input.",
        value: "ada@example.com",
        onInput: (value) => ChangedPreviewInput({ value }),
      }),
      Input({
        id: "preview-input-invalid",
        label: "Invalid",
        description: "This field needs a valid value.",
        value: "not-valid",
        isInvalid: true,
        onInput: (value) => ChangedPreviewInput({ value }),
      }),
      Input({
        id: "preview-input-disabled",
        label: "Disabled",
        value: "Locked value",
        isDisabled: true,
        onInput: (value) => ChangedPreviewInput({ value }),
      }),
    ],
  );
};

export const InputPreview = Preview.module({
  title: "Ui/Input",
  previews: [
    Preview.preview({ name: "States", view: inputStates }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Email"),
        value: Preview.text("ada@example.com"),
        isInvalid: Preview.boolean(false),
      },
      view: (controls: PreviewControlValues) =>
        Input({
          id: "preview-input-replay",
          label: String(controls.label),
          description: "Replay input events from the Scenarios tab.",
          value: String(controls.value),
          placeholder: "name@example.com",
          isInvalid: Boolean(controls.isInvalid),
          onInput: (value) => ChangedPreviewInput({ value }),
        }),
      scenarios: [
        Preview.scenario("Type email", [ChangedPreviewInput({ value: "ada@example.com" })]),
        Preview.scenario("Edit twice", [
          ChangedPreviewInput({ value: "ada@" }),
          ChangedPreviewInput({ value: "ada@example.com" }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ChangedPreviewInput]);
