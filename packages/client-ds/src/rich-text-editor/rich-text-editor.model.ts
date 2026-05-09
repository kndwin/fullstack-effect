import {
  type RichTextBlockNode,
  type RichTextEditorMessage,
  type RichTextEditorModel,
  type RichTextHeadingLevel,
  type RichTextMark,
  type RichTextSelection,
  type RichTextSlashMenu,
  type RichTextTextNode,
} from "./rich-text-editor.schema";
import { filteredRichTextSlashCommands, normalizeRichTextSlashMenuIndex } from "./rich-text-editor.commands";
import { BoldNode, HeadingNode, ParagraphNode } from "./rich-text-editor.registry";
import { TextNode } from "./nodes/text.node";

export type TextSegment = Readonly<{
  blockIndex: number;
  inlineIndex: number;
  blockStart: number;
  start: number;
  end: number;
  node: RichTextTextNode;
}>;

export type BlockSegment = Readonly<{
  block: RichTextBlockNode;
  index: number;
  start: number;
  end: number;
}>;

const emptyTextNode = TextNode.empty;
export const paragraph = (text = ""): RichTextBlockNode => ParagraphNode.create([TextNode.of(text)]);
const heading = HeadingNode.create;
const blockWithChildren = (block: RichTextBlockNode, children: ReadonlyArray<RichTextTextNode>): RichTextBlockNode =>
  block.type === "heading" ? heading(block.level, children) : ParagraphNode.create(children);

export const closedSlashMenu = (selection: RichTextSelection): RichTextSlashMenu => ({
  isOpen: false,
  anchorSelection: selection,
  query: "",
  activeIndex: 0,
});

export const initRichTextEditor = (value = ""): RichTextEditorModel => ({
  document: { type: "doc", children: [paragraph(value)] },
  selection: { start: value.length, end: value.length },
  slashMenu: closedSlashMenu({ start: value.length, end: value.length }),
});

export const blockText = (block: RichTextBlockNode): string => block.children.map((node) => node.text).join("");

export const richTextEditorPlainText = (model: RichTextEditorModel): string =>
  model.document.children.map(blockText).join("\n");

export const normalizeSelection = (selection: RichTextSelection, textLength: number): RichTextSelection => {
  const start = Math.max(0, Math.min(selection.start, selection.end, textLength));
  const end = Math.max(0, Math.min(Math.max(selection.start, selection.end), textLength));
  return { start, end };
};

const normalizeBlock = (block: RichTextBlockNode): RichTextBlockNode => {
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
  return block.type === "heading" ? heading(block.level ?? 1, children) : ParagraphNode.create(children);
};

const normalizeModel = (model: RichTextEditorModel): RichTextEditorModel => {
  const children = model.document.children.length > 0 ? model.document.children.map(normalizeBlock) : [paragraph()];
  const textLength = children.map(blockText).join("\n").length;
  return {
    document: { type: "doc", children },
    selection: normalizeSelection(model.selection, textLength),
    slashMenu: model.slashMenu,
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
  return blocks.find((block) => offset >= block.start && offset <= block.end) ?? blocks.at(-1) ?? { block: paragraph(), index: 0, start: 0, end: 0 };
};

export const blockBoundaryForOffset = (
  model: RichTextEditorModel,
  offset: number,
  boundary: "start" | "end",
): number => {
  const block = blockSegmentAtOffset(model, offset);
  return boundary === "start" ? block.start : block.end;
};

const marksAtOffset = (model: RichTextEditorModel, offset: number): ReadonlyArray<RichTextMark> | undefined => {
  const segments = textSegments(model);
  const stored = segments.find((segment) => segment.start === offset && segment.end === offset);
  if (stored) return stored.node.marks;
  const previous = segments.find((segment) => offset > segment.start && offset <= segment.end);
  const current = segments.find((segment) => offset >= segment.start && offset < segment.end);
  return previous?.node.marks ?? current?.node.marks;
};

const textNodesInRange = (
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

const textNodeForInsertedText = (
  text: string,
  marks?: ReadonlyArray<RichTextMark>,
): ReadonlyArray<RichTextTextNode> => TextNode.inserted(text, marks);

const replaceRangeWithText = (model: RichTextEditorModel, text: string): RichTextEditorModel => {
  const plainText = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, plainText.length);
  const startBlock = blockSegmentAtOffset(model, selection.start);
  const endBlock = blockSegmentAtOffset(model, selection.end);
  const prefix = textNodesInRange(startBlock.block, startBlock.start, startBlock.start, selection.start);
  const suffix = textNodesInRange(endBlock.block, endBlock.start, selection.end, endBlock.end);
  const insertMarks = marksAtOffset(model, selection.start);
  const insertLines = text.split("\n");
  const replacementBlocks = insertLines.length === 1
    ? [
        normalizeBlock(blockWithChildren(startBlock.block, [...prefix, ...textNodeForInsertedText(insertLines[0] ?? "", insertMarks), ...suffix])),
      ]
    : insertLines.map((line, index): RichTextBlockNode => {
        const isFirst = index === 0;
        const isLast = index === insertLines.length - 1;

        const children = [
          ...(isFirst ? prefix : []),
          ...textNodeForInsertedText(line, insertMarks),
          ...(isLast ? suffix : []),
        ];
        return normalizeBlock(isFirst ? blockWithChildren(startBlock.block, children) : ParagraphNode.create(children));
      });
  const children = [
    ...model.document.children.slice(0, startBlock.index),
    ...replacementBlocks,
    ...model.document.children.slice(endBlock.index + 1),
  ];
  const cursor = selection.start + text.length;
  return normalizeModel({ ...model, document: { type: "doc", children }, selection: { start: cursor, end: cursor } });
};

const insertText = (model: RichTextEditorModel, text: string): RichTextEditorModel => replaceRangeWithText(model, text);

const syncPlainText = (model: RichTextEditorModel, text: string): RichTextEditorModel => {
  const children = text.split("\n").map((line) => ParagraphNode.create([TextNode.of(line)]));
  const nextModel = normalizeModel({
    ...model,
    document: { type: "doc", children },
    selection: { start: text.length, end: text.length },
  });
  return { ...nextModel, slashMenu: closedSlashMenu(nextModel.selection) };
};

const deleteBackward = (model: RichTextEditorModel, selectionOverride?: RichTextSelection): RichTextEditorModel => {
  const text = richTextEditorPlainText(model);
  const selection = normalizeSelection(selectionOverride ?? model.selection, text.length);
  if (selection.start !== selection.end) return replaceRangeWithText({ ...model, selection }, "");
  if (selection.start === 0) return model;
  return replaceRangeWithText({ ...model, selection: { start: selection.start - 1, end: selection.end } }, "");
};

const splitBlock = (model: RichTextEditorModel): RichTextEditorModel => {
  const text = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, text.length);
  return replaceRangeWithText({ ...model, selection }, "\n");
};

