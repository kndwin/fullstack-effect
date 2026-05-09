import { Effect } from "effect";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";
import { Button } from "../button/button.view";
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
  isBackdropDisabled?: boolean;
}>;

const slashMenuPositionMount = <Message>(props: RichTextEditorSlashMenuProps<Message>): Attribute<Message> => {
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

const renderSlashMenuBackdrop = <Message>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { Class, AriaLabel } = html<Message>();
  return Button({
    variant: "ghost",
    onClick: props.toParentMessage(ClosedRichTextEditorSlashMenu()),
    attributes: [
      AriaLabel("Close rich text command menu"),
      Class("fixed inset-0 z-40 h-auto w-auto rounded-none bg-transparent p-0 hover:bg-transparent"),
    ],
    children: [],
  });
};

const renderSlashMenuHeader = <Message>(query: string): Html => {
  const { div, span, Class } = html<Message>();
  return div(
    [
      Class(
        "border-b border-border px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-muted-foreground",
      ),
    ],
    [span([Class("text-foreground")], [`/${query}`])],
  );
};

const renderSlashCommandItem = <Message>({
  command,
  isActive,
  toParentMessage,
}: Readonly<{
  command: RichTextSlashCommand;
  isActive: boolean;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): Html => {
  const { div, p, span, Class, OnClick, Role, Attribute, Tabindex } = html<Message>();

  return div(
    [
      Role("option"),
      Attribute("aria-selected", isActive ? "true" : "false"),
      Tabindex(-1),
      Class(
        `grid cursor-default gap-[var(--space-1)] rounded-md px-[var(--space-list-item-x)] py-[var(--space-list-item-y)] text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] outline-none transition-colors ${isActive ? "bg-accent text-accent-foreground" : ""}`,
      ),
      OnClick(toParentMessage(SelectedRichTextEditorSlashCommand({ value: command.value }))),
    ],
    [
      span([Class("font-medium")], [command.label]),
      p(
        [Class("m-0 text-[length:var(--font-size-xs)] leading-[var(--line-height-xs)] text-muted-foreground")],
        [command.description],
      ),
    ],
  );
};

const renderEmptySlashCommands = <Message>(): Html => {
  const { p, Class } = html<Message>();
  return p(
    [
      Class(
        "m-0 px-[var(--space-list-item-x)] py-[var(--space-list-item-y)] text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-muted-foreground",
      ),
    ],
    ["No commands found."],
  );
};

const renderSlashCommandList = <Message>({
  commands,
  activeIndex,
  toParentMessage,
}: Readonly<{
  commands: ReadonlyArray<RichTextSlashCommand>;
  activeIndex: number;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): Html => {
  const { div, Class, Role, Attribute } = html<Message>();
  return div(
    [
      Role("listbox"),
      Attribute("aria-label", "Rich text commands"),
      Class("max-h-56 overflow-auto p-[var(--space-1)]"),
    ],
    commands.length > 0
      ? commands.map((command, index) =>
          renderSlashCommandItem<Message>({ command, isActive: index === activeIndex, toParentMessage }),
        )
      : [renderEmptySlashCommands<Message>()],
  );
};

const renderSlashMenuPanel = <Message>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { div, Class } = html<Message>();
  const commands = filteredRichTextSlashCommands(props.model.slashMenu.query);
  const activeIndex = normalizeRichTextSlashMenuIndex(props.model.slashMenu.query, props.model.slashMenu.activeIndex);

  return div(
    [Class("absolute left-[var(--space-4)] top-[var(--space-4)] z-50 w-64"), slashMenuPositionMount(props)],
    [
      div(
        [
          Class(
            "overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-[var(--shadow-popover)]",
          ),
        ],
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
    [...(props.isBackdropDisabled ? [] : [renderSlashMenuBackdrop(props)]), renderSlashMenuPanel(props)],
  );
};
