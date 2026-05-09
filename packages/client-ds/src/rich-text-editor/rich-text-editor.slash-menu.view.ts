import { Effect } from "effect";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import { filteredRichTextSlashCommands, normalizeRichTextSlashMenuIndex } from "./rich-text-editor.commands";
import { positionRichTextSlashMenu } from "./rich-text-editor.dom";
import {
  ClosedRichTextEditorSlashMenu,
  RestoredRichTextEditorSelection,
  SelectedRichTextEditorSlashCommand,
  type RichTextEditorMessage,
  type RichTextEditorModel,
} from "./rich-text-editor.schema";

export type RichTextEditorSlashMenuProps<Message> = Readonly<{
  model: RichTextEditorModel;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>;

export const RichTextEditorSlashMenu = <Message>(props: RichTextEditorSlashMenuProps<Message>): Html => {
  const { div, p, span, Class, OnClick, OnMount } = html<Message>();
  const visibleSlashCommands = filteredRichTextSlashCommands(props.model.slashMenu.query);
  const activeSlashCommandIndex = normalizeRichTextSlashMenuIndex(props.model.slashMenu.query, props.model.slashMenu.activeIndex);

  return div(
    [Class("contents")],
    [
      div([Class("fixed inset-0 z-40"), OnClick(props.toParentMessage(ClosedRichTextEditorSlashMenu()))], []),
      div(
        [
          Class("absolute left-4 top-4 z-50 w-64"),
          OnMount({
            name: "position-rich-text-editor-slash-menu",
            f: (element) =>
              Effect.sync(() => {
                requestAnimationFrame(() => {
                  if (element instanceof HTMLElement) positionRichTextSlashMenu(element, props.model.selection);
                });
                return { message: props.toParentMessage(RestoredRichTextEditorSelection()), cleanup: () => undefined };
              }),
          }),
        ],
        [
          div(
            [Class("overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-[var(--shadow-popover)]")],
            [
              div([Class("border-b border-border px-3 py-2 text-sm text-muted-foreground")], [
                span([Class("text-foreground")], [`/${props.model.slashMenu.query}`]),
              ]),
              div(
                [Class("max-h-56 overflow-auto p-1")],
                visibleSlashCommands.length > 0
                  ? visibleSlashCommands.map((command, index) =>
                      div(
                        [
                          Class(
                            `grid cursor-default gap-0.5 rounded-md px-3 py-2 text-sm outline-none transition-colors ${index === activeSlashCommandIndex ? "bg-accent text-accent-foreground" : ""}`,
                          ),
                          OnClick(props.toParentMessage(SelectedRichTextEditorSlashCommand({ value: command.value }))),
                        ],
                        [
                          span([Class("font-medium")], [command.label]),
                          p([Class("m-0 text-xs text-muted-foreground")], [command.description]),
                        ],
                      )
                    )
                  : [p([Class("m-0 px-3 py-2 text-sm text-muted-foreground")], ["No commands found."])],
              ),
            ],
          ),
        ],
      ),
    ],
  );
};
