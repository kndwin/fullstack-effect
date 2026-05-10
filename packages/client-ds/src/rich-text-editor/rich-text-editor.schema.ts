import { Schema } from "effect";
import { Ui } from "foldkit";
import { m } from "foldkit/message";
import { RichTextBlockquoteNodeSchema } from "./nodes/blockquote.node";
import { RichTextCodeBlockLanguageSchema, RichTextCodeBlockNodeSchema } from "./nodes/code-block.node";
import { RichTextHeadingLevelSchema, RichTextHeadingNodeSchema } from "./nodes/heading.node";
import { RichTextMarkSchema } from "./nodes/mark.schema";
import { RichTextParagraphNodeSchema } from "./nodes/paragraph.node";
import { RichTextTextNodeSchema } from "./nodes/text.schema";

export const InsertedRichTextEditorText = m("InsertedRichTextEditorText", { value: Schema.String });
export const PastedRichTextEditorMarkdown = m("PastedRichTextEditorMarkdown", {
  value: Schema.String,
  start: Schema.optional(Schema.Number),
  end: Schema.optional(Schema.Number),
});
export const SyncedRichTextEditorPlainText = m("SyncedRichTextEditorPlainText", { value: Schema.String });
export const DeletedRichTextEditorBackward = m("DeletedRichTextEditorBackward", {
  start: Schema.optional(Schema.Number),
  end: Schema.optional(Schema.Number),
  unit: Schema.optional(Schema.Union([Schema.Literal("character"), Schema.Literal("word")])),
});
export const SplitRichTextEditorBlock = m("SplitRichTextEditorBlock");
export const ExitedRichTextEditorCodeBlock = m("ExitedRichTextEditorCodeBlock");
export const SelectedRichTextEditorAll = m("SelectedRichTextEditorAll");
export const RestoredRichTextEditorSelection = m("RestoredRichTextEditorSelection");
export const MountedRichTextEditorHost = m("MountedRichTextEditorHost", { id: Schema.String });
export const FailedMountRichTextEditorHost = m("FailedMountRichTextEditorHost", { reason: Schema.String });
export const UpdatedRichTextEditorSelection = m("UpdatedRichTextEditorSelection", {
  start: Schema.Number,
  end: Schema.Number,
});
export const OpenedRichTextEditorSlashMenu = m("OpenedRichTextEditorSlashMenu");
export const ClosedRichTextEditorSlashMenu = m("ClosedRichTextEditorSlashMenu");
export const UpdatedRichTextEditorSlashMenuQuery = m("UpdatedRichTextEditorSlashMenuQuery", { value: Schema.String });
export const MovedRichTextEditorSlashMenuSelection = m("MovedRichTextEditorSlashMenuSelection", {
  delta: Schema.Number,
});
export const SelectedRichTextEditorSlashCommand = m("SelectedRichTextEditorSlashCommand", { value: Schema.String });
export const SelectedRichTextEditorBlockFormat = m("SelectedRichTextEditorBlockFormat", {
  type: Schema.Union([
    Schema.Literal("paragraph"),
    Schema.Literal("heading"),
    Schema.Literal("blockquote"),
    Schema.Literal("codeBlock"),
  ]),
  level: Schema.optional(Schema.Union([Schema.Literal(1), Schema.Literal(2), Schema.Literal(3)])),
  language: Schema.optional(RichTextCodeBlockLanguageSchema),
});
export const ClickedRichTextEditorMark = m("ClickedRichTextEditorMark", {
  type: Schema.Union([Schema.Literal("bold"), Schema.Literal("italic")]),
});
export const ChangedRichTextCodeBlockLanguage = m("ChangedRichTextCodeBlockLanguage", {
  blockIndex: Schema.Number,
  language: Schema.optional(RichTextCodeBlockLanguageSchema),
});
export const GotRichTextCodeBlockLanguageComboboxMessage = m("GotRichTextCodeBlockLanguageComboboxMessage", {
  blockIndex: Schema.Number,
  message: Ui.Combobox.Message,
});
export const RichTextCodeHighlightToken = Schema.Struct({
  content: Schema.String,
  lightColor: Schema.optional(Schema.String),
  darkColor: Schema.optional(Schema.String),
});
export const RichTextCodeBlockHighlight = Schema.Struct({
  blockIndex: Schema.Number,
  text: Schema.String,
  language: RichTextCodeBlockLanguageSchema,
  lines: Schema.Array(Schema.Array(RichTextCodeHighlightToken)),
});
export const HighlightedRichTextCodeBlocks = m("HighlightedRichTextCodeBlocks", {
  highlights: Schema.Array(RichTextCodeBlockHighlight),
});

