import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Disclosure } from "./disclosure.view";

const GotPreviewDisclosureMessage = m("GotPreviewDisclosureMessage", {
  disclosure: Schema.Literals(["closed", "open", "disabled"]),
  message: Ui.Disclosure.Message,
});

const Model = Schema.Struct({
  closed: Ui.Disclosure.Model,
  open: Ui.Disclosure.Model,
  disabled: Ui.Disclosure.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  closed: Ui.Disclosure.init({ id: "preview-disclosure-closed" }),
  open: Ui.Disclosure.init({ id: "preview-disclosure-open", isOpen: true }),
  disabled: Ui.Disclosure.init({ id: "preview-disclosure-disabled" }),
});

const update = (model: Model, message: typeof GotPreviewDisclosureMessage.Type): Model => ({
  ...model,
  [message.disclosure]: Ui.Disclosure.update(model[message.disclosure], message.message)[0],
});

export const DisclosurePreview = Preview.module({
  title: "Ui/Disclosure",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, p, Class } = html<typeof GotPreviewDisclosureMessage.Type>();

        return div(
          [Class("grid w-[min(32rem,calc(100vw-4rem))] gap-4")],
          [
            Disclosure({
              model: model.closed,
              toParentMessage: (message) => GotPreviewDisclosureMessage({ disclosure: "closed", message }),
              buttonContent: "What is Foldkit?",
              panelContent: p(
                [Class("m-0")],
                ["A functional UI framework built on Effect with headless accessible primitives."],
              ),
            }),
            Disclosure({
              model: model.open,
              toParentMessage: (message) => GotPreviewDisclosureMessage({ disclosure: "open", message }),
              buttonContent: "Open section",
              panelContent: p(
                [Class("m-0")],
                ["Open panels use the same card, border, and muted foreground tokens as other surfaces."],
              ),
            }),
            Disclosure({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewDisclosureMessage({ disclosure: "disabled", message }),
              buttonContent: "Disabled section",
              panelContent: p([Class("m-0")], ["This content is not reachable while disabled."]),
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        title: Preview.text("Replay disclosure"),
        body: Preview.text("Use scenarios to toggle the panel open and closed."),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.Disclosure.init({ id: "preview-disclosure-replay" }),
      update: Ui.Disclosure.update,
      view: (model: Ui.Disclosure.Model, controls: PreviewControlValues) => {
        const { p, Class } = html<Ui.Disclosure.Message>();

        return Disclosure({
          model,
          toParentMessage: (message) => message,
          buttonContent: String(controls.title),
          panelContent: p([Class("m-0")], [String(controls.body)]),
          isDisabled: Boolean(controls.isDisabled),
        });
      },
      scenarios: [
        Preview.scenario("Open", [Ui.Disclosure.Toggled()]),
        Preview.scenario("Open then close", [Ui.Disclosure.Toggled(), Ui.Disclosure.Toggled()]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewDisclosureMessage]);
