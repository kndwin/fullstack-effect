import { Effect, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Menu, type MenuItem } from "./menu.view";

const GotPreviewMenuMessage = m("GotPreviewMenuMessage", {
  menu: Schema.Literals(["closed", "disabled", "replay"]),
  message: Ui.Menu.Message,
});
const SelectedPreviewMenuItem = m("SelectedPreviewMenuItem", {
  menu: Schema.Literals(["closed", "disabled", "replay"]),
  value: Schema.String,
});

const Model = Schema.Struct({
  closed: Ui.Menu.Model,
  disabled: Ui.Menu.Model,
  menu: Ui.Menu.Model,
  selectedValue: Schema.optional(Schema.String),
});

type Model = typeof Model.Type;

const Message = Schema.Union([GotPreviewMenuMessage, SelectedPreviewMenuItem]);

const items: ReadonlyArray<MenuItem> = [
  { label: "Edit", value: "edit", description: "Update details", group: "Actions" },
  { label: "Duplicate", value: "duplicate", description: "Copy this item", group: "Actions" },
  { label: "Archive", value: "archive", description: "Disabled for drafts", isDisabled: true, group: "Actions" },
  { label: "Delete", value: "delete", description: "Move to trash", group: "Danger" },
];

const init = (): Model => ({
  closed: Ui.Menu.init({ id: "preview-menu-closed", isAnimated: true }),
  disabled: Ui.Menu.init({ id: "preview-menu-disabled" }),
  menu: Ui.Menu.init({ id: "preview-menu-replay", isAnimated: true }),
});

const menuField = (menu: typeof GotPreviewMenuMessage.Type.menu) => {
  switch (menu) {
    case "closed":
      return "closed";
    case "disabled":
      return "disabled";
    case "replay":
      return "menu";
  }
};

const update = (model: Model, message: typeof Message.Type) => {
  switch (message._tag) {
    case "GotPreviewMenuMessage": {
      const sourceMenu = message.menu;
      const field = menuField(sourceMenu);
      const [menu, commands] = Ui.Menu.update(model[field], message.message);

      return [
        { ...model, [field]: menu },
        commands.map(Command.mapEffect(Effect.map((message) => GotPreviewMenuMessage({ menu: sourceMenu, message })))),
      ] as const;
    }
    case "SelectedPreviewMenuItem": {
      const sourceMenu = message.menu;
      const field = menuField(sourceMenu);
      const selectedIndex = items.findIndex((item) => item.value === message.value);
      const [menu, commands] = Ui.Menu.selectItem(model[field], selectedIndex);

      return [
        {
          ...model,
          [field]: menu,
          selectedValue: sourceMenu === "replay" ? message.value : model.selectedValue,
        },
        commands.map(Command.mapEffect(Effect.map((message) => GotPreviewMenuMessage({ menu: sourceMenu, message })))),
      ] as const;
    }
  }
};

export const MenuPreview = Preview.module({
  title: "Ui/Menu",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof Message.Type>();

        return div(
          [Class("flex flex-wrap gap-3")],
          [
            Menu<typeof Message.Type>({
              model: model.closed,
              toParentMessage: (message) => GotPreviewMenuMessage({ menu: "closed", message }),
              items,
              onSelectedItem: (value) => SelectedPreviewMenuItem({ menu: "closed", value }),
              buttonContent: "Actions",
            }),
            Menu<typeof Message.Type>({
              model: model.disabled,
              toParentMessage: (message) => GotPreviewMenuMessage({ menu: "disabled", message }),
              items,
              onSelectedItem: (value) => SelectedPreviewMenuItem({ menu: "disabled", value }),
              buttonContent: "Disabled",
              isDisabled: true,
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init,
      update,
      view: (model: Model) => {
        const { div, p, Class } = html<typeof Message.Type>();

        return div(
          [Class("grid gap-3")],
          [
            Menu<typeof Message.Type>({
              model: model.menu,
              toParentMessage: (message) => GotPreviewMenuMessage({ menu: "replay", message }),
              items,
              onSelectedItem: (value) => SelectedPreviewMenuItem({ menu: "replay", value }),
              buttonContent: "Actions",
            }),
            p([Class("m-0 text-sm text-muted-foreground")], [`Selected: ${model.selectedValue ?? "none"}`]),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Select duplicate", [SelectedPreviewMenuItem({ menu: "replay", value: "duplicate" })]),
      ],
    }),
  ],
});

export { Message };
