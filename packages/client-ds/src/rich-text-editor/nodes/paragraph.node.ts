import { Schema } from "effect";
import type { Html } from "foldkit/html";
import { html } from "foldkit/html";
import type { RichTextBlockNode, RichTextTextNode } from "../rich-text-editor.schema";
import { RichTextTextNodeSchema, TextNode } from "./text.node";

export const RichTextParagraphNodeSchema = Schema.Struct({
  type: Schema.Literal("paragraph"),
  children: Schema.Array(RichTextTextNodeSchema),
});

export const ParagraphNode = {
  kind: "paragraph",
  slashCommand: { label: "Paragraph", value: "paragraph", description: "Format this block as body text." },
  toolbarItem: { label: "Paragraph", format: { type: "paragraph" as const } },
  create: (children: ReadonlyArray<RichTextTextNode> = [TextNode.empty()]): RichTextBlockNode => ({ type: "paragraph", children }),
  className: () => "m-0 whitespace-pre-wrap text-sm leading-6 text-foreground",
  render: <Message>(children: ReadonlyArray<Html | string>): Html => {
    const { p, Class } = html<Message>();
    return p([Class(ParagraphNode.className())], children);
  },
} as const;
