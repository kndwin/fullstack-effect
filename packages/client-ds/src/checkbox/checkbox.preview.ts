import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Checkbox } from "./checkbox.view";

const GotPreviewCheckboxMessage = m("GotPreviewCheckboxMessage", {
  checkbox: Schema.Literals(["unchecked", "checked", "indeterminate", "disabled"]),
  message: Ui.Checkbox.Message,
});

const Model = Schema.Struct({
  unchecked: Ui.Checkbox.Model,
  checked: Ui.Checkbox.Model,
  indeterminate: Ui.Checkbox.Model,
  disabled: Ui.Checkbox.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  unchecked: Ui.Checkbox.init({ id: "preview-checkbox-state-unchecked", isChecked: false }),
  checked: Ui.Checkbox.init({ id: "preview-checkbox-state-checked", isChecked: true }),
  indeterminate: Ui.Checkbox.init({ id: "preview-checkbox-state-indeterminate", isChecked: false }),
  disabled: Ui.Checkbox.init({ id: "preview-checkbox-state-disabled", isChecked: true }),
});

const update = (model: Model, message: typeof GotPreviewCheckboxMessage.Type): Model => ({
  ...model,
  [message.checkbox]: Ui.Checkbox.update(model[message.checkbox], message.message)[0],
});

export const CheckboxPreview = Preview.module({
  title: "Ui/Checkbox",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewCheckboxMessage.Type>();

        return div(
          [Class("grid w-[min(30rem,calc(100vw-4rem))] gap-5")],
          [
            Checkbox({
              model: model.unchecked,
              toParentMessage: (message) => GotPreviewCheckboxMessage({ checkbox: "unchecked", message }),
              label: "Unchecked",
              description: "Default unchecked state with a linked label.",
            }),
            Checkbox({
              model: model.checked,
              toParentMessage: (message) => GotPreviewCheckboxMessage({ checkbox: "checked", message }),
              label: "Checked",
              description: "Checked state uses primary tokens.",
            }),
            Checkbox({
              model: model.indeterminate,
              toParentMessage: (message) => GotPreviewCheckboxMessage({ checkbox: "indeterminate", message }),
              label: "Indeterminate",
              description: "Mixed state is styled via data-indeterminate.",
              isIndeterminate: true,
            }),
            Checkbox({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewCheckboxMessage({ checkbox: "disabled", message }),
              label: "Disabled",
              description: "Disabled state preserves accessibility wiring.",
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Replay terms"),
        description: Preview.text("Use the Scenarios tab to toggle this checkbox."),
        isDisabled: Preview.boolean(false),
        isIndeterminate: Preview.boolean(false),
      },
      init: () => Ui.Checkbox.init({ id: "preview-replay", isChecked: false }),
      update: Ui.Checkbox.update,
      view: (model: Ui.Checkbox.Model, controls: PreviewControlValues) =>
        Checkbox({
          model,
          toParentMessage: (message) => message,
          label: String(controls.label),
          description: String(controls.description),
          isDisabled: Boolean(controls.isDisabled),
          isIndeterminate: Boolean(controls.isIndeterminate),
        }),
      scenarios: [
        Preview.scenario("Toggle once", [Ui.Checkbox.Message()]),
        Preview.scenario("Toggle twice", [Ui.Checkbox.Message(), Ui.Checkbox.Message()]),
        Preview.scenario("Toggle three times", [Ui.Checkbox.Message(), Ui.Checkbox.Message(), Ui.Checkbox.Message()]),
        Preview.scenario("Toggle five times", [
          Ui.Checkbox.Message(),
          Ui.Checkbox.Message(),
          Ui.Checkbox.Message(),
          Ui.Checkbox.Message(),
          Ui.Checkbox.Message(),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewCheckboxMessage]);
