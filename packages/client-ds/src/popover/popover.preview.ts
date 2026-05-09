import { Effect, Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Button } from "../button/button.view";
import { Popover } from "./popover.view";

const GotPreviewPopoverMessage = m("GotPreviewPopoverMessage", {
  popover: Schema.Literals(["closed", "disabled"]),
  message: Ui.Popover.Message,
});
const ClickedPopoverAction = m("ClickedPopoverAction");

const Model = Schema.Struct({
  closed: Ui.Popover.Model,
  disabled: Ui.Popover.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  closed: Ui.Popover.init({ id: "preview-popover-closed" }),
  disabled: Ui.Popover.init({ id: "preview-popover-open" }),
});

const update = (model: Model, message: typeof GotPreviewPopoverMessage.Type) => {
  const sourcePopover = message.popover;
  const [popover, commands] = Ui.Popover.update(model[sourcePopover], message.message);

  return [
    { ...model, [sourcePopover]: popover },
    commands.map(
      Command.mapEffect(Effect.map((message) => GotPreviewPopoverMessage({ popover: sourcePopover, message }))),
    ),
  ] as const;
};

const panel = <Message>() => {
  const { div, p, Class } = html<Message>();

  return div(
    [Class("grid gap-3")],
    [
      div(
        [Class("grid gap-1")],
        [
          p([Class("m-0 text-sm font-medium")], ["Workspace actions"]),
          p(
            [Class("m-0 text-sm text-muted-foreground")],
            ["Quick contextual actions inside an anchored floating panel."],
          ),
        ],
      ),
      Button({ onClick: ClickedPopoverAction() as Message, size: "sm", children: ["Create project"] }),
    ],
  );
};

export const PopoverPreview = Preview.module({
  title: "Ui/Popover",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewPopoverMessage.Type>();

        return div(
          [Class("flex w-[min(32rem,calc(100vw-4rem))] flex-wrap gap-3")],
          [
            Popover({
              model: model.closed,
              toParentMessage: (message) => GotPreviewPopoverMessage({ popover: "closed", message }),
              buttonContent: "Open popover",
              panelContent: panel(),
            }),
            Popover({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewPopoverMessage({ popover: "disabled", message }),
              buttonContent: "Disabled popover",
              panelContent: panel(),
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Replay popover"),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.Popover.init({ id: "preview-popover-replay" }),
      update: Ui.Popover.update,
      view: (model: Ui.Popover.Model, controls: PreviewControlValues) =>
        Popover({
          model,
          toParentMessage: (message) => message,
          buttonContent: String(controls.label),
          panelContent: panel(),
          isDisabled: Boolean(controls.isDisabled),
        }),
      scenarios: [
        Preview.scenario("Open", [Ui.Popover.Opened()]),
        Preview.scenario("Open then close", [Ui.Popover.Opened(), Ui.Popover.Closed()]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewPopoverMessage, ClickedPopoverAction]);
