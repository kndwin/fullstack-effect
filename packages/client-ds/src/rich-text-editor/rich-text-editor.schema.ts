import { Schema } from "effect";
import { m } from "foldkit/message";
import { RichTextHeadingLevelSchema, RichTextHeadingNodeSchema } from "./nodes/heading.node";
import { RichTextParagraphNodeSchema } from "./nodes/paragraph.node";
import { RichTextBoldMark, RichTextTextNodeSchema } from "./nodes/text.node";

export const InsertedRichTextEditorText = m("InsertedRichTextEditorText", { value: Schema.String });
export const SyncedRichTextEditorPlainText = m("SyncedRichTextEditorPlainText", { value: Schema.String });
export const DeletedRichTextEditorBackward = m("DeletedRichTextEditorBackward", {
  start: Schema.optional(Schema.Number),
  end: Schema.optional(Schema.Number),
});
export const SplitRichTextEditorBlock = m("SplitRichTextEditorBlock");
export const SelectedRichTextEditorAll = m("SelectedRichTextEditorAll");
export const RestoredRichTextEditorSelection = m("RestoredRichTextEditorSelection");
export const ChangedRichTextEditorSelection = m("ChangedRichTextEditorSelection", {
  start: Schema.Number,
  end: Schema.Number,
});
export const OpenedRichTextEditorSlashMenu = m("OpenedRichTextEditorSlashMenu");
export const ClosedRichTextEditorSlashMenu = m("ClosedRichTextEditorSlashMenu");
export const UpdatedRichTextEditorSlashMenuQuery = m("UpdatedRichTextEditorSlashMenuQuery", { value: Schema.String });
export const MovedRichTextEditorSlashMenuSelection = m("MovedRichTextEditorSlashMenuSelection", { delta: Schema.Number });
export const SelectedRichTextEditorSlashCommand = m("SelectedRichTextEditorSlashCommand", { value: Schema.String });
export const SetRichTextEditorBlockFormat = m("SetRichTextEditorBlockFormat", {
  type: Schema.Union([Schema.Literal("paragraph"), Schema.Literal("heading")]),
  level: Schema.optional(Schema.Union([Schema.Literal(1), Schema.Literal(2), Schema.Literal(3)])),
});
export const ToggledRichTextEditorBold = m("ToggledRichTextEditorBold");
export const ToggledRichTextEditorHeading = m("ToggledRichTextEditorHeading");

export const RichTextEditorMessage = Schema.Union([
  InsertedRichTextEditorText,
  SyncedRichTextEditorPlainText,
  DeletedRichTextEditorBackward,
  SplitRichTextEditorBlock,
  SelectedRichTextEditorAll,
  RestoredRichTextEditorSelection,
  ChangedRichTextEditorSelection,
  OpenedRichTextEditorSlashMenu,
  ClosedRichTextEditorSlashMenu,
  UpdatedRichTextEditorSlashMenuQuery,
  MovedRichTextEditorSlashMenuSelection,
  SelectedRichTextEditorSlashCommand,
  SetRichTextEditorBlockFormat,
  ToggledRichTextEditorBold,
  ToggledRichTextEditorHeading,
]);

export const RichTextMark = RichTextBoldMark;
export const RichTextTextNode = RichTextTextNodeSchema;
export const RichTextHeadingLevel = RichTextHeadingLevelSchema;
export const RichTextBlockNode = Schema.Union([RichTextParagraphNodeSchema, RichTextHeadingNodeSchema]);
export const RichTextDocument = Schema.Struct({ type: Schema.Literal("doc"), children: Schema.Array(RichTextBlockNode) });
export const RichTextSelection = Schema.Struct({ start: Schema.Number, end: Schema.Number });
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
});

export type RichTextMark = typeof RichTextMark.Type;
export type RichTextTextNode = typeof RichTextTextNode.Type;
export type RichTextHeadingLevel = typeof RichTextHeadingLevel.Type;
export type RichTextBlockNode = typeof RichTextBlockNode.Type;
export type RichTextDocument = typeof RichTextDocument.Type;
export type RichTextSelection = typeof RichTextSelection.Type;
export type RichTextSlashMenu = typeof RichTextSlashMenu.Type;
export type RichTextEditorModel = typeof RichTextEditorModel.Type;

export type RichTextEditorMessage = typeof RichTextEditorMessage.Type;
