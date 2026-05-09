import { MarkNode } from "./mark.node";

export const ItalicNode = MarkNode.define({
  kind: "italic" as const,
  keyboardShortcut: { key: "i", metaOrCtrl: true },
  slashCommand: { label: "Italic", value: "italic", description: "Toggle italic on the selected text." },
  toolbarItem: { label: "Italic", value: "italic" },
  className: "italic",
  markdown: { marker: "*", priority: 1 },
});
