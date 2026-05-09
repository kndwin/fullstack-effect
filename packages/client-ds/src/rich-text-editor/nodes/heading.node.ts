import { Schema } from "effect";
import type { Html } from "foldkit/html";
import { html } from "foldkit/html";
import type { RichTextBlockNode, RichTextHeadingLevel, RichTextTextNode } from "../rich-text-editor.schema";
import { RichTextTextNodeSchema } from "./text.schema";

export const RichTextHeadingLevelSchema = Schema.Union([Schema.Literal(1), Schema.Literal(2), Schema.Literal(3)]);
export const RichTextHeadingNodeSchema = Schema.Struct({
  type: Schema.Literal("heading"),
  level: RichTextHeadingLevelSchema,
  children: Schema.Array(RichTextTextNodeSchema),
});

export const HeadingNode = {
  kind: "heading",
  slashCommands: [
    { label: "Heading 1", value: "heading-1", description: "Format this block as a top-level heading.", level: 1 },
    { label: "Heading 2", value: "heading-2", description: "Format this block as a section heading.", level: 2 },
    { label: "Heading 3", value: "heading-3", description: "Format this block as a subsection heading.", level: 3 },
  ] as const,
  toolbarItems: [
    { label: "H1", format: { type: "heading" as const, level: 1 as const } },
    { label: "H2", format: { type: "heading" as const, level: 2 as const } },
    { label: "H3", format: { type: "heading" as const, level: 3 as const } },
  ] as const,
  create: (level: RichTextHeadingLevel, children: ReadonlyArray<RichTextTextNode>): RichTextBlockNode => ({
    type: "heading",
    level,
    children,
  }),
  formatForSlashCommand: (value: string): Readonly<{ type: "heading"; level: RichTextHeadingLevel }> | undefined => {
    const command = HeadingNode.slashCommands.find((item) => item.value === value);
    return command ? { type: "heading", level: command.level } : undefined;
  },
  markdown: {
    matchLine: (line: string): Readonly<{ level: RichTextHeadingLevel; content: string }> | undefined => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line);
      const marker = match?.[1];
      return marker ? { level: marker.length as RichTextHeadingLevel, content: match[2] ?? "" } : undefined;
    },
    serialize: (block: RichTextBlockNode, content: string): string =>
      block.type === "heading" ? `${"#".repeat(block.level)} ${content}` : content,
  },
  className: (level: RichTextHeadingLevel): string =>
    level === 1
      ? "m-0 min-h-[calc(var(--line-height-3xl)+var(--space-1))] text-[length:var(--font-size-3xl)] font-semibold leading-[var(--line-height-3xl)] tracking-tight text-foreground"
      : level === 2
        ? "m-0 min-h-[calc(var(--line-height-2xl)+var(--space-1))] text-[length:var(--font-size-2xl)] font-semibold leading-[var(--line-height-2xl)] tracking-tight text-foreground"
        : "m-0 min-h-[calc(var(--line-height-xl)+var(--space-1))] text-[length:var(--font-size-xl)] font-semibold leading-[var(--line-height-xl)] tracking-tight text-foreground",
  render: <Message>(level: RichTextHeadingLevel, children: ReadonlyArray<Html | string>): Html => {
    const { h1, h2, h3, Class } = html<Message>();
    if (level === 1) return h1([Class(HeadingNode.className(level))], children);
    if (level === 2) return h2([Class(HeadingNode.className(level))], children);
    return h3([Class(HeadingNode.className(level))], children);
  },
} as const;