const setBlockFormat = (
  model: RichTextEditorModel,
  format: Readonly<{ type: "paragraph" | "heading"; level?: RichTextHeadingLevel }>,
): RichTextEditorModel => {
  const selection = normalizeSelection(model.selection, richTextEditorPlainText(model).length);
  let offset = 0;
  const blocks = model.document.children.map((block): RichTextBlockNode => {
    const start = offset;
    const end = start + blockText(block).length;
    offset = end + 1;
    if (selection.start > end || selection.end < start) return block;
    return format.type === "heading"
      ? HeadingNode.create(format.level ?? 1, block.children)
      : ParagraphNode.create(block.children);
  });
  return normalizeModel({ ...model, document: { type: "doc", children: blocks } });
};

const openSlashMenu = (model: RichTextEditorModel): RichTextEditorModel => {
  const anchorSelection = model.selection;
  const nextModel = insertText(model, "/");
  return { ...nextModel, slashMenu: { isOpen: true, anchorSelection, query: "", activeIndex: 0 } };
};

const closeSlashMenu = (model: RichTextEditorModel): RichTextEditorModel => {
  if (!model.slashMenu.isOpen) return model;
  const selection = { start: model.slashMenu.anchorSelection.start, end: model.selection.end };
  const nextModel = replaceRangeWithText({ ...model, selection }, "");
  return { ...nextModel, slashMenu: closedSlashMenu(nextModel.selection) };
};

const updateSlashMenuQuery = (model: RichTextEditorModel, query: string): RichTextEditorModel => {
  const previousQuery = model.slashMenu.query;
  const nextModel = query.startsWith(previousQuery)
    ? insertText(model, query.slice(previousQuery.length))
    : previousQuery.startsWith(query)
      ? deleteBackward(model, { start: model.selection.end - (previousQuery.length - query.length), end: model.selection.end })
      : replaceRangeWithText(
          { ...model, selection: { start: model.slashMenu.anchorSelection.start + 1, end: model.selection.end } },
          query,
        );

  return {
    ...nextModel,
    slashMenu: { ...model.slashMenu, query, activeIndex: normalizeRichTextSlashMenuIndex(query, 0) },
  };
};

const moveSlashMenuSelection = (model: RichTextEditorModel, delta: number): RichTextEditorModel => ({
  ...model,
  slashMenu: {
    ...model.slashMenu,
    activeIndex: normalizeRichTextSlashMenuIndex(model.slashMenu.query, model.slashMenu.activeIndex + delta),
  },
});

const marksWithToggledBold = BoldNode.toggle;

