import { Effect, Function } from "effect";
import { Mount, Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html, MountResult } from "foldkit/html";
import { Button } from "../button/button.view";
import { Combobox } from "../combobox/combobox.view";
import { blockText, isSelectionCollapsed, selectionEnd, selectionStart } from "./rich-text-editor.document";
import { restoreRichTextDomSelection } from "./rich-text-editor.dom";
import { richTextEditorMarkdown } from "./rich-text-editor.markdown";
import { initRichTextEditor, richTextEditorPlainText } from "./rich-text-editor.model";
import { CodeBlockNode, supportedRichTextCodeBlockLanguages } from "./nodes/code-block.node";
import {
  ParagraphNode,
  richTextBlockToolbarItems,
  richTextMarkClassNameForMarks,
  richTextMarkToolbarItems,
  richTextRenderBlock,
} from "./rich-text-editor.registry";
import {
  UpdatedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  ExitedRichTextEditorCodeBlock,
  FailedMountRichTextEditorHost,
  InsertedRichTextEditorText,
  MountedRichTextEditorHost,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  RestoredRichTextEditorSelection,
  RichTextEditorMessage,
  SelectedRichTextEditorBlockFormat,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  ClickedRichTextEditorMark,
  ChangedRichTextCodeBlockLanguage,
  GotRichTextCodeBlockLanguageComboboxMessage,
  UpdatedRichTextEditorSlashMenuQuery,
  HighlightedRichTextCodeBlocks,
  type RichTextEditorModel,
  type RichTextBlockNode,
  type RichTextSelection,
} from "./rich-text-editor.schema";
import type { RichTextMarkType } from "./nodes/mark.schema";
import { RichTextEditorSlashMenu } from "./rich-text-editor.slash-menu.view";
import {
  richTextEditorSubscriptionConfig,
  richTextEditorSubscriptions,
  type RichTextEditorSubscriptionOptions,
} from "./rich-text-editor.subscriptions";
import { updateRichTextEditor, updateRichTextEditorWithCommands } from "./rich-text-editor.update";

const codeBlockLanguageItems = [
  { label: "None", value: "none" },
  ...supportedRichTextCodeBlockLanguages.map((language) => ({ label: language, value: language })),
] as const;

