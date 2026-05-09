import { Effect, Function } from "effect";
import { Mount } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html, MountResult } from "foldkit/html";
import { Button } from "../button/button.view";
import { blockText } from "./rich-text-editor.document";
import { restoreRichTextDomSelection } from "./rich-text-editor.dom";
import { initRichTextEditor, richTextEditorPlainText } from "./rich-text-editor.model";
import {
  ParagraphNode,
  richTextBlockToolbarItems,
  richTextMarkClassNameForMarks,
  richTextMarkToolbarItems,
  richTextRenderBlock,
} from "./rich-text-editor.registry";
import {
  ChangedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  FailedMountRichTextEditorHost,
  InsertedRichTextEditorText,
  MountedRichTextEditorHost,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  RestoredRichTextEditorSelection,
  RichTextEditorMessage,
  SetRichTextEditorBlockFormat,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  ToggledRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  type RichTextEditorModel,
  type RichTextBlockNode,
  type RichTextSelection,
} from "./rich-text-editor.schema";
import type { RichTextMarkType } from "./nodes/mark.schema";
import { RichTextEditorSlashMenu } from "./rich-text-editor.slash-menu.view";
import { richTextEditorSubscriptions, type RichTextEditorSubscriptionOptions } from "./rich-text-editor.subscriptions";
import { updateRichTextEditor } from "./rich-text-editor.update";

export {
  ChangedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  FailedMountRichTextEditorHost,
  InsertedRichTextEditorText,
  MountedRichTextEditorHost,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  RestoredRichTextEditorSelection,
  RichTextEditorMessage,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  SetRichTextEditorBlockFormat,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ToggledRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  initRichTextEditor,
  richTextEditorPlainText,
  richTextEditorSubscriptions,
  updateRichTextEditor,
};
export type { RichTextEditorModel, RichTextEditorSubscriptionOptions };

