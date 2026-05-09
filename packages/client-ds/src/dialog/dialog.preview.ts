import { Effect, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { evo } from "foldkit/struct";
import { Preview } from "@qaveai/foldkit-preview";
import { Button } from "../button/button.view";
import { Dialog, dialogDescriptionId, dialogTitleId } from "./dialog.view";

const GotPreviewDialogMessage = m("GotPreviewDialogMessage", {
  message: Ui.Dialog.Message,
});
const OpenedPreviewDialog = m("OpenedPreviewDialog");

const Model = Schema.Struct({
  dialog: Ui.Dialog.Model,
});

type Model = typeof Model.Type;

const Message = Schema.Union([GotPreviewDialogMessage, OpenedPreviewDialog]);

const init = (): Model => ({
  dialog: Ui.Dialog.init({ id: "preview-dialog-replay" }),
});

const update = (model: Model, message: typeof Message.Type) => {
  switch (message._tag) {
    case "GotPreviewDialogMessage": {
      const [dialog, commands] = Ui.Dialog.update(model.dialog, message.message);

      return [
        evo(model, { dialog: () => dialog }),
        commands.map(Command.mapEffect(Effect.map((message) => GotPreviewDialogMessage({ message })))),
      ] as const;
    }
    case "OpenedPreviewDialog": {
      const [dialog, commands] = Ui.Dialog.open(model.dialog);

      return [
        evo(model, { dialog: () => dialog }),
        commands.map(Command.mapEffect(Effect.map((message) => GotPreviewDialogMessage({ message })))),
      ] as const;
    }
  }
};

const content = <Message>(model: Ui.Dialog.Model, closeMessage: Message) => {
  const { div, h2, p, Class, Id } = html<Message>();

  return div(
    [Class("grid gap-4")],
    [
      div(
        [Class("grid gap-1")],
        [
          h2([Id(dialogTitleId(model)), Class("m-0 text-lg font-semibold")], ["Confirm deploy"]),
          p(
            [Id(dialogDescriptionId(model)), Class("m-0 text-sm text-muted-foreground")],
            ["This will publish the current workspace to production."],
          ),
        ],
      ),
      div(
        [Class("flex justify-end gap-2")],
        [
          Button({ onClick: closeMessage, variant: "outline", children: ["Cancel"] }),
          Button({ onClick: closeMessage, children: ["Deploy"] }),
        ],
      ),
    ],
  );
};

export const DialogPreview = Preview.module({
  title: "Ui/Dialog",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, Class } = html<typeof Message.Type>();
        const closed = Ui.Dialog.init({ id: "preview-dialog-closed" });
        const open = Ui.Dialog.init({ id: "preview-dialog-open", isOpen: true });

        return div(
          [Class("flex flex-wrap gap-3")],
          [
            Dialog({
              model: closed,
              toParentMessage: (message) => GotPreviewDialogMessage({ message }),
              panelContent: content(closed, GotPreviewDialogMessage({ message: Ui.Dialog.Closed() })),
            }),
            Dialog({
              model: open,
              toParentMessage: (message) => GotPreviewDialogMessage({ message }),
              panelContent: content(open, GotPreviewDialogMessage({ message: Ui.Dialog.Closed() })),
            }),
            Button({ onClick: GotPreviewDialogMessage({ message: Ui.Dialog.Opened() }), children: ["Open dialog"] }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof Message.Type>();

        return div(
          [Class("flex flex-wrap gap-3")],
          [
            Button({ onClick: OpenedPreviewDialog(), children: ["Open dialog"] }),
            Dialog({
              model: model.dialog,
              toParentMessage: (message) => GotPreviewDialogMessage({ message }),
              panelContent: content(model.dialog, GotPreviewDialogMessage({ message: Ui.Dialog.Closed() })),
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Open", [OpenedPreviewDialog()]),
        Preview.scenario("Open then close", [
          OpenedPreviewDialog(),
          GotPreviewDialogMessage({ message: Ui.Dialog.Closed() }),
        ]),
      ],
    }),
  ],
});

export { Message };
