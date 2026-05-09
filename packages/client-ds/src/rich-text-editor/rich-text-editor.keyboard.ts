import type { KeyboardModifiers } from "foldkit/html";
import { activeSlashCommandValue } from "./rich-text-editor.commands";
import { blockBoundaryForOffset } from "./rich-text-editor.document";
import { richTextMarkTypeForKeyboardShortcut } from "./rich-text-editor.registry";
import {
  UpdatedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  InsertedRichTextEditorText,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  SplitRichTextEditorBlock,
  ClickedRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  type RichTextEditorMessage,
  type RichTextEditorModel,
} from "./rich-text-editor.schema";
import { richTextEditorPlainText } from "./rich-text-editor.model";

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
  if (markType) return ClickedRichTextEditorMark({ type: markType });
  if ((modifiers.metaKey || modifiers.ctrlKey) && key === "ArrowLeft") {
    const lineStart = blockBoundaryForOffset(model, model.selection.focus, "start");
    return UpdatedRichTextEditorSelection({
      start: modifiers.shiftKey ? model.selection.anchor : lineStart,
      end: lineStart,
    });
  }
  if ((modifiers.metaKey || modifiers.ctrlKey) && key === "ArrowRight") {
    const lineEnd = blockBoundaryForOffset(model, model.selection.focus, "end");
    return UpdatedRichTextEditorSelection({
      start: modifiers.shiftKey ? model.selection.anchor : lineEnd,
      end: lineEnd,
    });
  }
  if (modifiers.shiftKey && key === "ArrowLeft") {
    return UpdatedRichTextEditorSelection({
      start: model.selection.anchor,
      end: Math.max(0, model.selection.focus - 1),
    });
  }
  if (modifiers.shiftKey && key === "ArrowRight") {
    const textLength = richTextEditorPlainText(model).length;
    return UpdatedRichTextEditorSelection({
      start: model.selection.anchor,
      end: Math.min(textLength, model.selection.focus + 1),
    });
  }
  if (key === "Backspace") return DeletedRichTextEditorBackward({ unit: modifiers.altKey ? "word" : "character" });
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
