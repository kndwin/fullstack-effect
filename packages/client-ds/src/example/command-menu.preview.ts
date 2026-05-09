import { Effect, Option, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Badge } from "../badge/badge.view";
import { Button } from "../button/button.view";
import { Combobox } from "../combobox/combobox.view";
import { Dialog, dialogDescriptionId, dialogTitleId } from "../dialog/dialog.view";

const GotCommandDialogMessage = m("GotCommandDialogMessage", { message: Ui.Dialog.Message });
const GotCommandComboboxMessage = m("GotCommandComboboxMessage", { message: Ui.Combobox.Message });
const OpenedCommandMenu = m("OpenedCommandMenu");
const SelectedCommand = m("SelectedCommand", { value: Schema.String });

const Message = Schema.Union([GotCommandDialogMessage, GotCommandComboboxMessage, OpenedCommandMenu, SelectedCommand]);
type Message = typeof Message.Type;

const Model = Schema.Struct({
  dialog: Ui.Dialog.Model,
  combobox: Ui.Combobox.Model,
  lastCommand: Schema.Option(Schema.String),
});
type Model = typeof Model.Type;

const commands = [
  { label: "Create project", value: "create-project", description: "Start a new workspace project." },
  { label: "Invite teammate", value: "invite-teammate", description: "Send an invitation email." },
  { label: "Open settings", value: "open-settings", description: "Jump to workspace preferences." },
  { label: "Archive selected", value: "archive-selected", description: "Move selected records to archive." },
] as const;

const optionCommands = [
  ...commands,
  { label: "View analytics", value: "view-analytics", description: "Open the workspace analytics dashboard." },
  { label: "Export report", value: "export-report", description: "Download the latest project summary." },
  { label: "Review inbox", value: "review-inbox", description: "Triage customer requests and internal notes." },
  { label: "Create invoice", value: "create-invoice", description: "Prepare billing for the current account." },
  { label: "Sync integrations", value: "sync-integrations", description: "Refresh connected services and webhooks." },
  { label: "Manage access", value: "manage-access", description: "Update roles, permissions, and team membership." },
  { label: "Open roadmap", value: "open-roadmap", description: "Review active product priorities." },
  { label: "Schedule review", value: "schedule-review", description: "Create a follow-up meeting for stakeholders." },
] as const;

const init = (): Model => ({
  dialog: Ui.Dialog.init({ id: "example-command-menu-dialog" }),
  combobox: Ui.Combobox.init({ id: "example-command-menu-combobox", selectInputOnFocus: true }),
  lastCommand: Option.none(),
});

const mapDialogCommands = (items: ReadonlyArray<Command.Command<Ui.Dialog.Message>>) =>
  items.map(Command.mapEffect(Effect.map((message) => GotCommandDialogMessage({ message }))));
const mapComboboxCommands = (items: ReadonlyArray<Command.Command<Ui.Combobox.Message>>) =>
  items.map(Command.mapEffect(Effect.map((message) => GotCommandComboboxMessage({ message }))));

const update = (model: Model, message: Message) => {
  switch (message._tag) {
    case "GotCommandDialogMessage": {
      const [dialog, commands] = Ui.Dialog.update(model.dialog, message.message);
      return [{ ...model, dialog }, mapDialogCommands(commands)] as const;
    }
    case "GotCommandComboboxMessage": {
      const [combobox, commands] = Ui.Combobox.update(model.combobox, message.message);
      return [{ ...model, combobox }, mapComboboxCommands(commands)] as const;
    }
    case "OpenedCommandMenu": {
      const [dialog, commands] = Ui.Dialog.open(model.dialog);
      return [{ ...model, dialog }, mapDialogCommands(commands)] as const;
    }
    case "SelectedCommand": {
      const [dialog, dialogCommands] = Ui.Dialog.close(model.dialog);
      const item = optionCommands.find((item) => item.value === message.value);
      const [combobox, comboboxCommands] = Ui.Combobox.selectItem(
        model.combobox,
        message.value,
        item?.label ?? message.value,
      );
      return [
        { ...model, dialog, combobox, lastCommand: Option.some(message.value) },
        [...mapDialogCommands(dialogCommands), ...mapComboboxCommands(comboboxCommands)],
      ] as const;
    }
  }
};

const labelFor = (value: string): string => optionCommands.find((item) => item.value === value)?.label ?? value;
const UpdatedInputValue = (value: string): Ui.Combobox.UpdatedInputValue => ({ _tag: "UpdatedInputValue", value });

