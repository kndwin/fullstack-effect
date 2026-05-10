import { Option } from "effect";
import { Ui } from "foldkit";
import { blockText, collapsedSelection, paragraph } from "./rich-text-editor.document";
import type { RichTextEditorModel, RichTextSelection, RichTextSlashMenu } from "./rich-text-editor.schema";

const closedSlashMenu = (selection: RichTextSelection): RichTextSlashMenu => ({
  isOpen: false,
  anchorSelection: selection,
  query: "",
  activeIndex: 0,
});

export const initRichTextEditor = (value = ""): RichTextEditorModel => ({
  document: { type: "doc", children: [paragraph(value)] },
  selection: collapsedSelection(value.length),
  slashMenu: closedSlashMenu(collapsedSelection(value.length)),
  codeBlockLanguageComboboxes: [Ui.Combobox.init({ id: "rte-code-language-0" })],
  codeBlockHighlights: [],
  maybeMountedHostId: Option.none(),
});

export const richTextEditorPlainText = (model: RichTextEditorModel): string =>
  model.document.children.map(blockText).join("\n");

export const resetRichTextEditorSlashMenu = (model: RichTextEditorModel): RichTextEditorModel => ({
  ...model,
  slashMenu: closedSlashMenu(model.selection),
});
