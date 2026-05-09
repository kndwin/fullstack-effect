import type {
  RichTextBlockNode,
  RichTextEditorModel,
  RichTextMark,
  RichTextSelection,
  RichTextTextNode,
} from "./rich-text-editor.schema";
import { ParagraphNode, richTextCreateBlock } from "./rich-text-editor.registry";
import { TextNode } from "./nodes/text.node";

type TextSegment = Readonly<{
  blockIndex: number;
  inlineIndex: number;
  blockStart: number;
  start: number;
  end: number;
  node: RichTextTextNode;
}>;

type BlockSegment = Readonly<{
  block: RichTextBlockNode;
  index: number;
  start: number;
  end: number;
}>;

const emptyTextNode = TextNode.empty;

export const paragraph = (text = ""): RichTextBlockNode => ParagraphNode.create([TextNode.of(text)]);

export const blockWithChildren = (
  block: RichTextBlockNode,
  children: ReadonlyArray<RichTextTextNode>,
): RichTextBlockNode => richTextCreateBlock(block, children);

export const blockText = (block: RichTextBlockNode): string => block.children.map((node) => node.text).join("");

export const normalizeSelection = (selection: RichTextSelection, textLength: number): RichTextSelection => {
  const anchor = Math.max(0, Math.min(selection.anchor, textLength));
  const focus = Math.max(0, Math.min(selection.focus, textLength));
  return { anchor, focus };
};

export const collapsedSelection = (offset: number): RichTextSelection => ({ anchor: offset, focus: offset });

export const selectionStart = (selection: RichTextSelection): number => Math.min(selection.anchor, selection.focus);

export const selectionEnd = (selection: RichTextSelection): number => Math.max(selection.anchor, selection.focus);

export const isSelectionCollapsed = (selection: RichTextSelection): boolean => selection.anchor === selection.focus;

export const normalizeBlock = (block: RichTextBlockNode): RichTextBlockNode => {
  const merged = block.children.reduce<Array<RichTextTextNode>>((nodes, node) => {
    const cleanNode = TextNode.clean(node);
    const previous = nodes.at(-1);
    if (previous && TextNode.sameMarks(previous.marks, cleanNode.marks)) {
      nodes[nodes.length - 1] = TextNode.of(previous.text + cleanNode.text, previous.marks);
      return nodes;
    }
    nodes.push(cleanNode);
    return nodes;
  }, []);

  const children = merged.length > 0 ? merged : [emptyTextNode()];
  return richTextCreateBlock(block, children);
};

export const normalizeModel = (model: RichTextEditorModel): RichTextEditorModel => {
  const children = model.document.children.length > 0 ? model.document.children.map(normalizeBlock) : [paragraph()];
  const textLength = children.map(blockText).join("\n").length;
  return {
    document: { type: "doc", children },
    selection: normalizeSelection(model.selection, textLength),
    slashMenu: model.slashMenu,
    maybeMountedHostId: model.maybeMountedHostId,
  };
};

export const textSegments = (model: RichTextEditorModel): ReadonlyArray<TextSegment> => {
  const segments: Array<TextSegment> = [];
  let offset = 0;

  model.document.children.forEach((block, blockIndex) => {
    const blockStart = offset;
    block.children.forEach((node, inlineIndex) => {
      const start = offset;
      const end = start + node.text.length;
      segments.push({ blockIndex, inlineIndex, blockStart, start, end, node });
      offset = end;
    });
    if (blockIndex < model.document.children.length - 1) offset += 1;
  });

  return segments;
};

export const blockSegments = (model: RichTextEditorModel): ReadonlyArray<BlockSegment> => {
  let offset = 0;

  return model.document.children.map((block, index) => {
    const start = offset;
    const end = start + blockText(block).length;
    offset = end + 1;
    return { block, index, start, end };
  });
};

export const blockSegmentAtOffset = (model: RichTextEditorModel, offset: number): BlockSegment => {
  const blocks = blockSegments(model);
  return (
    blocks.find((block) => offset >= block.start && offset <= block.end) ??
    blocks.at(-1) ?? { block: paragraph(), index: 0, start: 0, end: 0 }
  );
};

export const blockBoundaryForOffset = (
  model: RichTextEditorModel,
  offset: number,
  boundary: "start" | "end",
): number => {
  const block = blockSegmentAtOffset(model, offset);
  return boundary === "start" ? block.start : block.end;
};

export const marksAtOffset = (model: RichTextEditorModel, offset: number): ReadonlyArray<RichTextMark> | undefined => {
  const segments = textSegments(model);
  const stored = segments.find((segment) => segment.start === offset && segment.end === offset);
  if (stored) return stored.node.marks;
  const previous = segments.find((segment) => offset > segment.start && offset <= segment.end);
  const current = segments.find((segment) => offset >= segment.start && offset < segment.end);
  return previous?.node.marks ?? current?.node.marks;
};

export const textNodesInRange = (
  block: RichTextBlockNode,
  blockStart: number,
  start: number,
  end: number,
): ReadonlyArray<RichTextTextNode> => {
  let offset = blockStart;

  return block.children.flatMap((node): ReadonlyArray<RichTextTextNode> => {
    const nodeStart = offset;
    const nodeEnd = nodeStart + node.text.length;
    offset = nodeEnd;

    if (end <= nodeStart || start >= nodeEnd) return [];

    const localStart = Math.max(0, start - nodeStart);
    const localEnd = Math.min(node.text.length, end - nodeStart);
    const text = node.text.slice(localStart, localEnd);

    return text.length > 0 ? [TextNode.of(text, node.marks)] : [];
  });
};
