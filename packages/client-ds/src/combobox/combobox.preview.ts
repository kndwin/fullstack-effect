import { Effect, Option, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Combobox } from "./combobox.view";

const GotPreviewComboboxMessage = m("GotPreviewComboboxMessage", {
  combobox: Schema.Literals(["default", "selected", "open", "replay"]),
  message: Ui.Combobox.Message,
});
const SelectedPreviewComboboxItem = m("SelectedPreviewComboboxItem", {
  combobox: Schema.Literals(["default", "selected", "open", "replay"]),
  value: Schema.String,
});

const Model = Schema.Struct({
  defaultCombobox: Ui.Combobox.Model,
  selectedCombobox: Ui.Combobox.Model,
  openCombobox: Ui.Combobox.Model,
  combobox: Ui.Combobox.Model,
  selectedValue: Schema.Option(Schema.String),
});

type Model = typeof Model.Type;

const Message = Schema.Union([GotPreviewComboboxMessage, SelectedPreviewComboboxItem]);

const UpdatedInputValue = (value: string): Ui.Combobox.UpdatedInputValue => ({ _tag: "UpdatedInputValue", value });

const initOpenCombobox = () => Ui.Combobox.open(Ui.Combobox.init({ id: "preview-combobox-open" }))[0];

const keepOpen = (combobox: Ui.Combobox.Model) => Ui.Combobox.open(combobox)[0];

const items = [
  { label: "Inbox", value: "inbox", description: "Customer requests and triage." },
  { label: "Product", value: "product", description: "Roadmap and product design." },
  { label: "Engineering", value: "engineering", description: "Implementation and code review." },
  { label: "Archived", value: "archived", description: "Read-only historical work.", isDisabled: true },
] as const;

const init = (): Model => ({
  defaultCombobox: Ui.Combobox.init({ id: "preview-combobox-default" }),
  selectedCombobox: Ui.Combobox.init({
    id: "preview-combobox-selected",
    selectedItem: "engineering",
    selectedDisplayText: "Engineering",
  }),
  openCombobox: initOpenCombobox(),
  combobox: Ui.Combobox.init({ id: "preview-combobox-replay", selectInputOnFocus: true }),
  selectedValue: Option.none(),
});

const comboboxField = (combobox: typeof GotPreviewComboboxMessage.Type.combobox) => {
  switch (combobox) {
    case "default":
      return "defaultCombobox";
    case "selected":
      return "selectedCombobox";
    case "open":
      return "openCombobox";
    case "replay":
      return "combobox";
  }
};

const update = (model: Model, message: typeof Message.Type) => {
  switch (message._tag) {
    case "GotPreviewComboboxMessage": {
      const sourceCombobox = message.combobox;
      const field = comboboxField(sourceCombobox);
      const [combobox, commands] = Ui.Combobox.update(model[field], message.message);
      const nextCombobox = sourceCombobox === "open" ? keepOpen(combobox) : combobox;

      return [
        { ...model, [field]: nextCombobox },
        commands.map(
          Command.mapEffect(Effect.map((message) => GotPreviewComboboxMessage({ combobox: sourceCombobox, message }))),
        ),
      ] as const;
    }
    case "SelectedPreviewComboboxItem": {
      const sourceCombobox = message.combobox;
      const field = comboboxField(sourceCombobox);
      const item = items.find((item) => item.value === message.value);
      const [combobox, commands] = Ui.Combobox.selectItem(model[field], message.value, item?.label ?? message.value);
      const nextCombobox = sourceCombobox === "open" ? keepOpen(combobox) : combobox;

      return [
        {
          ...model,
          [field]: nextCombobox,
          selectedValue: sourceCombobox === "replay" ? Option.some(message.value) : model.selectedValue,
        },
        commands.map(
          Command.mapEffect(Effect.map((message) => GotPreviewComboboxMessage({ combobox: sourceCombobox, message }))),
        ),
      ] as const;
    }
  }
};

export const ComboboxPreview = Preview.module({
  title: "Ui/Combobox",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, p, Class } = html<typeof Message.Type>();

        return div(
          [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-4")],
          [
            div(
              [Class("grid gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm")],
              [
                p([Class("m-0 text-sm font-medium")], ["Default"]),
                Combobox({
                  model: model.defaultCombobox,
                  toParentMessage: (message) =>
                    GotPreviewComboboxMessage({ combobox: "default", message }) as typeof Message.Type,
                  onSelectedItem: (value) =>
                    SelectedPreviewComboboxItem({ combobox: "default", value }) as typeof Message.Type,
                  items,
                  placeholder: "Search teams",
                }),
              ],
            ),
            div(
              [Class("grid gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm")],
              [
                p([Class("m-0 text-sm font-medium")], ["Selected value"]),
                Combobox({
                  model: model.selectedCombobox,
                  toParentMessage: (message) =>
                    GotPreviewComboboxMessage({ combobox: "selected", message }) as typeof Message.Type,
                  onSelectedItem: (value) =>
                    SelectedPreviewComboboxItem({ combobox: "selected", value }) as typeof Message.Type,
                  items,
                  placeholder: "Search teams",
                }),
              ],
            ),
            div(
              [Class("grid gap-2 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm")],
              [
                p([Class("m-0 text-sm font-medium")], ["Open"]),
                Combobox({
                  model: model.openCombobox,
                  toParentMessage: (message) =>
                    GotPreviewComboboxMessage({ combobox: "open", message }) as typeof Message.Type,
                  onSelectedItem: (value) =>
                    SelectedPreviewComboboxItem({ combobox: "open", value }) as typeof Message.Type,
                  items,
                  placeholder: "Search teams",
                  backdropClassName: "pointer-events-none fixed inset-0",
                }),
              ],
            ),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        placeholder: Preview.text("Search teams"),
      },
      init,
      update,
      view: (model: Model, controls: PreviewControlValues) => {
        const { div, p, Class } = html<typeof Message.Type>();

        return div(
          [
            Class(
              "grid w-[min(30rem,calc(100vw-4rem))] gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm",
            ),
          ],
          [
            div(
              [Class("grid gap-1")],
              [
                p([Class("m-0 text-sm font-semibold")], ["Team routing"]),
                p([Class("m-0 text-sm text-muted-foreground")], ["Search and select a destination queue."]),
              ],
            ),
            Combobox({
              model: model.combobox,
              toParentMessage: (message) =>
                GotPreviewComboboxMessage({ combobox: "replay", message }) as typeof Message.Type,
              onSelectedItem: (value) =>
                SelectedPreviewComboboxItem({ combobox: "replay", value }) as typeof Message.Type,
              items,
              placeholder: String(controls.placeholder),
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Type eng", [
          GotPreviewComboboxMessage({ combobox: "replay", message: UpdatedInputValue("eng") }),
        ]),
        Preview.scenario("Select engineering", [
          SelectedPreviewComboboxItem({ combobox: "replay", value: "engineering" }),
        ]),
        Preview.scenario("Search then select", [
          GotPreviewComboboxMessage({ combobox: "replay", message: UpdatedInputValue("prod") }),
          SelectedPreviewComboboxItem({ combobox: "replay", value: "product" }),
        ]),
      ],
      commandResolutions: {
        FocusInput: [
          {
            label: "Resolve focus",
            message: () =>
              GotPreviewComboboxMessage({ combobox: "replay", message: Ui.Combobox.CompletedFocusInput() }),
          },
        ],
      },
    }),
  ],
});

export { Message };
