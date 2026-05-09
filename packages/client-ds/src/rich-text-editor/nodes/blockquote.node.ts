import { Schema } from "effect";
import type { Html } from "foldkit/html";
import { html } from "foldkit/html";
import type { RichTextBlockNode, RichTextTextNode } from "../rich-text-editor.schema";
import { RichTextTextNodeSchema } from "./text.schema";

export const RichTextBlockquoteNodeSchema = Schema.Struct({
  type: Schema.Literal("blockquote"),
  children: Schema.Array(RichTextTextNodeSchema),
});

export const BlockquoteNode = {
  kind: "blockquote",
  slashCommand: { label: "Blockquote", value: "blockquote", description: "Format this block as a quoted passage." },
  toolbarItem: { label: "Quote", format: { type: "blockquote" as const } },
  create: (children: ReadonlyArray<RichTextTextNode>): RichTextBlockNode => ({ type: "blockquote", children }),
  formatForSlashCommand: (value: string): Readonly<{ type: "blockquote" }> | undefined =>
    value === BlockquoteNode.slashCommand.value ? { type: "blockquote" } : undefined,
  markdown: {
    matchLine: (line: string): Readonly<{ content: string }> | undefined => {
      const match = /^>\s?(.*)$/.exec(line);
      return match ? { content: match[1] ?? "" } : undefined;
    },
    serialize: (_block: RichTextBlockNode, content: string): string => `> ${content}`,
  },
  className: () =>
    "m-0 border-l-4 border-border pl-[var(--space-4)] text-[length:var(--font-size-sm)] italic leading-[var(--line-height-sm)] text-muted-foreground whitespace-pre-wrap",
  render: <Message>(children: ReadonlyArray<Html | string>): Html => {
    const { blockquote, Class } = html<Message>();
    return blockquote([Class(BlockquoteNode.className())], children);
  },
} as const;
