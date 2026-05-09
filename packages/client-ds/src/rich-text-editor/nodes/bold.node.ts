import { MarkNode } from "./mark.node";

export const BoldNode = MarkNode.define({
  kind: "bold" as const,
  keyboardShortcut: { key: "b", metaOrCtrl: true },
  slashCommand: { label: "Bold", value: "bold", description: "Toggle bold on the selected text." },
  toolbarItem: { label: "Bold", value: "bold" },
  className: "font-semibold",
  markdown: { marker: "**", priority: 2 },
});