export {
  UpdatedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  ExitedRichTextEditorCodeBlock,
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
  SelectedRichTextEditorBlockFormat,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ClickedRichTextEditorMark,
  ChangedRichTextCodeBlockLanguage,
  GotRichTextCodeBlockLanguageComboboxMessage,
  UpdatedRichTextEditorSlashMenuQuery,
  HighlightedRichTextCodeBlocks,
  initRichTextEditor,
  richTextEditorPlainText,
  richTextEditorSubscriptionConfig,
  richTextEditorSubscriptions,
  updateRichTextEditor,
  updateRichTextEditorWithCommands,
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
  isSlashMenuBackdropDisabled?: boolean;
  isDebugSelectionVisible?: boolean;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const MountRichTextEditorHost = Mount.define(
  "MountRichTextEditorHost",
  MountedRichTextEditorHost,
  FailedMountRichTextEditorHost,
);

const MountRichTextEditorCopyMarkdownButton = Mount.define(
  "MountRichTextEditorCopyMarkdownButton",
  RestoredRichTextEditorSelection,
  FailedMountRichTextEditorHost,
);

const mountRichTextEditorHost = <Message>({
  id,
  selection,
  toParentMessage,
}: Readonly<{
  id: string;
  selection: RichTextSelection;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>) => {
  const mount = MountRichTextEditorHost((element: Element) =>
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

const mountRichTextEditorCopyMarkdownButton = <Message>(
  toParentMessage: (message: RichTextEditorMessage) => Message,
) => {
  const mount = MountRichTextEditorCopyMarkdownButton((element: Element) =>
    Effect.sync(() => {
      if (!(element instanceof HTMLElement)) {
        return {
          message: FailedMountRichTextEditorHost({
            reason: "Rich text editor copy markdown button is not an HTMLElement.",
          }),
          cleanup: Function.constVoid,
        };
      }

      const onClick = () => {
        void navigator.clipboard?.writeText(element.dataset.rteMarkdown ?? "");
      };

      element.addEventListener("click", onClick);
      return {
        message: RestoredRichTextEditorSelection(),
        cleanup: () => element.removeEventListener("click", onClick),
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

const renderBlockInlineContent = <Message>({
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

const renderHighlightedCodeBlockToken = <Message>({
  content,
  lightColor,
  darkColor,
  start,
  selection,
}: Readonly<{
  content: string;
  lightColor?: string;
  darkColor?: string;
  start: number;
  selection: RichTextSelection;
}>): ReadonlyArray<Html | string> => {
  const { span, Class, DataAttribute, Style } = html<Message>();
  const end = start + content.length;
  const selectedStart = Math.max(start, selectionStart(selection));
  const selectedEnd = Math.min(end, selectionEnd(selection));
  const ranges =
    selectedStart < selectedEnd
      ? [
          { text: content.slice(0, selectedStart - start), selected: false, start },
          { text: content.slice(selectedStart - start, selectedEnd - start), selected: true, start: selectedStart },
          { text: content.slice(selectedEnd - start), selected: false, start: selectedEnd },
        ].filter((range) => range.text.length > 0)
      : [{ text: content, selected: false, start }];

  return ranges.map((range) =>
    span(
      [
        Class(`${range.selected ? "rounded-sm bg-primary/20 text-foreground" : "rte-code-token"}`),
        DataAttribute("rte-start", String(range.start)),
        DataAttribute("rte-end", String(range.start + range.text.length)),
        ...(!range.selected && (lightColor || darkColor)
          ? [
              Style({
                ...(lightColor ? { "--rte-code-token-light": lightColor } : {}),
                ...(darkColor ? { "--rte-code-token-dark": darkColor } : {}),
              }),
            ]
          : []),
      ],
      [range.text],
    ),
  );
};

const renderCodeBlockInlineContent = <Message>({
  block,
  blockStart,
  selection,
}: Readonly<{
  block: RichTextBlockNode;
  blockStart: number;
  selection: RichTextSelection;
}>): ReadonlyArray<Html | string> => {
  let textOffset = blockStart;
  const text = blockText(block);

  const content = block.children.flatMap((node) => {
    const rendered = renderHighlightedCodeBlockToken<Message>({
      content: node.text,
      start: textOffset,
      selection,
    });
    textOffset += node.text.length;
    return rendered;
  });

  return text.endsWith("\n")
    ? [...content, renderCodeBlockCaretPlaceholder<Message>(blockStart + text.length)]
    : content;
};

const renderCodeBlockCaretPlaceholder = <Message>(blockStart: number, placeholder?: string): Html => {
  const { span, Class, DataAttribute, Attribute } = html<Message>();
  return span(
    [
      DataAttribute("rte-start", String(blockStart)),
      DataAttribute("rte-end", String(blockStart + 1)),
      DataAttribute("rte-placeholder", "true"),
      Class("rte-placeholder-caret relative inline-block whitespace-pre"),
    ],
    [
      "\u00A0",
      ...(placeholder
        ? [
            span(
              [
                Attribute("aria-hidden", "true"),
                Attribute("contenteditable", "false"),
                Class("pointer-events-none absolute left-0 top-0 w-max select-none text-muted-foreground/60"),
              ],
              [placeholder],
            ),
          ]
        : []),
    ],
  );
};

const renderHighlightedCodeBlockContent = <Message>(
  highlight: RichTextEditorModel["codeBlockHighlights"][number],
  blockStart: number,
  selection: RichTextSelection,
): ReadonlyArray<Html | string> => {
  let textOffset = blockStart;

  const content = highlight.lines.flatMap((line, lineIndex) => {
    const renderedLine = line.flatMap((token) => {
      const rendered = renderHighlightedCodeBlockToken<Message>({
        content: token.content,
        lightColor: token.lightColor,
        darkColor: token.darkColor,
        start: textOffset,
        selection,
      });
      textOffset += token.content.length;
      return rendered;
    });

    if (lineIndex >= highlight.lines.length - 1) return renderedLine;
    const renderedNewline = renderHighlightedCodeBlockToken<Message>({ content: "\n", start: textOffset, selection });
    textOffset += 1;
    return [...renderedLine, ...renderedNewline];
  });

  return highlight.text.endsWith("\n")
    ? [...content, renderCodeBlockCaretPlaceholder<Message>(blockStart + highlight.text.length)]
    : content;
};

const renderEmptyBlockFallback = <Message>({
  blockIndex,
  blockStart,
  placeholder,
}: Readonly<{
  blockIndex: number;
  blockStart: number;
  placeholder: string;
}>): Html => {
  if (blockIndex === 0) {
    return ParagraphNode.renderPlaceholder<Message>({
      placeholder,
      start: blockStart,
      className: "text-muted-foreground/55",
    });
  }
  return ParagraphNode.renderPlaceholder<Message>({ placeholder: " ", start: blockStart, className: "whitespace-pre" });
};

const renderBlockNode = <Message>({
  block,
  blockIndex,
  blockStart,
  selection,
  placeholder,
  model,
  toParentMessage,
}: Readonly<{
  block: RichTextBlockNode;
  blockIndex: number;
  blockStart: number;
  selection: RichTextSelection;
  placeholder: string;
  model: RichTextEditorModel;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): Html => {
  const blockContent =
    blockText(block).length > 0
      ? renderBlockInlineContent<Message>({ block, blockStart, selection })
      : [renderEmptyBlockFallback<Message>({ blockIndex, blockStart, placeholder })];

  if (block.type === "codeBlock") {
    const { div, Class, Attribute } = html<Message>();
    const highlightedContent = block.language
      ? model.codeBlockHighlights.find(
          (highlight) =>
            highlight.blockIndex === blockIndex &&
            highlight.language === block.language &&
            highlight.text === blockText(block),
        )
      : undefined;
    return div(
      [Class("relative")],
      [
        div(
          [
            Attribute("contenteditable", "false"),
            Attribute("data-rte-ignore-events", "true"),
            Class("absolute right-2 top-2 z-10 w-40"),
          ],
          [
            Combobox<Message>({
              model:
                model.codeBlockLanguageComboboxes[blockIndex] ??
                Ui.Combobox.init({ id: `rte-code-language-${blockIndex}` }),
              toParentMessage: (message) =>
                toParentMessage(GotRichTextCodeBlockLanguageComboboxMessage({ blockIndex, message })),
              onSelectedItem: (language) =>
                toParentMessage(
                  ChangedRichTextCodeBlockLanguage({
                    blockIndex,
                    language:
                      language === "bash"
                        ? "bash"
                        : language === "python"
                          ? "python"
                          : language === "typescript"
                            ? "typescript"
                            : undefined,
                  }),
                ),
              items: codeBlockLanguageItems,
              placeholder: block.language ?? "None",
              attributes: [Attribute("contenteditable", "false")],
              inputWrapperClassName: "flex w-full items-stretch [--combobox-input-width:10rem]",
              inputClassName:
                "h-8 w-0 min-w-0 flex-1 rounded-l-md border border-border bg-background px-2 text-xs text-foreground shadow-sm outline-none placeholder:text-foreground focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring",
              buttonClassName:
                "-ml-px flex h-8 w-8 shrink-0 items-center justify-center rounded-r-md border border-border bg-muted/40 text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-open:bg-accent",
              itemsClassName:
                "z-50 max-h-40 w-[var(--combobox-input-width)] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-[var(--shadow-popover)] outline-none",
              itemClassName:
                "relative cursor-default rounded-sm px-2 py-1.5 text-xs outline-none transition-colors data-active:bg-accent data-active:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground",
            }),
          ],
        ),
        CodeBlockNode.render<Message>(
          highlightedContent
            ? renderHighlightedCodeBlockContent<Message>(highlightedContent, blockStart, selection)
            : blockText(block).length > 0
              ? renderCodeBlockInlineContent<Message>({ block, blockStart, selection })
              : [renderCodeBlockCaretPlaceholder<Message>(blockStart, "Write code...")],
          block.language,
        ),
      ],
    );
  }

  return richTextRenderBlock<Message>(block, blockContent);
};

const renderDocument = <Message>({
  blocks,
  model,
  selection,
  placeholder,
  toParentMessage,
}: Readonly<{
  blocks: ReadonlyArray<RichTextBlockNode>;
  model: RichTextEditorModel;
  selection: RichTextSelection;
  placeholder: string;
  toParentMessage: (message: RichTextEditorMessage) => Message;
}>): ReadonlyArray<Html> => {
  let blockStart = 0;
  return blocks.map((block, blockIndex) => {
    const rendered = renderBlockNode<Message>({
      block,
      blockIndex,
      blockStart,
      selection,
      placeholder,
      model,
      toParentMessage,
    });
    blockStart += blockText(block).length + 1;
    return rendered;
  });
};

const markToolbarMessage = (type: RichTextMarkType): RichTextEditorMessage => ClickedRichTextEditorMark({ type });

const isMarkActive = (model: RichTextEditorModel, type: RichTextMarkType): boolean => {
  const selection = model.selection;
  const selectedBlocks = model.document.children.filter((block) => blockText(block).length > 0);
  return (
    selectedBlocks.some((block) =>
      block.children.some((node) => node.marks?.some((mark) => mark.type === type) ?? false),
    ) && !isSelectionCollapsed(selection)
  );
};

const richTextEditorRenderKey = (model: RichTextEditorModel): string =>
  JSON.stringify({
    blocks: model.document.children.map((block) => ({
      type: block.type,
      ...(block.type === "heading" ? { level: block.level } : {}),
      ...(block.type === "codeBlock" ? { language: block.language } : {}),
    })),
  });

export const RichTextEditor = <Message>(props: RichTextEditorProps<Message>): Html => {
  const {
    div,
    p,
    span,
    Class,
    AriaLabel,
    AriaPressed,
    Attribute,
    Contenteditable,
    DataAttribute,
    Id,
    Key,
    OnMount,
    Role,
    Spellcheck,
    Tabindex,
  } = html<Message>();
  const plainText = richTextEditorPlainText(props.model);
  const renderKey = richTextEditorRenderKey(props.model);
  const markdown = richTextEditorMarkdown(props.model);
  const editorClassName =
    "rte-editor min-h-28 rounded-md border border-border bg-muted px-3 py-2 text-foreground outline-none transition-colors empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-disabled:opacity-50";

  return div(
    [
      ...(props.attributes ?? []),
      Class("grid w-full gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"),
    ],
    [
      div(
        [Class("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between")],
        [
          div(
            [Class("grid gap-1")],
            [
              span(
                [Class("text-[length:var(--font-size-sm)] font-medium leading-none text-foreground")],
                [props.label ?? "Rich text editor"],
              ),
              p(
                [Class("m-0 text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-muted-foreground")],
                [
                  props.description ??
                    "Model-owned rich text editor with transaction-based paragraph, heading, and bold nodes.",
                ],
              ),
            ],
          ),
          div(
            [Class("flex flex-wrap gap-2")],
            [
              ...richTextBlockToolbarItems.map((item) =>
                Button({
                  size: "sm",
                  variant: "outline",
                  isDisabled: props.isDisabled,
                  onClick: props.toParentMessage(SelectedRichTextEditorBlockFormat(item.format)),
                  children: [item.label],
                }),
              ),
              ...richTextMarkToolbarItems.map((item) =>
                Button({
                  size: "sm",
                  variant: "outline",
                  isDisabled: props.isDisabled,
                  attributes: [AriaPressed(isMarkActive(props.model, item.value) ? "true" : "false")],
                  onClick: props.toParentMessage(markToolbarMessage(item.value)),
                  children: [item.label],
                }),
              ),
              Button({
                size: "sm",
                variant: "secondary",
                isDisabled: props.isDisabled,
                attributes: [
                  DataAttribute("rte-markdown", markdown),
                  OnMount(mountRichTextEditorCopyMarkdownButton(props.toParentMessage)),
                ],
                children: ["Copy Markdown"],
              }),
            ],
          ),
        ],
      ),
      div(
        [Class("relative grid gap-3 rounded-lg border border-input bg-background p-4 shadow-[var(--shadow-control)]")],
        [
          div(
            [
              Id(props.id),
              Key(renderKey),
              AriaLabel(props.label ?? "Rich text editor"),
              Attribute("aria-multiline", "true"),
              // NOTE: Rich text editing requires a model-owned contenteditable host so selections,
              // Markdown paste/copy, inline marks, and block nodes stay synchronized with Foldkit state.
              // The host carries textbox semantics here; the slash menu owns its menu semantics separately.
              Contenteditable(props.isDisabled ? "false" : "true"),
              Role("textbox"),
              Spellcheck(true),
              Tabindex(props.isDisabled ? -1 : 0),
              OnMount(
                mountRichTextEditorHost({
                  id: props.id,
                  selection: props.model.selection,
                  toParentMessage: props.toParentMessage,
                }),
              ),
              Class(editorClassName),
            ],
            renderDocument<Message>({
              blocks: props.model.document.children,
              model: props.model,
              selection: props.model.selection,
              placeholder: props.placeholder ?? "Start writing...",
              toParentMessage: props.toParentMessage,
            }),
          ),
          ...(props.model.slashMenu.isOpen
            ? [
                RichTextEditorSlashMenu<Message>({
                  model: props.model,
                  toParentMessage: props.toParentMessage,
                  isBackdropDisabled: props.isSlashMenuBackdropDisabled,
                }),
              ]
            : []),
        ],
      ),
      ...(props.isDebugSelectionVisible
        ? [
            span(
              [Class("text-[length:var(--font-size-xs)] leading-[var(--line-height-xs)] text-muted-foreground")],
              [`Selection: ${selectionStart(props.model.selection)}-${selectionEnd(props.model.selection)}`],
            ),
          ]
        : []),
    ],
  );
};
