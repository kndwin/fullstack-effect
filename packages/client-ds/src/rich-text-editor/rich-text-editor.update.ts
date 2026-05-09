import { Match as M, Option } from "effect";
import { normalizeRichTextSlashMenuIndex } from "./rich-text-editor.commands";
import {
  blockSegmentAtOffset,
  blockText,
  blockWithChildren,
  collapsedSelection,
  isSelectionCollapsed,
  marksAtOffset,
  normalizeBlock,
  normalizeModel,
  normalizeSelection,
  selectionEnd,
  selectionStart,
  textNodesInRange,
  textSegments,
} from "./rich-text-editor.document";
import { richTextEditorPlainText, resetRichTextEditorSlashMenu } from "./rich-text-editor.model";
import { richTextDocumentFromMarkdown } from "./rich-text-editor.markdown";
import {
  ParagraphNode,
  richTextBlockFormatForSlashCommand,
  richTextCreateBlock,
  richTextMarkTypeForSlashCommand,
  type RichTextBlockFormat,
} from "./rich-text-editor.registry";
import { MarkNode } from "./nodes/mark.node";
import type { RichTextMarkType } from "./nodes/mark.schema";
import type {
  RichTextBlockNode,
  RichTextEditorMessage,
  RichTextEditorModel,
  RichTextMark,
  RichTextSelection,
  RichTextTextNode,
} from "./rich-text-editor.schema";
import { TextNode } from "./nodes/text.node";

const textNodeForInsertedText = (text: string, marks?: ReadonlyArray<RichTextMark>): ReadonlyArray<RichTextTextNode> =>
  TextNode.inserted(text, marks);

const selectionFromRange = (start: number, end: number): RichTextSelection => ({ anchor: start, focus: end });

const replaceRangeWithText = (model: RichTextEditorModel, text: string): RichTextEditorModel => {
  const plainText = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, plainText.length);
  const start = selectionStart(selection);
  const end = selectionEnd(selection);
  const startBlock = blockSegmentAtOffset(model, start);
  const endBlock = blockSegmentAtOffset(model, end);
  const prefix = textNodesInRange(startBlock.block, startBlock.start, startBlock.start, start);
  const suffix = textNodesInRange(endBlock.block, endBlock.start, end, endBlock.end);
  const insertMarks = marksAtOffset(model, start);
  const insertLines = text.split("\n");
  const replacementBlocks =
    insertLines.length === 1
      ? [
          normalizeBlock(
            blockWithChildren(startBlock.block, [
              ...prefix,
              ...textNodeForInsertedText(insertLines[0] ?? "", insertMarks),
              ...suffix,
            ]),
          ),
        ]
      : insertLines.map((line, index): RichTextBlockNode => {
          const isFirst = index === 0;
          const isLast = index === insertLines.length - 1;

          const children = [
            ...(isFirst ? prefix : []),
            ...textNodeForInsertedText(line, insertMarks),
            ...(isLast ? suffix : []),
          ];
          return normalizeBlock(
            isFirst ? blockWithChildren(startBlock.block, children) : ParagraphNode.create(children),
          );
        });
  const normalizedReplacementBlocks =
    text === ""
      ? replacementBlocks.map((block) =>
          blockText(block).length === 0 ? richTextCreateBlock({ type: "paragraph" }, block.children) : block,
        )
      : replacementBlocks;
  const children = [
    ...model.document.children.slice(0, startBlock.index),
    ...normalizedReplacementBlocks,
    ...model.document.children.slice(endBlock.index + 1),
  ];
  const cursor = start + text.length;
  return normalizeModel({ ...model, document: { type: "doc", children }, selection: collapsedSelection(cursor) });
};

const applyTextInputRule = (model: RichTextEditorModel, text: string): RichTextEditorModel | undefined => {
  const plainText = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, plainText.length);
  const start = selectionStart(selection);
  if (text !== " " || !isSelectionCollapsed(selection)) return undefined;

  const blockSegment = blockSegmentAtOffset(model, start);
  const currentBlockText = blockText(blockSegment.block);

  const headingLevel =
    currentBlockText === "#" ? 1 : currentBlockText === "##" ? 2 : currentBlockText === "###" ? 3 : undefined;
  if (headingLevel !== undefined && start === blockSegment.start + currentBlockText.length) {
    const blocks = model.document.children.map((block, index) =>
      index === blockSegment.index
        ? richTextCreateBlock({ type: "heading", level: headingLevel }, [TextNode.empty()])
        : block,
    );
    return normalizeModel({
      ...model,
      document: { type: "doc", children: blocks },
      selection: collapsedSelection(blockSegment.start),
    });
  }

  if (start !== blockSegment.start + 1 || currentBlockText !== ">") return undefined;

  const blocks = model.document.children.map((block, index) =>
    index === blockSegment.index ? richTextCreateBlock({ type: "blockquote" }, [TextNode.empty()]) : block,
  );
  return normalizeModel({
    ...model,
    document: { type: "doc", children: blocks },
    selection: collapsedSelection(blockSegment.start),
  });
};

