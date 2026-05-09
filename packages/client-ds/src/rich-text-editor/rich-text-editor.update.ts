import { Match as M, Option } from "effect";
import { normalizeRichTextSlashMenuIndex } from "./rich-text-editor.commands";
import {
  blockSegmentAtOffset,
  blockText,
  blockWithChildren,
  marksAtOffset,
  normalizeBlock,
  normalizeModel,
  normalizeSelection,
  textNodesInRange,
  textSegments,
} from "./rich-text-editor.document";
import { richTextEditorPlainText, resetRichTextEditorSlashMenu } from "./rich-text-editor.model";
import { richTextDocumentFromMarkdown } from "./rich-text-editor.markdown";
import { HeadingNode, ParagraphNode, richTextBlockFormatForSlashCommand, richTextMarkTypeForSlashCommand } from "./rich-text-editor.registry";
import { MarkNode } from "./nodes/mark.node";
import type { RichTextMarkType } from "./nodes/mark.schema";
import type {
  RichTextBlockNode,
  RichTextEditorMessage,
  RichTextEditorModel,
  RichTextHeadingLevel,
  RichTextMark,
  RichTextSelection,
  RichTextTextNode,
} from "./rich-text-editor.schema";
import { TextNode } from "./nodes/text.node";

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

const pasteMarkdown = (model: RichTextEditorModel, markdown: string, selectionOverride?: RichTextSelection): RichTextEditorModel => {
  const plainText = richTextEditorPlainText(model);
  const selection = normalizeSelection(selectionOverride ?? model.selection, plainText.length);
  const startBlock = blockSegmentAtOffset(model, selection.start);
  const endBlock = blockSegmentAtOffset(model, selection.end);
  const prefix = textNodesInRange(startBlock.block, startBlock.start, startBlock.start, selection.start);
  const suffix = textNodesInRange(endBlock.block, endBlock.start, selection.end, endBlock.end);
  const pastedBlocks = richTextDocumentFromMarkdown(markdown).children;
  const replacementBlocks = pastedBlocks.map((block, index): RichTextBlockNode => {
    const isFirst = index === 0;
    const isLast = index === pastedBlocks.length - 1;
    const children = [
      ...(isFirst ? prefix : []),
      ...block.children,
      ...(isLast ? suffix : []),
    ];
    return normalizeBlock(blockWithChildren(block, children));
  });
  const children = [
    ...model.document.children.slice(0, startBlock.index),
    ...replacementBlocks,
    ...model.document.children.slice(endBlock.index + 1),
  ];
  const pastedTextLength = pastedBlocks.map(blockText).join("\n").length;
  const cursor = selection.start + pastedTextLength;
  return resetRichTextEditorSlashMenu(normalizeModel({
    ...model,
    document: { type: "doc", children },
    selection: { start: cursor, end: cursor },
  }));
};

const syncPlainText = (model: RichTextEditorModel, text: string): RichTextEditorModel => {
  const children = text.split("\n").map((line) => ParagraphNode.create([TextNode.of(line)]));
  return resetRichTextEditorSlashMenu(normalizeModel({
    ...model,
    document: { type: "doc", children },
    selection: { start: text.length, end: text.length },
  }));
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
  return resetRichTextEditorSlashMenu(nextModel);
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

const toggleMark = (model: RichTextEditorModel, markType: RichTextMarkType): RichTextEditorModel => {
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

      didInsertStoredMark = true;
      return MarkNode.insertStoredMark(node, localOffset - nodeStart, markType);
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
        return MarkNode.toggleRange(segment.node, localStart, localEnd, markType);
      });
    return normalizeBlock({ ...block, children });
  });

  return normalizeModel({ ...model, document: { type: "doc", children: blocks } });
};

const applySlashCommand = (model: RichTextEditorModel, value: string): RichTextEditorModel => {
  const nextModel = closeSlashMenu(model);
  const blockFormat = richTextBlockFormatForSlashCommand(value);
  if (blockFormat) return setBlockFormat(nextModel, blockFormat);
  const markType = richTextMarkTypeForSlashCommand(value);
  return markType ? toggleMark(nextModel, markType) : nextModel;
};

export const updateRichTextEditor = (
  model: RichTextEditorModel,
  message: RichTextEditorMessage,
): RichTextEditorModel =>
  M.value(message).pipe(
    M.withReturnType<RichTextEditorModel>(),
    M.tagsExhaustive({
      InsertedRichTextEditorText: ({ value }) => insertText(model, value),
      PastedRichTextEditorMarkdown: ({ value, start, end }) =>
        pasteMarkdown(model, value, start === undefined || end === undefined ? undefined : { start, end }),
      SyncedRichTextEditorPlainText: ({ value }) => syncPlainText(model, value),
      DeletedRichTextEditorBackward: ({ start, end }) =>
        deleteBackward(model, start === undefined || end === undefined ? undefined : { start, end }),
      SplitRichTextEditorBlock: () => splitBlock(model),
      SelectedRichTextEditorAll: () => {
        const textLength = richTextEditorPlainText(model).length;
        return { ...model, selection: { start: 0, end: textLength } };
      },
      RestoredRichTextEditorSelection: () => model,
      MountedRichTextEditorHost: ({ id }) => ({ ...model, maybeMountedHostId: Option.some(id) }),
      FailedMountRichTextEditorHost: () => model,
      ChangedRichTextEditorSelection: (selection) => ({
        ...model,
        selection: normalizeSelection(selection, richTextEditorPlainText(model).length),
      }),
      OpenedRichTextEditorSlashMenu: () => openSlashMenu(model),
      ClosedRichTextEditorSlashMenu: () => closeSlashMenu(model),
      UpdatedRichTextEditorSlashMenuQuery: ({ value }) => updateSlashMenuQuery(model, value),
      MovedRichTextEditorSlashMenuSelection: ({ delta }) => moveSlashMenuSelection(model, delta),
      SelectedRichTextEditorSlashCommand: ({ value }) => applySlashCommand(model, value),
      SetRichTextEditorBlockFormat: ({ type, level }) =>
        setBlockFormat(model, { type, level: level as RichTextHeadingLevel | undefined }),
      ToggledRichTextEditorMark: ({ type }) => toggleMark(model, type),
    }),
  );
