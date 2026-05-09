import { Schema } from "effect";
import type { RichTextMark, RichTextTextNode } from "../rich-text-editor.schema";

export const RichTextBoldMark = Schema.Struct({ type: Schema.Literal("bold") });
export const RichTextTextNodeSchema = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
  marks: Schema.optional(Schema.Array(RichTextBoldMark)),
});

export const TextNode = {
  kind: "text",
  empty: (): RichTextTextNode => ({ type: "text", text: "" }),
  cleanMarks: (marks?: ReadonlyArray<RichTextMark>): ReadonlyArray<RichTextMark> | undefined =>
    marks && marks.length > 0 ? marks : undefined,
  of: (text: string, marks?: ReadonlyArray<RichTextMark>): RichTextTextNode => {
    const cleanMarks = TextNode.cleanMarks(marks);
    return cleanMarks ? { type: "text", text, marks: cleanMarks } : { type: "text", text };
  },
  clean: (node: RichTextTextNode): RichTextTextNode => TextNode.of(node.text, node.marks),
  sameMarks: (left?: ReadonlyArray<RichTextMark>, right?: ReadonlyArray<RichTextMark>): boolean => {
    const leftMarks = left ?? [];
    const rightMarks = right ?? [];
    return leftMarks.length === rightMarks.length && leftMarks.every((mark, index) => mark.type === rightMarks[index]?.type);
  },
  inserted: (text: string, marks?: ReadonlyArray<RichTextMark>): ReadonlyArray<RichTextTextNode> =>
    text.length > 0 ? [TextNode.of(text, marks)] : [],
} as const;
