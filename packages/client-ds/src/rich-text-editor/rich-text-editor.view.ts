import { Effect, Option } from "effect";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";
import { Button } from "../button/button.view";
import { richTextSelectionMessageFromDom, restoreRichTextDomSelection, selectRichTextEditorDomAll } from "./rich-text-editor.dom";
import { richTextEditorKeyDownMessage, richTextEditorKeyUpMessage } from "./rich-text-editor.keyboard";
import { blockText, richTextEditorPlainText } from "./rich-text-editor.model";
import { BoldNode, HeadingNode, ParagraphNode, richTextBlockToolbarItems, richTextMarkToolbarItems } from "./rich-text-editor.registry";
import {
  RestoredRichTextEditorSelection,
  SetRichTextEditorBlockFormat,
  SyncedRichTextEditorPlainText,
  ToggledRichTextEditorBold,
  DeletedRichTextEditorBackward,
  SelectedRichTextEditorAll,
  type RichTextEditorMessage,
  type RichTextEditorModel,
  type RichTextSelection,
  type RichTextTextNode,
} from "./rich-text-editor.schema";
import { RichTextEditorSlashMenu } from "./rich-text-editor.slash-menu.view";

export * from "./rich-text-editor.schema";
export * from "./rich-text-editor.model";

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

const renderTextNode = <Message,>(
  node: RichTextTextNode,
  index: number,
  start: number,
  selection: RichTextSelection,
): ReadonlyArray<Html | string> => {
  const { strong, span, Class, DataAttribute } = html<Message>();
  const text = node.text || (index === 0 ? " " : "");
  const end = start + text.length;
  const selectedStart = Math.max(start, selection.start);
  const selectedEnd = Math.min(end, selection.end);
  const ranges = selectedStart < selectedEnd
    ? [
        { text: text.slice(0, selectedStart - start), selected: false, start },
        { text: text.slice(selectedStart - start, selectedEnd - start), selected: true, start: selectedStart },
        { text: text.slice(selectedEnd - start), selected: false, start: selectedEnd },
      ].filter((range) => range.text.length > 0)
    : [{ text, selected: false, start }];
  const isBold = BoldNode.has(node.marks);

  return ranges.map((range) => {
    const attrs = [
      Class(`${isBold ? "font-semibold" : range.selected ? "" : "contents"} ${range.selected ? "rounded-sm bg-primary/20 text-foreground" : ""}`),
      DataAttribute("rte-start", String(range.start)),
      DataAttribute("rte-end", String(range.start + range.text.length)),
    ];
    return isBold ? strong(attrs, [range.text]) : span(attrs, [range.text]);
  });
};

const renderPlaceholder = <Message,>(placeholder: string, start: number, className = ""): Html => {
  const { span, Class, DataAttribute } = html<Message>();
  return span(
    [Class(className), DataAttribute("rte-start", String(start)), DataAttribute("rte-end", String(start + 1))],
    [placeholder],
  );
};

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
    OnKeyDownPreventDefault,
    OnKeyUpPreventDefault,
    OnInput,
    OnMount,
    OnPointerUp,
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
                onClick: props.toParentMessage(ToggledRichTextEditorBold()),
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
            AriaLabel(props.label ?? "Rich text editor"),
            Attribute("aria-multiline", "true"),
            Key(`${plainText}:${props.model.selection.start}:${props.model.selection.end}:${props.model.slashMenu.isOpen}:${props.model.slashMenu.query}:${props.model.slashMenu.activeIndex}`),
            Contenteditable(props.isDisabled ? "false" : "true"),
            Role("textbox"),
            Spellcheck(true),
            Tabindex(props.isDisabled ? -1 : 0),
            OnKeyDownPreventDefault((key, modifiers) => {
              if (props.isDisabled) return Option.none();
              if ((modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "a") {
                selectRichTextEditorDomAll(props.id);
                return Option.some(props.toParentMessage(SelectedRichTextEditorAll()));
              }
              if (key === "Backspace" && !props.model.slashMenu.isOpen) {
                const selection = typeof window === "undefined" || typeof window.getSelection !== "function"
                  ? props.model.selection
                  : richTextSelectionMessageFromDom(plainText.length);
                return Option.some(props.toParentMessage(DeletedRichTextEditorBackward({ start: selection.start, end: selection.end })));
              }
              const message = richTextEditorKeyDownMessage(key, modifiers, props.model);
              return message ? Option.some(props.toParentMessage(message)) : Option.none();
            }),
            OnKeyUpPreventDefault((key, modifiers) => {
              if (props.isDisabled) return Option.none();
              const message = richTextEditorKeyUpMessage(
                key,
                modifiers,
                () => richTextSelectionMessageFromDom(plainText.length),
              );
              return message ? Option.some(props.toParentMessage(message)) : Option.none();
            }),
            OnInput((value) => props.toParentMessage(SyncedRichTextEditorPlainText({ value }))),
            OnPointerUp(() =>
              props.isDisabled
                ? Option.none()
                : Option.some(props.toParentMessage(richTextSelectionMessageFromDom(plainText.length)))
            ),
            OnMount({
              name: "restore-rich-text-editor-selection",
              f: (element) =>
                Effect.sync(() => {
                  Object.defineProperty(element, "value", {
                    configurable: true,
                    get: () => element instanceof HTMLElement ? element.innerText : "",
                  });
                  requestAnimationFrame(() => restoreRichTextDomSelection(element, props.model.selection));
                  return {
                    message: props.toParentMessage(RestoredRichTextEditorSelection()),
                    cleanup: () => {
                      delete (element as { value?: string }).value;
                    },
                  };
                }),
            }),
            Class(editorClassName),
          ],
          props.model.document.children.map((block, blockIndex) => {
            const blockStart = props.model.document.children
              .slice(0, blockIndex)
              .reduce((offset, previousBlock) => offset + blockText(previousBlock).length + 1, 0);
            let textOffset = blockStart;
            const children = block.children.flatMap((node, inlineIndex) => {
              const rendered = renderTextNode<Message>(node, inlineIndex, textOffset, props.model.selection);
              textOffset += node.text.length;
              return rendered;
            });
            const fallback = blockIndex === 0
              ? renderPlaceholder<Message>(props.placeholder ?? "Start writing...", blockStart, "text-muted-foreground/55")
              : renderPlaceholder<Message>(" ", blockStart, "whitespace-pre");
            const content = blockText(block).length > 0 ? children : [fallback];
            if (block.type === "paragraph") return ParagraphNode.render<Message>(content);
            return HeadingNode.render<Message>(block.level, content);
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