export type RichTextEditorProps<Message> = Readonly<{
  id: string;
  model: RichTextEditorModel;
  toParentMessage: (message: RichTextEditorMessage) => Message;
  label?: string;
  description?: string;
  placeholder?: string;
  rows?: number;
  isDisabled?: boolean;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const MountRichTextEditorHost = Mount.define(
  "MountRichTextEditorHost",
  MountedRichTextEditorHost,
  FailedMountRichTextEditorHost,
);

const mountRichTextEditorHost = <Message,>({
  id,
  selection,
  toParentMessage,
}: Readonly<{
  id: string;
  selection: RichTextSelection;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>) => {
  const mount = MountRichTextEditorHost(
    (element: Element) =>
      Effect.sync(() => {
        if (!(element instanceof HTMLElement)) {
          return {
            message: FailedMountRichTextEditorHost({ reason: "Rich text editor host is not an HTMLElement." }),
            cleanup: Function.constVoid,
          };
        }

        Object.defineProperty(element, "value", {
          configurable: true,
          get: () => element.innerText,
        });

        requestAnimationFrame(() => {
          restoreRichTextDomSelection(element, selection);
        });

        return {
          message: MountedRichTextEditorHost({ id }),
          cleanup: () => {
            delete (element as { value?: string }).value;
          },
        };
      }),
  );

  return {
    name: mount.name,
    f: (element: Element): Effect.Effect<MountResult<Message>> =>
      mount.f(element).pipe(
        Effect.map(({ message, cleanup }) => ({
          message: toParentMessage(message),
          cleanup,
        })),
      ),
  };
};

const blockStartOffset = ({
  blocks,
  blockIndex,
}: Readonly<{ blocks: ReadonlyArray<RichTextBlockNode>; blockIndex: number }>): number =>
  blocks
    .slice(0, blockIndex)
    .reduce((offset, previousBlock) => offset + blockText(previousBlock).length + 1, 0);

const renderBlockInlineContent = <Message,>({
  block,
  blockStart,
  selection,
}: Readonly<{
  block: RichTextBlockNode;
  blockStart: number;
  selection: RichTextSelection;
}>): ReadonlyArray<Html | string> => {
  let textOffset = blockStart;

  return block.children.flatMap((node, inlineIndex) => {
    const rendered = ParagraphNode.renderTextNode<Message>({
      node,
      index: inlineIndex,
      start: textOffset,
      selection,
      markClassNameForMarks: richTextMarkClassNameForMarks,
    });
    textOffset += node.text.length;
    return rendered;
  });
};

const renderEmptyBlockFallback = <Message,>({
  blockIndex,
  blockStart,
  placeholder,
}: Readonly<{
  blockIndex: number;
  blockStart: number;
  placeholder: string;
}>): Html => {
  if (blockIndex === 0) {
    return ParagraphNode.renderPlaceholder<Message>({ placeholder, start: blockStart, className: "text-muted-foreground/55" });
  }
  return ParagraphNode.renderPlaceholder<Message>({ placeholder: " ", start: blockStart, className: "whitespace-pre" });
};

const renderBlockNode = <Message,>({
  block,
  blockIndex,
  blocks,
  selection,
  placeholder,
}: Readonly<{
  block: RichTextBlockNode;
  blockIndex: number;
  blocks: ReadonlyArray<RichTextBlockNode>;
  selection: RichTextSelection;
  placeholder: string;
}>): Html => {
  const blockStart = blockStartOffset({ blocks, blockIndex });
  const blockContent = blockText(block).length > 0
    ? renderBlockInlineContent<Message>({ block, blockStart, selection })
    : [renderEmptyBlockFallback<Message>({ blockIndex, blockStart, placeholder })];

  return richTextRenderBlock<Message>(block, blockContent);
};

const renderDocument = <Message,>({
  blocks,
  selection,
  placeholder,
}: Readonly<{
  blocks: ReadonlyArray<RichTextBlockNode>;
  selection: RichTextSelection;
  placeholder: string;
}>): ReadonlyArray<Html> =>
  blocks.map((block, blockIndex) =>
    renderBlockNode<Message>({ block, blockIndex, blocks, selection, placeholder })
  );

const markToolbarMessage = (type: RichTextMarkType): RichTextEditorMessage => ToggledRichTextEditorMark({ type });

export const RichTextEditor = <Message>(props: RichTextEditorProps<Message>): Html => {
  const {
    div,
    p,
    span,
    Class,
    AriaLabel,
    Attribute,
    Contenteditable,
    Id,
    Key,
    OnMount,
    Role,
    Spellcheck,
    Tabindex,
  } = html<Message>();
  const plainText = richTextEditorPlainText(props.model);
  const editorClassName =
    "min-h-28 rounded-md border border-border bg-muted px-3 py-2 text-foreground outline-none transition-colors empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-disabled:opacity-50";

  return div(
    [...(props.attributes ?? []), Class("grid w-full gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm")],
    [
      div(
        [Class("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between")],
        [
          div([Class("grid gap-1")], [
            span([Class("text-sm font-medium leading-none text-foreground")], [props.label ?? "Rich text editor"]),
            p([Class("m-0 text-sm text-muted-foreground")], [
              props.description ?? "Model-owned rich text editor with transaction-based paragraph, heading, and bold nodes.",
            ]),
          ]),
          div([Class("flex flex-wrap gap-2")], [
            ...richTextBlockToolbarItems.map((item) =>
              Button({
                size: "sm",
                variant: "outline",
                isDisabled: props.isDisabled,
                onClick: props.toParentMessage(SetRichTextEditorBlockFormat(item.format)),
                children: [item.label],
              })
            ),
            ...richTextMarkToolbarItems.map((item) =>
              Button({
                size: "sm",
                variant: "outline",
                isDisabled: props.isDisabled,
                onClick: props.toParentMessage(markToolbarMessage(item.value)),
                children: [item.label],
              })
            ),
          ]),
        ],
      ),
      div([Class("relative grid gap-3 rounded-lg border border-input bg-background p-4 shadow-[var(--shadow-control)]")], [
        div(
          [
            Id(props.id),
            Key(`${plainText}:${props.model.selection.start}:${props.model.selection.end}`),
            AriaLabel(props.label ?? "Rich text editor"),
            Attribute("aria-multiline", "true"),
            Contenteditable(props.isDisabled ? "false" : "true"),
            Role("textbox"),
            Spellcheck(true),
            Tabindex(props.isDisabled ? -1 : 0),
            OnMount(mountRichTextEditorHost({ id: props.id, selection: props.model.selection, toParentMessage: props.toParentMessage })),
            Class(editorClassName),
          ],
          renderDocument<Message>({
            blocks: props.model.document.children,
            selection: props.model.selection,
            placeholder: props.placeholder ?? "Start writing...",
          }),
        ),
        ...(props.model.slashMenu.isOpen
          ? [RichTextEditorSlashMenu<Message>({ model: props.model, toParentMessage: props.toParentMessage })]
          : []),
      ]),
      span([Class("text-xs text-muted-foreground")], [`Selection: ${props.model.selection.start}-${props.model.selection.end}`]),
    ],
  );
};
