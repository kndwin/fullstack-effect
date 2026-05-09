import { Effect, Option, Schema } from "effect";
import { Command, Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Alert, AlertDescription, AlertTitle } from "../alert/alert.view";
import { Button } from "../button/button.view";
import { Combobox } from "../combobox/combobox.view";
import { Dialog, dialogDescriptionId, dialogTitleId } from "../dialog/dialog.view";
import { Textarea } from "../textarea/textarea.view";

const GotAssignDialogMessage = m("GotAssignDialogMessage", { message: Ui.Dialog.Message });
const GotAssignComboboxMessage = m("GotAssignComboboxMessage", { message: Ui.Combobox.Message });
const OpenedAssignDialog = m("OpenedAssignDialog");
const SelectedAssignee = m("SelectedAssignee", { value: Schema.String });
const ChangedAssignmentNote = m("ChangedAssignmentNote", { value: Schema.String });
const ConfirmedAssignment = m("ConfirmedAssignment");
const ClearedAssignmentStatus = m("ClearedAssignmentStatus");

const Message = Schema.Union([
  GotAssignDialogMessage,
  GotAssignComboboxMessage,
  OpenedAssignDialog,
  SelectedAssignee,
  ChangedAssignmentNote,
  ConfirmedAssignment,
  ClearedAssignmentStatus,
]);

type Message = typeof Message.Type;

const Model = Schema.Struct({
  dialog: Ui.Dialog.Model,
  combobox: Ui.Combobox.Model,
  selectedAssignee: Schema.Option(Schema.String),
  note: Schema.String,
  isAssigned: Schema.Boolean,
});

type Model = typeof Model.Type;

const assignees = [
  { label: "Ada Lovelace", value: "ada", description: "Product engineering" },
  { label: "Grace Hopper", value: "grace", description: "Compiler systems" },
  { label: "Katherine Johnson", value: "katherine", description: "Flight operations" },
  { label: "Alan Turing", value: "alan", description: "Research" },
] as const;

const init = (): Model => ({
  dialog: Ui.Dialog.init({ id: "example-assign-dialog" }),
  combobox: Ui.Combobox.init({ id: "example-assign-dialog-combobox", selectInputOnFocus: true }),
  selectedAssignee: Option.none(),
  note: "",
  isAssigned: false,
});

const mapDialogCommands = (commands: ReadonlyArray<Command.Command<Ui.Dialog.Message>>) =>
  commands.map(Command.mapEffect(Effect.map((message) => GotAssignDialogMessage({ message }))));

const mapComboboxCommands = (commands: ReadonlyArray<Command.Command<Ui.Combobox.Message>>) =>
  commands.map(Command.mapEffect(Effect.map((message) => GotAssignComboboxMessage({ message }))));

const update = (model: Model, message: Message) => {
  switch (message._tag) {
    case "GotAssignDialogMessage": {
      const [dialog, commands] = Ui.Dialog.update(model.dialog, message.message);
      return [{ ...model, dialog }, mapDialogCommands(commands)] as const;
    }
    case "GotAssignComboboxMessage": {
      const [combobox, commands] = Ui.Combobox.update(model.combobox, message.message);
      return [{ ...model, combobox }, mapComboboxCommands(commands)] as const;
    }
    case "OpenedAssignDialog": {
      const [dialog, commands] = Ui.Dialog.open(model.dialog);
      return [{ ...model, dialog, isAssigned: false }, mapDialogCommands(commands)] as const;
    }
    case "SelectedAssignee": {
      const item = assignees.find((item) => item.value === message.value);
      const [combobox, commands] = Ui.Combobox.selectItem(model.combobox, message.value, item?.label ?? message.value);
      return [
        { ...model, combobox, selectedAssignee: Option.some(message.value) },
        mapComboboxCommands(commands),
      ] as const;
    }
    case "ChangedAssignmentNote":
      return [{ ...model, note: message.value }, []] as const;
    case "ConfirmedAssignment": {
      const [dialog, commands] = Ui.Dialog.close(model.dialog);
      return [
        { ...model, dialog, isAssigned: Option.isSome(model.selectedAssignee) },
        mapDialogCommands(commands),
      ] as const;
    }
    case "ClearedAssignmentStatus":
      return [{ ...model, isAssigned: false }, []] as const;
  }
};

