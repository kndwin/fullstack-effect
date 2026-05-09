import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { evo } from "foldkit/struct";
import { Tooltip } from "./tooltip.view";

const GotPreviewTooltipMessage = m("GotPreviewTooltipMessage", {
  tooltip: Schema.Literals(["default", "disabled"]),
  message: Ui.Tooltip.Message,
});

const Model = Schema.Struct({
  defaultTooltip: Ui.Tooltip.Model,
  disabledTooltip: Ui.Tooltip.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  defaultTooltip: Ui.Tooltip.init({ id: "preview-tooltip-default", showDelay: 0 }),
  disabledTooltip: Ui.Tooltip.init({ id: "preview-tooltip-disabled", showDelay: 0 }),
});

const updateTooltipImmediately = (model: Ui.Tooltip.Model, message: Ui.Tooltip.Message): Ui.Tooltip.Model => {
  const [nextModel] = Ui.Tooltip.update(model, message);

  return message._tag === "EnteredTrigger"
    ? Ui.Tooltip.update(nextModel, Ui.Tooltip.ElapsedShowDelay({ version: nextModel.pendingShowVersion }))[0]
    : nextModel;
};

const update = (model: Model, message: typeof GotPreviewTooltipMessage.Type): Model => {
  switch (message.tooltip) {
    case "default":
      return evo(model, {
        defaultTooltip: () => updateTooltipImmediately(model.defaultTooltip, message.message),
      });
    case "disabled":
      return evo(model, {
        disabledTooltip: () => updateTooltipImmediately(model.disabledTooltip, message.message),
      });
  }
};

export const TooltipPreview = Preview.module({
  title: "Ui/Tooltip",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewTooltipMessage.Type>();

        return div(
          [Class("flex w-[min(32rem,calc(100vw-4rem))] flex-wrap gap-3")],
          [
            Tooltip({
              model: model.defaultTooltip,
              toParentMessage: (message) => GotPreviewTooltipMessage({ tooltip: "default", message }),
              triggerContent: "Hover or focus",
              content: "Tooltips explain an action without changing layout.",
            }),
            Tooltip({
              model: model.disabledTooltip,
              toParentMessage: (message) => GotPreviewTooltipMessage({ tooltip: "disabled", message }),
              triggerContent: "Disabled tooltip",
              content: "This tooltip is disabled.",
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        trigger: Preview.text("Replay tooltip"),
        content: Preview.text("Use scenarios to show and hide the tooltip."),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.Tooltip.init({ id: "preview-tooltip-replay", showDelay: 0 }),
      update: (model: Ui.Tooltip.Model, message: Ui.Tooltip.Message) => updateTooltipImmediately(model, message),
      view: (model: Ui.Tooltip.Model, controls: PreviewControlValues) =>
        Tooltip({
          model,
          toParentMessage: (message) => message,
          triggerContent: String(controls.trigger),
          content: String(controls.content),
          isDisabled: Boolean(controls.isDisabled),
        }),
      scenarios: [
        Preview.scenario("Focus", [Ui.Tooltip.FocusedTrigger()]),
        Preview.scenario("Focus then blur", [Ui.Tooltip.FocusedTrigger(), Ui.Tooltip.BlurredTrigger()]),
        Preview.scenario("Hover then escape", [
          Ui.Tooltip.EnteredTrigger(),
          Ui.Tooltip.ElapsedShowDelay({ version: 1 }),
          Ui.Tooltip.PressedEscape(),
        ]),
      ],
      commandResolutions: {
        ShowAfterDelay: [
          {
            label: "Resolve show delay",
            message: ({ model }) => Ui.Tooltip.ElapsedShowDelay({ version: model.pendingShowVersion }),
          },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([GotPreviewTooltipMessage]);
