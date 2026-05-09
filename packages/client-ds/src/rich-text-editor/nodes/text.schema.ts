import { Schema } from "effect";
import { RichTextMarkSchema } from "./mark.schema";

export const RichTextTextNodeSchema = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
  marks: Schema.optional(Schema.Array(RichTextMarkSchema)),
});

export type RichTextTextNode = typeof RichTextTextNodeSchema.Type;
