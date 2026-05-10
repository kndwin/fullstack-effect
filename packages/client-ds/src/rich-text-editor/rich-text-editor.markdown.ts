import {
  blockSegments,
  blockText,
  isSelectionCollapsed,
  normalizeSelection,
  selectionEnd,
  selectionStart,
  textNodesInRange,
} from "./rich-text-editor.document";
import {
  BlockquoteNode,
  CodeBlockNode,
  HeadingNode,
  ParagraphNode,
  richTextMarkNodeForType,
  richTextMarkNodes,
} from "./rich-text-editor.registry";
import { TextNode } from "./nodes/text.node";
import { richTextCodeBlockLanguageFromMarkdown } from "./nodes/code-block.node";
import type {
  RichTextBlockNode,
  RichTextDocument,
  RichTextEditorModel,
  RichTextMark,
  RichTextTextNode,
} from "./rich-text-editor.schema";
import { richTextEditorPlainText } from "./rich-text-editor.model";

const sameMarks = (left: ReadonlyArray<RichTextMark>, right: ReadonlyArray<RichTextMark>): boolean =>
  TextNode.sameMarks(left, right);

const pushTextNode = (nodes: Array<RichTextTextNode>, text: string, marks: ReadonlyArray<RichTextMark> = []): void => {
  if (!text) return;
  const previous = nodes.at(-1);
  if (previous && sameMarks(previous.marks ?? [], marks)) {
    nodes[nodes.length - 1] = TextNode.of(previous.text + text, previous.marks);
    return;
  }
  nodes.push(TextNode.of(text, marks));
};

const parseInlineMarkdown = (value: string): ReadonlyArray<RichTextTextNode> => {
  const nodes: Array<RichTextTextNode> = [];
  let text = "";
  let index = 0;
  const activeMarks = new Set<RichTextMark["type"]>();
  const markdownMarks = [...richTextMarkNodes].toSorted(
    (left, right) => right.markdown.marker.length - left.markdown.marker.length,
  );

  const marks = (): ReadonlyArray<RichTextMark> =>
    [...richTextMarkNodes].filter((node) => activeMarks.has(node.kind)).map((node) => ({ type: node.kind }));
  const flush = () => {
    pushTextNode(nodes, text, marks());
    text = "";
  };

  while (index < value.length) {
    if (value.startsWith("\\", index) && index + 1 < value.length) {
      text += value[index + 1];
      index += 2;
      continue;
    }
    const matchedMark = markdownMarks.find((node) => value.startsWith(node.markdown.marker, index));
    if (matchedMark) {
      flush();
      if (activeMarks.has(matchedMark.kind)) activeMarks.delete(matchedMark.kind);
      else activeMarks.add(matchedMark.kind);
      index += matchedMark.markdown.marker.length;
      continue;
    }
    text += value[index];
    index += 1;
  }

  flush();
  return nodes.length > 0 ? nodes : [TextNode.empty()];
};

const markdownLineToBlock = (line: string): RichTextBlockNode => {
  const match = HeadingNode.markdown.matchLine(line);
  if (match) {
    return HeadingNode.create(match.level, parseInlineMarkdown(match.content));
  }
  const quoteMatch = BlockquoteNode.markdown.matchLine(line);
  if (quoteMatch) return BlockquoteNode.create(parseInlineMarkdown(quoteMatch.content));
  return ParagraphNode.create(parseInlineMarkdown(ParagraphNode.markdown.matchLine(line).content));
};

export const richTextDocumentFromMarkdown = (markdown: string): RichTextDocument => {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const children: Array<RichTextBlockNode> = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fenceMatch = /^(```|~~~)([\w.-]+)?\s*$/.exec(line);
    if (!fenceMatch) {
      children.push(markdownLineToBlock(line));
      continue;
    }

    const fence = fenceMatch[1] ?? "```";
    const closingFencePattern = new RegExp(`^${fence}\\s*$`);
    const codeLines: Array<string> = [];
    let closingFenceIndex = index + 1;
    while (closingFenceIndex < lines.length && !closingFencePattern.test(lines[closingFenceIndex] ?? "")) {
      codeLines.push(lines[closingFenceIndex] ?? "");
      closingFenceIndex += 1;
    }

    children.push(
      CodeBlockNode.create([TextNode.of(codeLines.join("\n"))], richTextCodeBlockLanguageFromMarkdown(fenceMatch[2])),
    );
    index = closingFenceIndex < lines.length ? closingFenceIndex : lines.length;
  }

  return { type: "doc", children };
};

const escapeMarkdownText = (value: string): string => value.replace(/([\\*#>])/g, "\\$1");

const textNodeMarkdown = (node: RichTextTextNode): string => {
  const text = escapeMarkdownText(node.text);
  return [...(node.marks ?? [])]
    .map((mark) => richTextMarkNodeForType(mark.type))
    .filter((markNode): markNode is NonNullable<typeof markNode> => markNode !== undefined)
    .toSorted((left, right) => right.markdown.priority - left.markdown.priority)
    .reduce((content, markNode) => `${markNode.markdown.marker}${content}${markNode.markdown.marker}`, text);
};

const blockMarkdown = (block: RichTextBlockNode): string => {
  const content = block.children.map(textNodeMarkdown).join("");
  if (block.type === "heading") return HeadingNode.markdown.serialize(block, content);
  if (block.type === "blockquote") return BlockquoteNode.markdown.serialize(block, content);
  if (block.type === "codeBlock") return CodeBlockNode.markdown.serialize(block, blockText(block));
  return ParagraphNode.markdown.serialize(block, content);
};

export const richTextDocumentMarkdown = (document: RichTextDocument): string =>
  document.children.map(blockMarkdown).join("\n");

export const richTextEditorMarkdown = (model: RichTextEditorModel): string => richTextDocumentMarkdown(model.document);

export const richTextEditorSelectedMarkdown = (model: RichTextEditorModel): string => {
  const textLength = richTextEditorPlainText(model).length;
  const selection = normalizeSelection(model.selection, textLength);
  if (isSelectionCollapsed(selection)) return "";
  const start = selectionStart(selection);
  const end = selectionEnd(selection);

  const blocks = blockSegments(model).flatMap((segment): ReadonlyArray<RichTextBlockNode> => {
    if (end <= segment.start || start >= segment.end) return [];
    const children = textNodesInRange(segment.block, segment.start, start, end);
    if (children.length === 0 && blockText(segment.block).length > 0) return [];
    return [{ ...segment.block, children: children.length > 0 ? children : [TextNode.empty()] }];
  });

  return richTextDocumentMarkdown({ type: "doc", children: blocks });
};
