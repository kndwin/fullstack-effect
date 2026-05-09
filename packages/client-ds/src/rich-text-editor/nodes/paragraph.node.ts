import { Schema } from "effect";
import type { Html } from "foldkit/html";
import { html } from "foldkit/html";
import type { RichTextBlockNode, RichTextSelection, RichTextTextNode } from "../rich-text-editor.schema";
import { RichTextTextNodeSchema } from "./text.schema";
import { TextNode } from "./text.node";
import { selectionEnd, selectionStart } from "../rich-text-editor.document";

export type RenderRichTextNodeOptions = Readonly<{
  node: RichTextTextNode;
  index: number;
  start: number;
  selection: RichTextSelection;
  markClassNameForMarks: (marks: RichTextTextNode["marks"]) => string;
}>;

export type RenderRichTextPlaceholderOptions = Readonly<{
  placeholder: string;
  start: number;
  className?: string;
}>;

export const RichTextParagraphNodeSchema = Schema.Struct({
  type: Schema.Literal("paragraph"),
  children: Schema.Array(RichTextTextNodeSchema),
});

export const ParagraphNode = {
  kind: "paragraph",
  slashCommand: { label: "Paragraph", value: "paragraph", description: "Format this block as body text." },
  toolbarItem: { label: "Paragraph", format: { type: "paragraph" as const } },
  create: (children: ReadonlyArray<RichTextTextNode> = [TextNode.empty()]): RichTextBlockNode => ({
    type: "paragraph",
    children,
  }),
  formatForSlashCommand: (value: string): Readonly<{ type: "paragraph" }> | undefined =>
    value === ParagraphNode.slashCommand.value ? { type: "paragraph" } : undefined,
  markdown: {
    matchLine: (line: string): Readonly<{ content: string }> => ({ content: line }),
    serialize: (_block: RichTextBlockNode, content: string): string => content,
  },
  className: () =>
    "m-0 whitespace-pre-wrap text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-foreground",
  renderTextNode: <Message>({
    node,
    index,
    start,
    selection,
    markClassNameForMarks,
  }: RenderRichTextNodeOptions): ReadonlyArray<Html | string> => {
    const { span, Class, DataAttribute } = html<Message>();
    const text = node.text || (index === 0 ? " " : "");
    const end = start + text.length;
    const selectedStart = Math.max(start, selectionStart(selection));
    const selectedEnd = Math.min(end, selectionEnd(selection));
    const ranges =
      selectedStart < selectedEnd
        ? [
            { text: text.slice(0, selectedStart - start), selected: false, start },
            { text: text.slice(selectedStart - start, selectedEnd - start), selected: true, start: selectedStart },
            { text: text.slice(selectedEnd - start), selected: false, start: selectedEnd },
          ].filter((range) => range.text.length > 0)
        : [{ text, selected: false, start }];
    const markClassName = markClassNameForMarks(node.marks);

    return ranges.map((range) => {
      const attrs = [
        Class(
          `${markClassName || (range.selected ? "" : "contents")} ${range.selected ? "rounded-sm bg-primary/20 text-foreground" : ""}`,
        ),
        DataAttribute("rte-start", String(range.start)),
        DataAttribute("rte-end", String(range.start + range.text.length)),
      ];
      return span(attrs, [range.text]);
    });
  },
  renderPlaceholder: <Message>({ placeholder, start, className = "" }: RenderRichTextPlaceholderOptions): Html => {
    const { span, Class, DataAttribute, Attribute } = html<Message>();
    return span(
      [Class(`relative inline-block ${className}`)],
      [
        span(
          [
            DataAttribute("rte-start", String(start)),
            DataAttribute("rte-end", String(start + 1)),
            DataAttribute("rte-placeholder", "true"),
            Class("rte-placeholder-caret"),
          ],
          ["\u00A0"],
        ),
        span(
          [
            Attribute("aria-hidden", "true"),
            Attribute("contenteditable", "false"),
            Class("pointer-events-none absolute left-0 top-0 w-max select-none whitespace-nowrap"),
          ],
          [placeholder],
        ),
      ],
    );
  },
  render: <Message>(children: ReadonlyArray<Html | string>): Html => {
    const { p, Class } = html<Message>();
    return p([Class(ParagraphNode.className())], children);
  },
} as const;
