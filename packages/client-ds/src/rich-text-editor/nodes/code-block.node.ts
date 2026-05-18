import { Schema } from "effect";
import type { Html } from "foldkit/html";
import { html } from "foldkit/html";
import type { RichTextBlockNode, RichTextTextNode } from "../rich-text-editor.schema";
import { RichTextTextNodeSchema } from "./text.schema";

export const RichTextCodeBlockLanguageSchema = Schema.Union([
  Schema.Literal("bash"),
  Schema.Literal("python"),
  Schema.Literal("typescript"),
]);
export type RichTextCodeBlockLanguage = typeof RichTextCodeBlockLanguageSchema.Type;

export const supportedRichTextCodeBlockLanguages = ["bash", "python", "typescript"] as const;

export const richTextCodeBlockLanguageFromMarkdown = (
  language: string | undefined,
): RichTextCodeBlockLanguage | undefined => {
  if (language === "bash" || language === "sh" || language === "shell") return "bash";
  if (language === "python" || language === "py") return "python";
  if (language === "typescript" || language === "ts") return "typescript";
  return undefined;
};

export const RichTextCodeBlockNodeSchema = Schema.Struct({
  type: Schema.Literal("codeBlock"),
  language: Schema.optional(RichTextCodeBlockLanguageSchema),
  children: Schema.Array(RichTextTextNodeSchema),
});

export const CodeBlockNode = {
  kind: "codeBlock",
  slashCommand: { label: "Code block", value: "code-block", description: "Format this block as a code snippet." },
  slashCommands: [
    { label: "Bash code", value: "code-block-bash", description: "Format this block as Bash code.", language: "bash" },
    {
      label: "Python code",
      value: "code-block-python",
      description: "Format this block as Python code.",
      language: "python",
    },
    {
      label: "TypeScript code",
      value: "code-block-typescript",
      description: "Format this block as TypeScript code.",
      language: "typescript",
    },
  ] as const,
  toolbarItem: { label: "Code", format: { type: "codeBlock" as const } },
  toolbarItems: [
    { label: "Bash", format: { type: "codeBlock" as const, language: "bash" as const } },
    { label: "Python", format: { type: "codeBlock" as const, language: "python" as const } },
    { label: "TS", format: { type: "codeBlock" as const, language: "typescript" as const } },
  ] as const,
  create: (children: ReadonlyArray<RichTextTextNode>, language?: RichTextCodeBlockLanguage): RichTextBlockNode => ({
    type: "codeBlock",
    ...(language ? { language } : {}),
    children,
  }),
  formatForSlashCommand: (
    value: string,
  ): Readonly<{ type: "codeBlock"; language?: RichTextCodeBlockLanguage }> | undefined => {
    if (value === CodeBlockNode.slashCommand.value) return { type: "codeBlock" };
    const command = CodeBlockNode.slashCommands.find((item) => item.value === value);
    return command ? { type: "codeBlock", language: command.language } : undefined;
  },
  markdown: {
    serialize: (block: RichTextBlockNode, content: string): string => {
      const language = block.type === "codeBlock" ? (block.language ?? "") : "";
      return `\`\`\`${language}\n${content}\n\`\`\``;
    },
  },
  className: () =>
    "m-0 min-h-28 overflow-x-auto rounded-md border border-border bg-muted p-3 pr-48 font-mono text-[length:var(--font-size-sm)] leading-[var(--line-height-sm)] text-foreground whitespace-pre-wrap",
  render: <Message>(children: ReadonlyArray<Html | string>, language?: RichTextCodeBlockLanguage): Html => {
    const { pre, code, Class, Attribute } = html<Message>();
    return pre(
      [Class(CodeBlockNode.className())],
      [
        code(
          [
            ...(language ? [Class(`language-${language}`)] : []),
            ...(language ? [Attribute("data-language", language)] : []),
          ],
          children,
        ),
      ],
    );
  },
} as const;
