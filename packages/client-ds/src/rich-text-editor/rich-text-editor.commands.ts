import { Array } from "effect";
import type { RichTextEditorModel } from "./rich-text-editor.schema";
import { richTextSlashCommandDefinitions } from "./rich-text-editor.registry";

export type RichTextSlashCommand = typeof richTextSlashCommandDefinitions[number];

export const filteredRichTextSlashCommands = (query: string): ReadonlyArray<RichTextSlashCommand> => {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return richTextSlashCommandDefinitions;

  return Array.map(richTextSlashCommandDefinitions, (command) => {
    const label = command.label.toLowerCase();
    const value = command.value.toLowerCase();
    const description = command.description.toLowerCase();
    const score = label.startsWith(normalized)
      ? 0
      : value.startsWith(normalized)
        ? 1
        : label.includes(normalized)
          ? 2
          : value.includes(normalized)
            ? 3
            : description.includes(normalized)
              ? 4
              : undefined;
    return { command, score };
    })
    .filter((match): match is { command: RichTextSlashCommand; score: number } => match.score !== undefined)
    .toSorted((left, right) => left.score - right.score)
    .map((match) => match.command);
};

export const normalizeRichTextSlashMenuIndex = (query: string, activeIndex: number): number => {
  const commands = filteredRichTextSlashCommands(query);
  if (commands.length === 0) return 0;
  return ((activeIndex % commands.length) + commands.length) % commands.length;
};

export const activeSlashCommandValue = (model: RichTextEditorModel): string | undefined => {
  const commands = filteredRichTextSlashCommands(model.slashMenu.query);
  return commands[normalizeRichTextSlashMenuIndex(model.slashMenu.query, model.slashMenu.activeIndex)]?.value;
};