export const RichTextEditorMessage = Schema.Union([
  InsertedRichTextEditorText,
  PastedRichTextEditorMarkdown,
  SyncedRichTextEditorPlainText,
  DeletedRichTextEditorBackward,
  SplitRichTextEditorBlock,
  ExitedRichTextEditorCodeBlock,
  SelectedRichTextEditorAll,
  RestoredRichTextEditorSelection,
  MountedRichTextEditorHost,
  FailedMountRichTextEditorHost,
  UpdatedRichTextEditorSelection,
  OpenedRichTextEditorSlashMenu,
  ClosedRichTextEditorSlashMenu,
  UpdatedRichTextEditorSlashMenuQuery,
  MovedRichTextEditorSlashMenuSelection,
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorBlockFormat,
  ClickedRichTextEditorMark,
  ChangedRichTextCodeBlockLanguage,
  GotRichTextCodeBlockLanguageComboboxMessage,
  HighlightedRichTextCodeBlocks,
]);

export const RichTextMark = RichTextMarkSchema;
export const RichTextTextNode = RichTextTextNodeSchema;
export const RichTextHeadingLevel = RichTextHeadingLevelSchema;
export const RichTextBlockNode = Schema.Union([
  RichTextParagraphNodeSchema,
  RichTextHeadingNodeSchema,
  RichTextBlockquoteNodeSchema,
  RichTextCodeBlockNodeSchema,
]);
export const RichTextDocument = Schema.Struct({
  type: Schema.Literal("doc"),
  children: Schema.Array(RichTextBlockNode),
});
export const RichTextSelection = Schema.Struct({ anchor: Schema.Number, focus: Schema.Number });
export const RichTextSlashMenu = Schema.Struct({
  isOpen: Schema.Boolean,
  anchorSelection: RichTextSelection,
  query: Schema.String,
  activeIndex: Schema.Number,
});
export const RichTextEditorModel = Schema.Struct({
  document: RichTextDocument,
  selection: RichTextSelection,
  slashMenu: RichTextSlashMenu,
  codeBlockLanguageComboboxes: Schema.Array(Ui.Combobox.Model),
  codeBlockHighlights: Schema.Array(RichTextCodeBlockHighlight),
  maybeMountedHostId: Schema.Option(Schema.String),
});

export type RichTextMark = typeof RichTextMark.Type;
export type RichTextTextNode = typeof RichTextTextNode.Type;
export type RichTextHeadingLevel = typeof RichTextHeadingLevel.Type;
export type RichTextBlockNode = typeof RichTextBlockNode.Type;
export type RichTextDocument = typeof RichTextDocument.Type;
export type RichTextSelection = typeof RichTextSelection.Type;
export type RichTextSlashMenu = typeof RichTextSlashMenu.Type;
export type RichTextCodeHighlightToken = typeof RichTextCodeHighlightToken.Type;
export type RichTextCodeBlockHighlight = typeof RichTextCodeBlockHighlight.Type;
export type RichTextEditorModel = typeof RichTextEditorModel.Type;

export type RichTextEditorMessage = typeof RichTextEditorMessage.Type;