const insertText = (model: RichTextEditorModel, text: string): RichTextEditorModel =>
  applyTextInputRule(model, text) ?? replaceRangeWithText(model, text);

const pasteMarkdown = (
  model: RichTextEditorModel,
  markdown: string,
  selectionOverride?: RichTextSelection,
): RichTextEditorModel => {
  const plainText = richTextEditorPlainText(model);
  const selection = normalizeSelection(selectionOverride ?? model.selection, plainText.length);
  const start = selectionStart(selection);
  const end = selectionEnd(selection);
  const startBlock = blockSegmentAtOffset(model, start);
  const endBlock = blockSegmentAtOffset(model, end);
  const prefix = textNodesInRange(startBlock.block, startBlock.start, startBlock.start, start);
  const suffix = textNodesInRange(endBlock.block, endBlock.start, end, endBlock.end);
  const pastedBlocks = richTextDocumentFromMarkdown(markdown).children;
  const replacementBlocks = pastedBlocks.map((block, index): RichTextBlockNode => {
    const isFirst = index === 0;
    const isLast = index === pastedBlocks.length - 1;
    const children = [...(isFirst ? prefix : []), ...block.children, ...(isLast ? suffix : [])];
    return normalizeBlock(blockWithChildren(block, children));
  });
  const children = [
    ...model.document.children.slice(0, startBlock.index),
    ...replacementBlocks,
    ...model.document.children.slice(endBlock.index + 1),
  ];
  const pastedTextLength = pastedBlocks.map(blockText).join("\n").length;
  const cursor = start + pastedTextLength;
  return resetRichTextEditorSlashMenu(
    normalizeModel({
      ...model,
      document: { type: "doc", children },
      selection: collapsedSelection(cursor),
    }),
  );
};

const syncPlainText = (model: RichTextEditorModel, text: string): RichTextEditorModel => {
  const children = text.split("\n").map((line) => ParagraphNode.create([TextNode.of(line)]));
  return resetRichTextEditorSlashMenu(
    normalizeModel({
      ...model,
      document: { type: "doc", children },
      selection: collapsedSelection(text.length),
    }),
  );
};

const previousWordBoundary = (text: string, offset: number): number => {
  let index = Math.max(0, Math.min(offset, text.length));
  while (index > 0 && /\s/.test(text[index - 1] ?? "")) index -= 1;
  while (index > 0 && !/\s/.test(text[index - 1] ?? "")) index -= 1;
  return index;
};

const deleteBackward = (
  model: RichTextEditorModel,
  selectionOverride?: RichTextSelection,
  unit: "character" | "word" = "character",
): RichTextEditorModel => {
  const text = richTextEditorPlainText(model);
  const selection = normalizeSelection(selectionOverride ?? model.selection, text.length);
  const start = selectionStart(selection);
  const end = selectionEnd(selection);
  if (!isSelectionCollapsed(selection)) return replaceRangeWithText({ ...model, selection }, "");
  const blockSegment = blockSegmentAtOffset(model, start);
  if (
    start === blockSegment.start &&
    blockText(blockSegment.block).length === 0 &&
    blockSegment.block.type !== "paragraph"
  ) {
    const blocks = model.document.children.map((block, index) =>
      index === blockSegment.index ? richTextCreateBlock({ type: "paragraph" }, block.children) : block,
    );
    return normalizeModel({ ...model, document: { type: "doc", children: blocks }, selection });
  }
  if (start === 0) return model;
  return replaceRangeWithText(
    {
      ...model,
      selection: {
        anchor: unit === "word" ? previousWordBoundary(text, start) : start - 1,
        focus: end,
      },
    },
    "",
  );
};

const splitBlock = (model: RichTextEditorModel): RichTextEditorModel => {
  const text = richTextEditorPlainText(model);
  const selection = normalizeSelection(model.selection, text.length);
  return replaceRangeWithText({ ...model, selection }, "\n");
};

