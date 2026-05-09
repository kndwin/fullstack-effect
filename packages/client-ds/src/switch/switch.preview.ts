import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Switch } from "./switch.view";

const GotPreviewSwitchMessage = m("GotPreviewSwitchMessage", {
  switch: Schema.Literals(["off", "on", "disabled"]),
  message: Ui.Switch.Message,
});

const Model = Schema.Struct({
  off: Ui.Switch.Model,
  on: Ui.Switch.Model,
  disabled: Ui.Switch.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  off: Ui.Switch.init({ id: "preview-switch-off", isChecked: false }),
  on: Ui.Switch.init({ id: "preview-switch-on", isChecked: true }),
  disabled: Ui.Switch.init({ id: "preview-switch-disabled", isChecked: true }),
});

const update = (model: Model, message: typeof GotPreviewSwitchMessage.Type): Model => ({
  ...model,
  [message.switch]: Ui.Switch.update(model[message.switch], message.message)[0],
});

export const SwitchPreview = Preview.module({
  title: "Ui/Switch",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewSwitchMessage.Type>();

        return div(
          [Class("grid w-[min(30rem,calc(100vw-4rem))] gap-5")],
          [
            Switch({
              model: model.off,
              toParentMessage: (message) => GotPreviewSwitchMessage({ switch: "off", message }),
              label: "Off",
              description: "Unchecked state uses the input/border token.",
            }),
            Switch({
              model: model.on,
              toParentMessage: (message) => GotPreviewSwitchMessage({ switch: "on", message }),
              label: "On",
              description: "Checked state uses the primary Radix scale.",
            }),
            Switch({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewSwitchMessage({ switch: "disabled", message }),
              label: "Disabled",
              description: "Disabled state keeps the label relationship intact.",
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Replay switch"),
        description: Preview.text("Use the Scenarios tab to toggle this switch."),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.Switch.init({ id: "preview-switch-replay", isChecked: false }),
      update: Ui.Switch.update,
      view: (model: Ui.Switch.Model, controls: PreviewControlValues) =>
        Switch({
          model,
          toParentMessage: (message) => message,
          label: String(controls.label),
          description: String(controls.description),
          isDisabled: Boolean(controls.isDisabled),
        }),
      scenarios: [
        Preview.scenario("Toggle once", [Ui.Switch.Message()]),
        Preview.scenario("Toggle twice", [Ui.Switch.Message(), Ui.Switch.Message()]),
        Preview.scenario("Toggle three times", [Ui.Switch.Message(), Ui.Switch.Message(), Ui.Switch.Message()]),
        Preview.scenario("Toggle five times", [
          Ui.Switch.Message(),
          Ui.Switch.Message(),
          Ui.Switch.Message(),
          Ui.Switch.Message(),
          Ui.Switch.Message(),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewSwitchMessage]);
