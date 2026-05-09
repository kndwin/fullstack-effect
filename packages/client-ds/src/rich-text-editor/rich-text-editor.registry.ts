import { BoldNode } from "./nodes/bold.node";
import { HeadingNode } from "./nodes/heading.node";
import { ItalicNode } from "./nodes/italic.node";
import { ParagraphNode } from "./nodes/paragraph.node";
import type { KeyboardModifiers } from "foldkit/html";
import type { Html } from "foldkit/html";
import type { RichTextBlockNode, RichTextHeadingLevel, RichTextMark } from "./rich-text-editor.schema";
import type { RichTextMarkType } from "./nodes/mark.schema";

export const richTextBlockNodes = [ParagraphNode, HeadingNode] as const;
export const richTextMarkNodes = [BoldNode, ItalicNode] as const;

export const richTextBlockToolbarItems = [
  ParagraphNode.toolbarItem,
  ...HeadingNode.toolbarItems,
] as const;

export const richTextMarkToolbarItems = richTextMarkNodes.map((node) => node.toolbarItem);

export const richTextSlashCommandDefinitions = [
  ParagraphNode.slashCommand,
  ...HeadingNode.slashCommands,
  ...richTextMarkNodes.map((node) => node.slashCommand),
] as const;

export type RichTextSlashCommandValue = typeof richTextSlashCommandDefinitions[number]["value"];

export const richTextMarkNodeForType = (type: RichTextMarkType) => richTextMarkNodes.find((node) => node.kind === type);

export const richTextMarkClassNameForMarks = (marks: ReadonlyArray<RichTextMark> | undefined): string =>
  (marks ?? []).map((mark) => richTextMarkNodeForType(mark.type)?.className ?? "").join(" ");

export const richTextMarkTypeForKeyboardShortcut = (
  key: string,
  modifiers: KeyboardModifiers,
): RichTextMarkType | undefined =>
  richTextMarkNodes.find((node) => {
    const shortcut = node.keyboardShortcut;
    if (!shortcut) return false;
    if (shortcut.metaOrCtrl && !modifiers.metaKey && !modifiers.ctrlKey) return false;
    return key.toLowerCase() === shortcut.key.toLowerCase();
  })?.kind;

export const richTextBlockFormatForSlashCommand = (
  value: string,
): Readonly<{ type: "paragraph" | "heading"; level?: RichTextHeadingLevel }> | undefined =>
  ParagraphNode.formatForSlashCommand(value) ?? HeadingNode.formatForSlashCommand(value);

export const richTextMarkTypeForSlashCommand = (value: string): RichTextMarkType | undefined =>
  richTextMarkNodes.find((node) => node.slashCommand.value === value)?.kind;

export const richTextRenderBlock = <Message>(block: RichTextBlockNode, children: ReadonlyArray<Html | string>) => {
  if (block.type === "paragraph") return ParagraphNode.render<Message>(children);
  return HeadingNode.render<Message>(block.level, children);
};

export { BoldNode, HeadingNode, ItalicNode, ParagraphNode };
