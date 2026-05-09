import type { RichTextMark } from "../rich-text-editor.schema";

export const BoldNode = {
  kind: "bold",
  slashCommand: { label: "Bold", value: "bold", description: "Toggle bold on the selected text." },
  toolbarItem: { label: "Bold" },
  has: (marks?: ReadonlyArray<RichTextMark>): boolean => marks?.some((mark) => mark.type === "bold") ?? false,
  toggle: (marks?: ReadonlyArray<RichTextMark>): ReadonlyArray<RichTextMark> | undefined => {
    const current = marks ?? [];
    return BoldNode.has(current) ? current.filter((mark) => mark.type !== "bold") : [...current, { type: "bold" }];
  },
} as const;