const setBlockFormat = (model: RichTextEditorModel, format: RichTextBlockFormat): RichTextEditorModel => {
  const selection = normalizeSelection(model.selection, richTextEditorPlainText(model).length);
  const selectedStart = selectionStart(selection);
  const selectedEnd = selectionEnd(selection);
  let offset = 0;
  const blocks = model.document.children.map((block): RichTextBlockNode => {
    const start = offset;
    const end = start + blockText(block).length;
    offset = end + 1;
    if (selectedStart > end || selectedEnd < start) return block;
    return richTextCreateBlock(format, block.children);
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
  const selection = selectionFromRange(model.slashMenu.anchorSelection.anchor, model.selection.focus);
  const nextModel = replaceRangeWithText({ ...model, selection }, "");
  return resetRichTextEditorSlashMenu(nextModel);
};

const updateSlashMenuQuery = (model: RichTextEditorModel, query: string): RichTextEditorModel => {
  const previousQuery = model.slashMenu.query;
  const nextModel = query.startsWith(previousQuery)
    ? insertText(model, query.slice(previousQuery.length))
    : previousQuery.startsWith(query)
      ? deleteBackward(model, {
          anchor: model.selection.focus - (previousQuery.length - query.length),
          focus: model.selection.focus,
        })
      : replaceRangeWithText(
          { ...model, selection: selectionFromRange(model.slashMenu.anchorSelection.anchor + 1, model.selection.focus) },
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
  const start = selectionStart(selection);
  const end = selectionEnd(selection);
  if (isSelectionCollapsed(selection)) {
    const blockSegment = blockSegmentAtOffset(model, start);
    const localOffset = start - blockSegment.start;
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
    const blocks = model.document.children.map((block, index) => (index === blockSegment.index ? nextBlock : block));
    return normalizeModel({ ...model, document: { type: "doc", children: blocks }, selection });
  }

  const blocks = model.document.children.map((block, blockIndex): RichTextBlockNode => {
    const children = textSegments(model)
      .filter((segment) => segment.blockIndex === blockIndex)
      .flatMap((segment): ReadonlyArray<RichTextTextNode> => {
        if (end <= segment.start || start >= segment.end) return [segment.node];
        const localStart = Math.max(0, start - segment.start);
        const localEnd = Math.min(segment.node.text.length, end - segment.start);
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

export const updateRichTextEditor = (model: RichTextEditorModel, message: RichTextEditorMessage): RichTextEditorModel =>
  M.value(message).pipe(
    M.withReturnType<RichTextEditorModel>(),
    M.tagsExhaustive({
      InsertedRichTextEditorText: ({ value }) => insertText(model, value),
      PastedRichTextEditorMarkdown: ({ value, start, end }) =>
        pasteMarkdown(model, value, start === undefined || end === undefined ? undefined : selectionFromRange(start, end)),
      SyncedRichTextEditorPlainText: ({ value }) => syncPlainText(model, value),
      DeletedRichTextEditorBackward: ({ start, end, unit }) =>
        deleteBackward(model, start === undefined || end === undefined ? undefined : selectionFromRange(start, end), unit),
      SplitRichTextEditorBlock: () => splitBlock(model),
      SelectedRichTextEditorAll: () => {
        const textLength = richTextEditorPlainText(model).length;
        return { ...model, selection: selectionFromRange(0, textLength) };
      },
      RestoredRichTextEditorSelection: () => model,
      MountedRichTextEditorHost: ({ id }) => ({ ...model, maybeMountedHostId: Option.some(id) }),
      FailedMountRichTextEditorHost: () => model,
      UpdatedRichTextEditorSelection: (selection) => ({
        ...model,
        selection: normalizeSelection(selectionFromRange(selection.start, selection.end), richTextEditorPlainText(model).length),
      }),
      OpenedRichTextEditorSlashMenu: () => openSlashMenu(model),
      ClosedRichTextEditorSlashMenu: () => closeSlashMenu(model),
      UpdatedRichTextEditorSlashMenuQuery: ({ value }) => updateSlashMenuQuery(model, value),
      MovedRichTextEditorSlashMenuSelection: ({ delta }) => moveSlashMenuSelection(model, delta),
      SelectedRichTextEditorSlashCommand: ({ value }) => applySlashCommand(model, value),
      SelectedRichTextEditorBlockFormat: ({ type, level }) => setBlockFormat(model, { type, level }),
      ClickedRichTextEditorMark: ({ type }) => toggleMark(model, type),
    }),
  );
