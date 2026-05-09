import { BoldNode } from "./nodes/bold.node";
import { HeadingNode } from "./nodes/heading.node";
import { ParagraphNode } from "./nodes/paragraph.node";

export const richTextBlockToolbarItems = [
  ParagraphNode.toolbarItem,
  ...HeadingNode.toolbarItems,
] as const;

export const richTextMarkToolbarItems = [BoldNode.toolbarItem] as const;

export const richTextSlashCommandDefinitions = [
  ParagraphNode.slashCommand,
  ...HeadingNode.slashCommands,
  BoldNode.slashCommand,
] as const;

export type RichTextSlashCommandValue = typeof richTextSlashCommandDefinitions[number]["value"];

export { BoldNode, HeadingNode, ParagraphNode };
