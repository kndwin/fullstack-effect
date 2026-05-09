import { Schema } from "effect";

export const RichTextBoldMarkSchema = Schema.Struct({ type: Schema.Literal("bold") });
export const RichTextItalicMarkSchema = Schema.Struct({ type: Schema.Literal("italic") });
export const RichTextMarkSchema = Schema.Union([RichTextBoldMarkSchema, RichTextItalicMarkSchema]);

export type RichTextMark = typeof RichTextMarkSchema.Type;
export type RichTextMarkType = RichTextMark["type"];
