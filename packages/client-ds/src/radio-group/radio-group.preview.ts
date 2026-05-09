import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { RadioGroup } from "./radio-group.view";

const GotPreviewRadioGroupMessage = m("GotPreviewRadioGroupMessage", {
  radioGroup: Schema.Literals(["vertical", "horizontal", "disabled"]),
  message: Ui.RadioGroup.Message,
});

const Model = Schema.Struct({
  vertical: Ui.RadioGroup.Model,
  horizontal: Ui.RadioGroup.Model,
  disabled: Ui.RadioGroup.Model,
});

type Model = typeof Model.Type;

const plans = [
  { label: "Startup", value: "startup", description: "12GB / 6 CPUs for small projects." },
  { label: "Business", value: "business", description: "16GB / 8 CPUs for growing teams." },
  { label: "Enterprise", value: "enterprise", description: "Dedicated infrastructure and controls." },
  { label: "Legacy", value: "legacy", description: "Unavailable for new workspaces.", isDisabled: true },
] as const;

const init = (): Model => ({
  vertical: Ui.RadioGroup.init({ id: "preview-radio-vertical", selectedValue: "business" }),
  horizontal: Ui.RadioGroup.init({
    id: "preview-radio-horizontal",
    selectedValue: "startup",
    orientation: "Horizontal",
  }),
  disabled: Ui.RadioGroup.init({ id: "preview-radio-disabled", selectedValue: "enterprise" }),
});

const update = (model: Model, message: typeof GotPreviewRadioGroupMessage.Type): Model => ({
  ...model,
  [message.radioGroup]: Ui.RadioGroup.update(model[message.radioGroup], message.message)[0],
});

export const RadioGroupPreview = Preview.module({
  title: "Ui/Radio Group",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewRadioGroupMessage.Type>();

        return div(
          [Class("grid w-[min(38rem,calc(100vw-4rem))] gap-6")],
          [
            RadioGroup({
              model: model.vertical,
              toParentMessage: (message) => GotPreviewRadioGroupMessage({ radioGroup: "vertical", message }),
              ariaLabel: "Server plan",
              options: plans,
            }),
            RadioGroup({
              model: model.horizontal,
              toParentMessage: (message) => GotPreviewRadioGroupMessage({ radioGroup: "horizontal", message }),
              ariaLabel: "Horizontal server plan",
              orientation: "Horizontal",
              options: plans.slice(0, 3),
            }),
            RadioGroup({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewRadioGroupMessage({ radioGroup: "disabled", message }),
              ariaLabel: "Disabled server plan",
              options: plans.slice(0, 3),
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        orientation: Preview.select("Vertical", ["Vertical", "Horizontal"]),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.RadioGroup.init({ id: "preview-radio-replay", selectedValue: "startup" }),
      update: Ui.RadioGroup.update,
      view: (model: Ui.RadioGroup.Model, controls: PreviewControlValues) =>
        RadioGroup({
          model,
          toParentMessage: (message) => message,
          ariaLabel: "Replay server plan",
          orientation: controls.orientation === "Horizontal" ? "Horizontal" : "Vertical",
          options: plans.slice(0, 3),
          isDisabled: Boolean(controls.isDisabled),
        }),
      scenarios: [
        Preview.scenario("Choose business", [Ui.RadioGroup.SelectedOption({ value: "business", index: 1 })]),
        Preview.scenario("Choose enterprise", [Ui.RadioGroup.SelectedOption({ value: "enterprise", index: 2 })]),
        Preview.scenario("Cycle selections", [
          Ui.RadioGroup.SelectedOption({ value: "business", index: 1 }),
          Ui.RadioGroup.SelectedOption({ value: "enterprise", index: 2 }),
          Ui.RadioGroup.SelectedOption({ value: "startup", index: 0 }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewRadioGroupMessage]);
