import {
  ChangedRichTextEditorSelection,
  type RichTextSelection,
} from "./rich-text-editor.schema";

const textLengthBeforeChildOffset = (element: Element, childOffset: number): number =>
  Array.from(element.childNodes)
    .slice(0, childOffset)
    .reduce((length, child) => length + (child.textContent?.length ?? 0), 0);

const textOffsetWithin = (target: Node, targetOffset: number, textLength: number): number => {
  const element = target.nodeType === Node.ELEMENT_NODE ? target as Element : target.parentElement;
  const textElement = element?.closest("[data-rte-start][data-rte-end]") as HTMLElement | null;
  if (textElement) {
    const start = Number(textElement.dataset.rteStart ?? 0);
    const localOffset = target.nodeType === Node.ELEMENT_NODE
      ? textLengthBeforeChildOffset(target as Element, targetOffset)
      : targetOffset;
    return Math.max(0, Math.min(start + localOffset, textLength));
  }

  if (target.nodeType === Node.ELEMENT_NODE) {
    const endpointElement = target as Element;
    const child = endpointElement.childNodes.item(targetOffset);
    const nextTextElement = (child?.nodeType === Node.ELEMENT_NODE ? child as Element : child?.parentElement)
      ?.querySelector?.("[data-rte-start][data-rte-end]") as HTMLElement | null;
    if (nextTextElement) return Number(nextTextElement.dataset.rteStart ?? 0);

    const previousTextElement = Array.from(endpointElement.querySelectorAll<HTMLElement>("[data-rte-start][data-rte-end]")).at(-1);
    if (previousTextElement) return Number(previousTextElement.dataset.rteEnd ?? textLength);
  }

  return textLength;
};

export const richTextSelectionMessageFromDom = (textLength: number): typeof ChangedRichTextEditorSelection.Type => {
  if (typeof window === "undefined" || typeof window.getSelection !== "function") {
    return ChangedRichTextEditorSelection({ start: textLength, end: textLength });
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return ChangedRichTextEditorSelection({ start: textLength, end: textLength });

  const range = selection.getRangeAt(0);
  const root = (range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? range.commonAncestorContainer as Element
    : range.commonAncestorContainer.parentElement)?.closest('[contenteditable="true"]');
  if (!root) return ChangedRichTextEditorSelection({ start: textLength, end: textLength });

  return ChangedRichTextEditorSelection({
    start: textOffsetWithin(range.startContainer, range.startOffset, textLength),
    end: textOffsetWithin(range.endContainer, range.endOffset, textLength),
  });
};

export const selectRichTextEditorDomAll = (id: string): void => {
  if (typeof document === "undefined" || typeof window === "undefined" || typeof window.getSelection !== "function") return;
  const root = document.getElementById(id);
  if (!root) return;

  const range = document.createRange();
  range.selectNodeContents(root);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
  root.focus();
};

const textNodeForOffset = (root: Element, offset: number): { node: Text; offset: number } | undefined => {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-rte-start][data-rte-end]"));
  const element = elements.find((candidate) => {
    const start = Number(candidate.dataset.rteStart ?? 0);
    const end = Number(candidate.dataset.rteEnd ?? start);
    return offset >= start && offset < end;
  }) ?? elements.find((candidate) => Number(candidate.dataset.rteStart ?? 0) === offset) ?? elements.at(-1);
  if (!element) return undefined;

  const start = Number(element.dataset.rteStart ?? 0);
  const textNode = Array.from(element.childNodes).find((node): node is Text => node.nodeType === Node.TEXT_NODE);
  if (!textNode) return undefined;

  return { node: textNode, offset: Math.max(0, Math.min(offset - start, textNode.textContent?.length ?? 0)) };
};

export const restoreRichTextDomSelection = (element: Element, selection: RichTextSelection): void => {
  const root = element.closest('[contenteditable="true"]') ?? element;
  const start = textNodeForOffset(root, selection.start);
  const end = textNodeForOffset(root, selection.end);
  if (!start || !end) return;

  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  const windowSelection = window.getSelection();
  windowSelection?.removeAllRanges();
  windowSelection?.addRange(range);
  if (root instanceof HTMLElement) root.focus();
};

export const positionRichTextSlashMenu = (element: HTMLElement, selection: RichTextSelection): void => {
  const container = element.offsetParent instanceof HTMLElement ? element.offsetParent : element.parentElement;
  const root = container?.querySelector('[contenteditable="true"]');
  if (!container || !root) return;

  const caret = textNodeForOffset(root, selection.end);
  if (!caret) return;

  const range = document.createRange();
  range.setStart(caret.node, caret.offset);
  range.setEnd(caret.node, caret.offset);
  const caretRect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const rootRect = root.getBoundingClientRect();
  const left = (caretRect.width || caretRect.height ? caretRect.left : rootRect.left) - containerRect.left;
  const top = (caretRect.width || caretRect.height ? caretRect.bottom : rootRect.top) - containerRect.top + 6;

  element.style.left = `${Math.max(0, left)}px`;
  element.style.top = `${Math.max(0, top)}px`;
};
