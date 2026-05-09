import type { KeyboardModifiers } from "foldkit/html";
import { activeSlashCommandValue } from "./rich-text-editor.commands";
import { blockBoundaryForOffset } from "./rich-text-editor.document";
import { richTextMarkTypeForKeyboardShortcut } from "./rich-text-editor.registry";
import {
  ChangedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  InsertedRichTextEditorText,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  SplitRichTextEditorBlock,
  ToggledRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  type RichTextEditorMessage,
  type RichTextEditorModel,
} from "./rich-text-editor.schema";

export const richTextEditorKeyDownMessage = (
  key: string,
  modifiers: KeyboardModifiers,
  model: RichTextEditorModel,
): RichTextEditorMessage | undefined => {
  if (model.slashMenu.isOpen) {
    if (key === "Escape") return ClosedRichTextEditorSlashMenu();
    if (key === "ArrowDown") return MovedRichTextEditorSlashMenuSelection({ delta: 1 });
    if (key === "ArrowUp") return MovedRichTextEditorSlashMenuSelection({ delta: -1 });
    if (key === "Enter") {
      const value = activeSlashCommandValue(model);
      return value ? SelectedRichTextEditorSlashCommand({ value }) : ClosedRichTextEditorSlashMenu();
    }
    if (key === "Backspace") {
      return model.slashMenu.query.length === 0
        ? ClosedRichTextEditorSlashMenu()
        : UpdatedRichTextEditorSlashMenuQuery({ value: model.slashMenu.query.slice(0, -1) });
    }
    if (!modifiers.metaKey && !modifiers.ctrlKey && !modifiers.altKey && key.length === 1) {
      return UpdatedRichTextEditorSlashMenuQuery({ value: model.slashMenu.query + key });
    }
    return undefined;
  }

  if ((modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "a") return SelectedRichTextEditorAll();
  const markType = richTextMarkTypeForKeyboardShortcut(key, modifiers);
  if (markType) return ToggledRichTextEditorMark({ type: markType });
  if ((modifiers.metaKey || modifiers.ctrlKey) && key === "ArrowLeft") {
    const lineStart = blockBoundaryForOffset(model, model.selection.end, "start");
    return ChangedRichTextEditorSelection({ start: modifiers.shiftKey ? model.selection.start : lineStart, end: lineStart });
  }
  if ((modifiers.metaKey || modifiers.ctrlKey) && key === "ArrowRight") {
    const lineEnd = blockBoundaryForOffset(model, model.selection.end, "end");
    return ChangedRichTextEditorSelection({ start: modifiers.shiftKey ? model.selection.start : lineEnd, end: lineEnd });
  }
  if (key === "Backspace") return DeletedRichTextEditorBackward({});
  if (modifiers.metaKey || modifiers.ctrlKey || modifiers.altKey) return undefined;
  if (key === "Enter") return SplitRichTextEditorBlock();
  if (key === "/") return OpenedRichTextEditorSlashMenu();
  if (key.length === 1) return InsertedRichTextEditorText({ value: key });
  return undefined;
};

export const richTextEditorKeyUpMessage = (
  key: string,
  modifiers: Pick<KeyboardModifiers, "metaKey" | "ctrlKey">,
  selectionMessageFromDom: () => RichTextEditorMessage,
): RichTextEditorMessage | undefined => {
  if ((modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "a") return SelectedRichTextEditorAll();
  if (["Alt", "Control", "Meta", "Shift"].includes(key)) return undefined;
  if (key === "Backspace" || key === "Enter" || key.length === 1) return undefined;
  return selectionMessageFromDom();
};
