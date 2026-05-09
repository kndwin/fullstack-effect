import { Schema } from "effect";
import { m } from "foldkit/message";
import { RichTextBlockquoteNodeSchema } from "./nodes/blockquote.node";
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
  type: Schema.Union([Schema.Literal("paragraph"), Schema.Literal("heading"), Schema.Literal("blockquote")]),
  level: Schema.optional(Schema.Union([Schema.Literal(1), Schema.Literal(2), Schema.Literal(3)])),
});
export const ClickedRichTextEditorMark = m("ClickedRichTextEditorMark", {
  type: Schema.Union([Schema.Literal("bold"), Schema.Literal("italic")]),
});

export const RichTextEditorMessage = Schema.Union([
  InsertedRichTextEditorText,
  PastedRichTextEditorMarkdown,
  SyncedRichTextEditorPlainText,
  DeletedRichTextEditorBackward,
  SplitRichTextEditorBlock,
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
]);

export const RichTextMark = RichTextMarkSchema;
export const RichTextTextNode = RichTextTextNodeSchema;
export const RichTextHeadingLevel = RichTextHeadingLevelSchema;
export const RichTextBlockNode = Schema.Union([
  RichTextParagraphNodeSchema,
  RichTextHeadingNodeSchema,
  RichTextBlockquoteNodeSchema,
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
  maybeMountedHostId: Schema.Option(Schema.String),
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
