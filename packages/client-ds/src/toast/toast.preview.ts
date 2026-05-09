import { Duration, Effect, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { evo } from "foldkit/struct";
import { Preview } from "@qaveai/foldkit-preview";
import { Button } from "../button/button.view";
import { Toast, ToastViewport } from "./toast.view";

const GotPreviewToastMessage = m("GotPreviewToastMessage", {
  message: Toast.Message,
});
const ShowedInfoToast = m("ShowedInfoToast");
const ShowedSuccessToast = m("ShowedSuccessToast");
const ShowedErrorToast = m("ShowedErrorToast");
const DismissedAllPreviewToasts = m("DismissedAllPreviewToasts");

const Model = Schema.Struct({
  toast: Toast.Model,
});

type Model = typeof Model.Type;

const Message = Schema.Union([
  GotPreviewToastMessage,
  ShowedInfoToast,
  ShowedSuccessToast,
  ShowedErrorToast,
  DismissedAllPreviewToasts,
]);

const init = (): Model => ({
  toast: Toast.init({ id: "preview-toast", defaultDuration: Duration.seconds(6) }),
});

const mapToastCommands = (commands: ReturnType<typeof Toast.show>[1]) =>
  commands.map(Command.mapEffect(Effect.map((message) => GotPreviewToastMessage({ message }))));

const newestDismissableEntry = (model: Model) =>
  [...model.toast.entries].reverse().find((entry) => entry.maybeDuration._tag === "Some");

const update = (model: Model, message: typeof Message.Type) => {
  switch (message._tag) {
    case "GotPreviewToastMessage": {
      const [toast, commands] = Toast.update(model.toast, message.message);

      return [evo(model, { toast: () => toast }), mapToastCommands(commands)] as const;
    }
    case "ShowedInfoToast": {
      const [toast, commands] = Toast.show(model.toast, {
        variant: "Info",
        payload: { title: "Build queued", description: "Preview assets are being regenerated." },
      });

      return [evo(model, { toast: () => toast }), mapToastCommands(commands)] as const;
    }
    case "ShowedSuccessToast": {
      const [toast, commands] = Toast.show(model.toast, {
        variant: "Success",
        payload: {
          title: "Changes saved",
          description: "Your workspace settings were updated.",
          actionLabel: "View details",
        },
      });

      return [evo(model, { toast: () => toast }), mapToastCommands(commands)] as const;
    }
    case "ShowedErrorToast": {
      const [toast, commands] = Toast.show(model.toast, {
        variant: "Error",
        sticky: true,
        payload: { title: "Deploy failed", description: "Production checks rejected this build." },
      });

      return [evo(model, { toast: () => toast }), mapToastCommands(commands)] as const;
    }
    case "DismissedAllPreviewToasts": {
      const [toast, commands] = Toast.dismissAll(model.toast);

      return [evo(model, { toast: () => toast }), mapToastCommands(commands)] as const;
    }
  }
};

export const ToastPreview = Preview.module({
  title: "Ui/Toast",
  previews: [
    Preview.preview({
      name: "Replay",
      init,
      update,
      view: (model: Model) => {
        const { div, p, Class } = html<typeof Message.Type>();

        return div(
          [Class("grid w-[min(32rem,calc(100vw-4rem))] gap-4")],
          [
            div(
              [Class("grid gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground")],
              [
                p(
                  [Class("m-0 text-sm text-muted-foreground")],
                  ["Use scenarios or buttons to push transient notifications into the viewport."],
                ),
                div(
                  [Class("flex flex-wrap gap-2")],
                  [
                    Button({ onClick: ShowedInfoToast(), size: "sm", variant: "outline", children: ["Info"] }),
                    Button({ onClick: ShowedSuccessToast(), size: "sm", children: ["Success"] }),
                    Button({ onClick: ShowedErrorToast(), size: "sm", variant: "destructive", children: ["Error"] }),
                    Button({
                      onClick: DismissedAllPreviewToasts(),
                      size: "sm",
                      variant: "ghost",
                      children: ["Dismiss all"],
                    }),
                  ],
                ),
              ],
            ),
            ToastViewport({ model: model.toast, toParentMessage: (message) => GotPreviewToastMessage({ message }) }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Show info", [ShowedInfoToast()]),
        Preview.scenario("Show success", [ShowedSuccessToast()]),
        Preview.scenario("Stack toasts", [ShowedInfoToast(), ShowedSuccessToast(), ShowedErrorToast()]),
        Preview.scenario("Stack then dismiss all", [
          ShowedInfoToast(),
          ShowedSuccessToast(),
          DismissedAllPreviewToasts(),
        ]),
      ],
      commandResolutions: {
        DismissAfter: [
          {
            label: "Resolve auto-dismiss",
            message: ({ model }) => {
              const entry = newestDismissableEntry(model);

              return GotPreviewToastMessage({
                message: Ui.Toast.ElapsedDuration({
                  entryId: entry?.id ?? "missing-entry",
                  version: entry?.pendingDismissVersion ?? 0,
                }),
              });
            },
          },
        ],
      },
    }),
  ],
});

export { Message };