const toggleBold = (model: RichTextEditorModel): RichTextEditorModel => {
  const text = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, text.length);
  if (selection.start === selection.end) {
    const blockSegment = blockSegmentAtOffset(model, selection.start);
    const localOffset = selection.start - blockSegment.start;
    let offset = 0;
    let didInsertStoredMark = false;
    const children = blockSegment.block.children.flatMap((node): ReadonlyArray<RichTextTextNode> => {
      const nodeStart = offset;
      const nodeEnd = nodeStart + node.text.length;
      offset = nodeEnd;
      if (didInsertStoredMark) return [node];
      if (localOffset < nodeStart || localOffset > nodeEnd) return [node];

      const splitOffset = Math.max(0, Math.min(localOffset - nodeStart, node.text.length));
      const before = node.text.slice(0, splitOffset);
      const after = node.text.slice(splitOffset);
      didInsertStoredMark = true;
      const nextNodes: Array<RichTextTextNode> = [];
      if (before) nextNodes.push(TextNode.of(before, node.marks));
      nextNodes.push(TextNode.of("", marksWithToggledBold(node.marks)));
      if (after) nextNodes.push(TextNode.of(after, node.marks));
      return nextNodes;
    });
    const nextBlock = normalizeBlock(blockWithChildren(blockSegment.block, children));
    const blocks = model.document.children.map((block, index) => index === blockSegment.index ? nextBlock : block);
    return normalizeModel({ ...model, document: { type: "doc", children: blocks }, selection });
  }

  const blocks = model.document.children.map((block, blockIndex): RichTextBlockNode => {
    const children = textSegments(model)
      .filter((segment) => segment.blockIndex === blockIndex)
      .flatMap((segment): ReadonlyArray<RichTextTextNode> => {
        if (selection.end <= segment.start || selection.start >= segment.end) return [segment.node];
        const localStart = Math.max(0, selection.start - segment.start);
        const localEnd = Math.min(segment.node.text.length, selection.end - segment.start);
        const before = segment.node.text.slice(0, localStart);
        const selected = segment.node.text.slice(localStart, localEnd);
        const after = segment.node.text.slice(localEnd);
        const nextNodes: Array<RichTextTextNode> = [];
        if (before) nextNodes.push(TextNode.of(before, segment.node.marks));
        if (selected) nextNodes.push(TextNode.of(selected, marksWithToggledBold(segment.node.marks)));
        if (after) nextNodes.push(TextNode.of(after, segment.node.marks));
        return nextNodes;
      });
    return normalizeBlock({ ...block, children });
  });

  return normalizeModel({ ...model, document: { type: "doc", children: blocks } });
};

const toggleHeading = (model: RichTextEditorModel): RichTextEditorModel => {
  const currentBlock = blockSegmentAtOffset(model, model.selection.end).block;
  return setBlockFormat(model, currentBlock.type === "heading" ? { type: "paragraph" } : { type: "heading", level: 1 });
};

const applySlashCommand = (model: RichTextEditorModel, value: string): RichTextEditorModel => {
  const nextModel = closeSlashMenu(model);
  switch (value) {
    case "paragraph":
      return setBlockFormat(nextModel, { type: "paragraph" });
    case "heading-1":
      return setBlockFormat(nextModel, { type: "heading", level: 1 });
    case "heading-2":
      return setBlockFormat(nextModel, { type: "heading", level: 2 });
    case "heading-3":
      return setBlockFormat(nextModel, { type: "heading", level: 3 });
    case "bold":
      return toggleBold(nextModel);
    default:
      return nextModel;
  }
};

export const activeSlashCommandValue = (model: RichTextEditorModel): string | undefined => {
  const commands = filteredRichTextSlashCommands(model.slashMenu.query);
  return commands[normalizeRichTextSlashMenuIndex(model.slashMenu.query, model.slashMenu.activeIndex)]?.value;
};

export const updateRichTextEditor = (
  model: RichTextEditorModel,
  message: RichTextEditorMessage,
): RichTextEditorModel => {
  const messageTag = message["_tag"];
  switch (messageTag) {
    case "InsertedRichTextEditorText":
      return insertText(model, message.value);
    case "SyncedRichTextEditorPlainText":
      return syncPlainText(model, message.value);
    case "DeletedRichTextEditorBackward":
      return deleteBackward(
        model,
        message.start === undefined || message.end === undefined ? undefined : { start: message.start, end: message.end },
      );
    case "SplitRichTextEditorBlock":
      return splitBlock(model);
    case "SelectedRichTextEditorAll": {
      const textLength = richTextEditorPlainText(model).length;
      return { ...model, selection: { start: 0, end: textLength } };
    }
    case "RestoredRichTextEditorSelection":
      return model;
    case "ChangedRichTextEditorSelection":
      return { ...model, selection: normalizeSelection(message, richTextEditorPlainText(model).length) };
    case "OpenedRichTextEditorSlashMenu":
      return openSlashMenu(model);
    case "ClosedRichTextEditorSlashMenu":
      return closeSlashMenu(model);
    case "UpdatedRichTextEditorSlashMenuQuery":
      return updateSlashMenuQuery(model, message.value);
    case "MovedRichTextEditorSlashMenuSelection":
      return moveSlashMenuSelection(model, message.delta);
    case "SelectedRichTextEditorSlashCommand":
      return applySlashCommand(model, message.value);
    case "SetRichTextEditorBlockFormat":
      return setBlockFormat(model, { type: message.type, level: message.level as RichTextHeadingLevel | undefined });
    case "ToggledRichTextEditorBold":
      return toggleBold(model);
    case "ToggledRichTextEditorHeading":
      return toggleHeading(model);
  }
};
