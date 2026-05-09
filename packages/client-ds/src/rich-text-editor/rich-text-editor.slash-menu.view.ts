import { Effect } from "effect";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";
import { filteredRichTextSlashCommands, normalizeRichTextSlashMenuIndex } from "./rich-text-editor.commands";
import { positionRichTextSlashMenu } from "./rich-text-editor.dom";
import {
  ClosedRichTextEditorSlashMenu,
  RestoredRichTextEditorSelection,
  SelectedRichTextEditorSlashCommand,
  type RichTextEditorMessage,
  type RichTextEditorModel,
} from "./rich-text-editor.schema";
import type { RichTextSlashCommand } from "./rich-text-editor.commands";

export type RichTextEditorSlashMenuProps<Message> = Readonly<{
  model: RichTextEditorModel;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>;

const slashMenuPositionMount = <Message,>(props: RichTextEditorSlashMenuProps<Message>): Attribute<Message> => {
  const { OnMount } = html<Message>();
  return OnMount({
    name: "position-rich-text-editor-slash-menu",
    f: (element) =>
      Effect.sync(() => {
        requestAnimationFrame(() => {
          if (element instanceof HTMLElement) positionRichTextSlashMenu(element, props.model.selection);
        });
        return { message: props.toParentMessage(RestoredRichTextEditorSelection()), cleanup: () => undefined };
      }),
  });
};

const renderSlashMenuBackdrop = <Message,>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { div, Class, OnClick } = html<Message>();
  return div([Class("fixed inset-0 z-40"), OnClick(props.toParentMessage(ClosedRichTextEditorSlashMenu()))], []);
};

const renderSlashMenuHeader = <Message,>(query: string): Html => {
  const { div, span, Class } = html<Message>();
  return div([Class("border-b border-border px-3 py-2 text-sm text-muted-foreground")], [
    span([Class("text-foreground")], [`/${query}`]),
  ]);
};

const renderSlashCommandItem = <Message,>({
  command,
  isActive,
  toParentMessage,
}: Readonly<{
  command: RichTextSlashCommand;
  isActive: boolean;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): Html => {
  const { div, p, span, Class, OnClick } = html<Message>();

  return div(
    [
      Class(
        `grid cursor-default gap-0.5 rounded-md px-3 py-2 text-sm outline-none transition-colors ${isActive ? "bg-accent text-accent-foreground" : ""}`,
      ),
      OnClick(toParentMessage(SelectedRichTextEditorSlashCommand({ value: command.value }))),
    ],
    [
      span([Class("font-medium")], [command.label]),
      p([Class("m-0 text-xs text-muted-foreground")], [command.description]),
    ],
  );
};

const renderEmptySlashCommands = <Message,>(): Html => {
  const { p, Class } = html<Message>();
  return p([Class("m-0 px-3 py-2 text-sm text-muted-foreground")], ["No commands found."]);
};

const renderSlashCommandList = <Message,>({
  commands,
  activeIndex,
  toParentMessage,
}: Readonly<{
  commands: ReadonlyArray<RichTextSlashCommand>;
  activeIndex: number;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): Html => {
  const { div, Class } = html<Message>();
  return div(
    [Class("max-h-56 overflow-auto p-1")],
    commands.length > 0
      ? commands.map((command, index) =>
          renderSlashCommandItem<Message>({ command, isActive: index === activeIndex, toParentMessage })
        )
      : [renderEmptySlashCommands<Message>()],
  );
};

const renderSlashMenuPanel = <Message,>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { div, Class } = html<Message>();
  const commands = filteredRichTextSlashCommands(props.model.slashMenu.query);
  const activeIndex = normalizeRichTextSlashMenuIndex(props.model.slashMenu.query, props.model.slashMenu.activeIndex);

  return div(
    [Class("absolute left-4 top-4 z-50 w-64"), slashMenuPositionMount(props)],
    [
      div(
        [Class("overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-[var(--shadow-popover)]")],
        [
          renderSlashMenuHeader<Message>(props.model.slashMenu.query),
          renderSlashCommandList<Message>({ commands, activeIndex, toParentMessage: props.toParentMessage }),
        ],
      ),
    ],
  );
};

export const RichTextEditorSlashMenu = <Message>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { div, Class } = html<Message>();
  return div(
    [Class("contents")],
    [renderSlashMenuBackdrop(props), renderSlashMenuPanel(props)],
  );
};
