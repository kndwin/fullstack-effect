import { Effect, Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Listbox } from "./listbox.view";

const GotPreviewListboxMessage = m("GotPreviewListboxMessage", {
  listbox: Schema.Literals(["default", "selected", "invalid", "disabled"]),
  message: Ui.Listbox.Message,
});

const Model = Schema.Struct({
  default: Ui.Listbox.Model,
  selected: Ui.Listbox.Model,
  invalid: Ui.Listbox.Model,
  disabled: Ui.Listbox.Model,
});

type Model = typeof Model.Type;

const items = [
  { label: "Inbox", value: "inbox", description: "Customer requests and triage." },
  { label: "Product", value: "product", description: "Roadmap and product design." },
  { label: "Engineering", value: "engineering", description: "Implementation and code review." },
  { label: "Archived", value: "archived", description: "Read-only historical work.", isDisabled: true },
] as const;

const init = (): Model => ({
  default: Ui.Listbox.init({ id: "preview-listbox-default" }),
  selected: Ui.Listbox.init({ id: "preview-listbox-selected", selectedItem: "engineering" }),
  invalid: Ui.Listbox.init({ id: "preview-listbox-invalid", selectedItem: "archived" }),
  disabled: Ui.Listbox.init({ id: "preview-listbox-disabled", selectedItem: "product" }),
});

const update = (model: Model, message: typeof GotPreviewListboxMessage.Type) => {
  const sourceListbox = message.listbox;
  const [listbox, commands] = Ui.Listbox.update(model[sourceListbox], message.message);

  return [
    { ...model, [sourceListbox]: listbox },
    commands.map(
      Command.mapEffect(Effect.map((message) => GotPreviewListboxMessage({ listbox: sourceListbox, message }))),
    ),
  ] as const;
};

export const ListboxPreview = Preview.module({
  title: "Ui/Listbox",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewListboxMessage.Type>();

        return div(
          [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-4")],
          [
            Listbox({
              model: model.default,
              toParentMessage: (message) => GotPreviewListboxMessage({ listbox: "default", message }),
              items,
              placeholder: "Choose a team",
            }),
            Listbox({
              model: model.selected,
              toParentMessage: (message) => GotPreviewListboxMessage({ listbox: "selected", message }),
              items,
              placeholder: "Choose a team",
            }),
            Listbox({
              model: model.invalid,
              toParentMessage: (message) => GotPreviewListboxMessage({ listbox: "invalid", message }),
              items,
              isInvalid: true,
            }),
            Listbox({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewListboxMessage({ listbox: "disabled", message }),
              items,
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        placeholder: Preview.text("Choose a team"),
        isInvalid: Preview.boolean(false),
        isDisabled: Preview.boolean(false),
      },
      init: () => Ui.Listbox.init({ id: "preview-listbox-replay" }),
      update: Ui.Listbox.update,
      view: (model: Ui.Listbox.Model, controls: PreviewControlValues) =>
        Listbox({
          model,
          toParentMessage: (message) => message,
          items,
          placeholder: String(controls.placeholder),
          isInvalid: Boolean(controls.isInvalid),
          isDisabled: Boolean(controls.isDisabled),
        }),
      scenarios: [
        Preview.scenario("Select product", [Ui.Listbox.SelectedItem({ item: "product" })]),
        Preview.scenario("Select engineering", [Ui.Listbox.SelectedItem({ item: "engineering" })]),
        Preview.scenario("Select sequence", [
          Ui.Listbox.SelectedItem({ item: "product" }),
          Ui.Listbox.SelectedItem({ item: "engineering" }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewListboxMessage]);