const selectedAssigneeLabel = (model: Model): string =>
  Option.match(model.selectedAssignee, {
    onNone: () => "No assignee selected",
    onSome: (value) => assignees.find((item) => item.value === value)?.label ?? value,
  });

const UpdatedInputValue = (value: string): Ui.Combobox.UpdatedInputValue => ({ _tag: "UpdatedInputValue", value });

const dialogContent = (model: Model) => {
  const { div, h2, p, Class, Id } = html<Message>();

  return div(
    [Class("grid gap-4")],
    [
      div(
        [Class("grid gap-1")],
        [
          h2([Id(dialogTitleId(model.dialog)), Class("m-0 text-lg font-semibold")], ["Assign request"]),
          p(
            [Id(dialogDescriptionId(model.dialog)), Class("m-0 text-sm leading-6 text-muted-foreground")],
            ["Search inside the dialog, choose an assignee, and confirm the routing decision."],
          ),
        ],
      ),
      Combobox({
        model: model.combobox,
        toParentMessage: (message) => GotAssignComboboxMessage({ message }) as Message,
        onSelectedItem: (value) => SelectedAssignee({ value }) as Message,
        items: assignees,
        placeholder: "Search assignees",
      }),
      Textarea({
        id: "example-assign-dialog-note",
        label: "Assignment note",
        value: model.note,
        rows: 3,
        placeholder: "Add context for the assignee...",
        onInput: (value) => ChangedAssignmentNote({ value }),
      }),
      div(
        [Class("flex items-center justify-between gap-3")],
        [
          p([Class("m-0 text-sm text-muted-foreground")], [selectedAssigneeLabel(model)]),
          div(
            [Class("flex gap-2")],
            [
              Button({
                variant: "outline",
                onClick: GotAssignDialogMessage({ message: Ui.Dialog.Closed() }),
                children: ["Cancel"],
              }),
              Button({
                isDisabled: Option.isNone(model.selectedAssignee),
                onClick: ConfirmedAssignment(),
                children: ["Assign"],
              }),
            ],
          ),
        ],
      ),
    ],
  );
};

export const AssignDialogPreview = Preview.module({
  title: "Example/Assign Dialog",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view: (model: Model) => {
        const { div, p, Class } = html<Message>();

        return div(
          [Class("grid w-[min(38rem,calc(100vw-4rem))] gap-4")],
          [
            div(
              [Class("grid gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm")],
              [
                p(
                  [Class("m-0 text-sm leading-6 text-muted-foreground")],
                  ["Dialog and combobox together exercise nested portal, focus, and selection behavior."],
                ),
                Button({ onClick: OpenedAssignDialog(), children: ["Open assign dialog"] }),
              ],
            ),
            model.isAssigned
              ? Alert({
                  children: [
                    AlertTitle({ children: ["Assigned"] }),
                    AlertDescription({ children: [`Request routed to ${selectedAssigneeLabel(model)}.`] }),
                  ],
                })
              : div([], []),
            Dialog({
              model: model.dialog,
              toParentMessage: (message) => GotAssignDialogMessage({ message }),
              panelContent: dialogContent(model),
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Open dialog", [OpenedAssignDialog()]),
        Preview.scenario("Search assignee", [
          OpenedAssignDialog(),
          GotAssignComboboxMessage({ message: UpdatedInputValue("gra") }),
        ]),
        Preview.scenario("Select assignee", [OpenedAssignDialog(), SelectedAssignee({ value: "grace" })]),
        Preview.scenario("Confirm assignment", [
          OpenedAssignDialog(),
          SelectedAssignee({ value: "ada" }),
          ChangedAssignmentNote({ value: "Please triage this request before noon." }),
          ConfirmedAssignment(),
        ]),
        Preview.scenario("Open then cancel", [
          OpenedAssignDialog(),
          GotAssignDialogMessage({ message: Ui.Dialog.Closed() }),
        ]),
      ],
      commandResolutions: {
        FocusInput: [
          {
            label: "Resolve combobox focus",
            message: () => GotAssignComboboxMessage({ message: Ui.Combobox.CompletedFocusInput() }),
          },
        ],
      },
    }),
  ],
});

export { Message };