export const CommandMenuPreview = Preview.module({
  title: "Example/Command Menu",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view: (model: Model) => {
        const { div, h2, p, Class, Id } = html<Message>();
        return div(
          [Class("grid w-[min(36rem,calc(100vw-4rem))] gap-4")],
          [
            div(
              [Class("grid gap-3 rounded-xl border border-border bg-card p-5 shadow-sm")],
              [
                p(
                  [Class("m-0 text-sm leading-6 text-muted-foreground")],
                  ["Command menu preview for action search, dialog focus, and result feedback."],
                ),
                div(
                  [Class("flex items-center gap-2")],
                  [
                    Button({ onClick: OpenedCommandMenu(), children: ["Open command menu"] }),
                    Option.match(model.lastCommand, {
                      onNone: () => Badge({ variant: "secondary", children: ["No command"] }),
                      onSome: (value) => Badge({ children: [labelFor(value)] }),
                    }),
                  ],
                ),
              ],
            ),
            Dialog({
              model: model.dialog,
              toParentMessage: (message) => GotCommandDialogMessage({ message }),
              panelContent: div(
                [Class("grid gap-4")],
                [
                  div(
                    [Class("grid gap-1")],
                    [
                      h2([Id(dialogTitleId(model.dialog)), Class("m-0 text-lg font-semibold")], ["Run command"]),
                      p(
                        [Id(dialogDescriptionId(model.dialog)), Class("m-0 text-sm text-muted-foreground")],
                        ["Search for an action and select it to close the dialog."],
                      ),
                    ],
                  ),
                  Combobox({
                    model: model.combobox,
                    toParentMessage: (message) => GotCommandComboboxMessage({ message }) as Message,
                    onSelectedItem: (value) => SelectedCommand({ value }) as Message,
                    items: commands,
                    placeholder: "Search commands",
                  }),
                ],
              ),
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Open", [OpenedCommandMenu()]),
        Preview.scenario("Search settings", [
          OpenedCommandMenu(),
          GotCommandComboboxMessage({ message: UpdatedInputValue("settings") }),
        ]),
        Preview.scenario("Run command", [OpenedCommandMenu(), SelectedCommand({ value: "invite-teammate" })]),
      ],
      commandResolutions: {
        FocusInput: [
          {
            label: "Resolve combobox focus",
            message: () => GotCommandComboboxMessage({ message: Ui.Combobox.CompletedFocusInput() }),
          },
        ],
      },
    }),
    Preview.preview({
      name: "Dialog Options",
      init,
      update,
      view: (model: Model) => {
        const { div, h2, p, Class, Id } = html<Message>();

        return div(
          [Class("grid w-[min(38rem,calc(100vw-4rem))] gap-4")],
          [
            div(
              [Class("grid gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm")],
              [
                div(
                  [Class("grid gap-1")],
                  [
                    p([Class("m-0 text-sm font-semibold")], ["Combobox options dialog"]),
                    p(
                      [Class("m-0 text-sm leading-6 text-muted-foreground")],
                      ["Open the dialog to see every option, then type to filter the list down."],
                    ),
                  ],
                ),
                div(
                  [Class("flex items-center gap-2")],
                  [
                    Button({ onClick: OpenedCommandMenu(), children: ["Open options"] }),
                    Option.match(model.lastCommand, {
                      onNone: () => Badge({ variant: "secondary", children: ["No option"] }),
                      onSome: (value) => Badge({ children: [labelFor(value)] }),
                    }),
                  ],
                ),
              ],
            ),
            Dialog({
              model: model.dialog,
              toParentMessage: (message) => GotCommandDialogMessage({ message }),
              panelClassName:
                "fixed left-1/2 top-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0",
              panelContent: div(
                [Class("grid gap-0")],
                [
                  Combobox({
                    model: model.combobox,
                    toParentMessage: (message) => GotCommandComboboxMessage({ message }) as Message,
                    onSelectedItem: (value) => SelectedCommand({ value }) as Message,
                    items: optionCommands,
                    placeholder: "Type a command or search...",
                    inputWrapperClassName: "flex w-full items-stretch [--combobox-input-width:100%]",
                    inputClassName:
                      "h-12 w-full min-w-0 flex-1 rounded-md border border-input bg-background px-4 py-3 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring data-disabled:cursor-not-allowed data-disabled:opacity-50",
                    buttonClassName: "hidden",
                    itemsClassName:
                      "z-50 max-h-[24rem] w-[var(--combobox-input-width)] min-w-0 overflow-auto rounded-b-lg border-0 border-t border-border bg-popover p-1 text-popover-foreground shadow-none outline-none",
                    itemClassName:
                      "relative cursor-default rounded-md px-3 py-2 text-sm outline-none transition-colors data-active:bg-accent data-active:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
                  }),
                ],
              ),
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Open options", [OpenedCommandMenu()]),
        Preview.scenario("Filter options", [
          OpenedCommandMenu(),
          GotCommandComboboxMessage({ message: UpdatedInputValue("review") }),
        ]),
        Preview.scenario("Filter then select", [
          OpenedCommandMenu(),
          GotCommandComboboxMessage({ message: UpdatedInputValue("access") }),
          SelectedCommand({ value: "manage-access" }),
        ]),
      ],
      commandResolutions: {
        FocusInput: [
          {
            label: "Resolve combobox focus",
            message: () => GotCommandComboboxMessage({ message: Ui.Combobox.CompletedFocusInput() }),
          },
        ],
      },
    }),
  ],
});

export { Message };
