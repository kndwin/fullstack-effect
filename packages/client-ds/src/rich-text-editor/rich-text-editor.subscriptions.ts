import { Effect, Function, Option, Queue, Stream } from "effect";
import type { KeyboardModifiers } from "foldkit/html";
import { blockText } from "./rich-text-editor.document";
import { richTextSelectionMessageFromDom, selectRichTextEditorDomAll } from "./rich-text-editor.dom";
import { richTextEditorKeyDownMessage, richTextEditorKeyUpMessage } from "./rich-text-editor.keyboard";
import { richTextEditorSelectedMarkdown } from "./rich-text-editor.markdown";
import { richTextEditorPlainText } from "./rich-text-editor.model";
import { highlightRichTextCodeBlock, type RichTextCodeBlockHighlightRequest } from "./rich-text-editor.highlight";
import {
  DeletedRichTextEditorBackward,
  HighlightedRichTextCodeBlocks,
  PastedRichTextEditorMarkdown,
  SyncedRichTextEditorPlainText,
  type RichTextEditorMessage,
  type RichTextEditorModel,
  type RichTextSelection,
} from "./rich-text-editor.schema";

export type RichTextEditorSubscriptionOptions = Readonly<{
  id: string;
  model: RichTextEditorModel;
  isDisabled?: boolean;
}>;

const keyboardModifiersFromEvent = (event: KeyboardEvent): KeyboardModifiers => ({
  altKey: event.altKey,
  ctrlKey: event.ctrlKey,
  metaKey: event.metaKey,
  shiftKey: event.shiftKey,
});

const isRichTextEditorFocused = (id: string): boolean => {
  if (typeof document === "undefined") return false;
  const root = document.getElementById(id);
  const activeElement = document.activeElement;

  return !!root && !!activeElement && (root === activeElement || root.contains(activeElement));
};

const isIgnoredRichTextEditorEvent = (event: Event): boolean =>
  event.target instanceof Element && !!event.target.closest("[data-rte-ignore-events]");

const mountedHostId = (options: RichTextEditorSubscriptionOptions): string | undefined =>
  Option.getOrUndefined(options.model.maybeMountedHostId);

const handledKeyDownMessage = (
  event: KeyboardEvent,
  options: RichTextEditorSubscriptionOptions,
): RichTextEditorMessage | undefined => {
  if (isIgnoredRichTextEditorEvent(event)) return undefined;
  if (options.isDisabled || !isRichTextEditorFocused(options.id)) return undefined;

  const modifiers = keyboardModifiersFromEvent(event);
  const key = event.key;
  const plainText = richTextEditorPlainText(options.model);

  if ((modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "a") {
    selectRichTextEditorDomAll(options.id);
  }

  if (key === "Backspace" && !options.model.slashMenu.isOpen) {
    const selection =
      typeof window === "undefined" || typeof window.getSelection !== "function"
        ? options.model.selection
        : (() => {
            const message = richTextSelectionMessageFromDom(plainText.length);
            return { anchor: message.start, focus: message.end };
          })();
    return DeletedRichTextEditorBackward({
      start: selection.anchor,
      end: selection.focus,
      unit: modifiers.altKey ? "word" : "character",
    });
  }

  return richTextEditorKeyDownMessage(key, modifiers, options.model);
};

const handledKeyUpMessage = (
  event: KeyboardEvent,
  options: RichTextEditorSubscriptionOptions,
): RichTextEditorMessage | undefined => {
  if (isIgnoredRichTextEditorEvent(event)) return undefined;
  if (options.isDisabled || !isRichTextEditorFocused(options.id)) return undefined;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") return undefined;

  return richTextEditorKeyUpMessage(event.key, keyboardModifiersFromEvent(event), () =>
    richTextSelectionMessageFromDom(richTextEditorPlainText(options.model).length),
  );
};

const offerMessage = (
  queue: Queue.Enqueue<RichTextEditorMessage>,
  message: RichTextEditorMessage | undefined,
  event?: Event,
): void => {
  if (!message) return;
  event?.preventDefault();
  Queue.offerUnsafe(queue, message);
};

const currentDomSelection = (model: RichTextEditorModel): RichTextSelection => {
  if (typeof window === "undefined" || typeof window.getSelection !== "function") return model.selection;
  const message = richTextSelectionMessageFromDom(richTextEditorPlainText(model).length);
  return { anchor: message.start, focus: message.end };
};

const modelWithDomSelection = (model: RichTextEditorModel): RichTextEditorModel => ({
  ...model,
  selection: currentDomSelection(model),
});

const writeMarkdownClipboard = (event: ClipboardEvent, model: RichTextEditorModel): boolean => {
  const markdown = richTextEditorSelectedMarkdown(modelWithDomSelection(model));
  if (!markdown || !event.clipboardData) return false;
  event.clipboardData.setData("text/plain", markdown);
  return true;
};

const hostEventStream = (
  id: string,
  options: RichTextEditorSubscriptionOptions,
): Stream.Stream<RichTextEditorMessage> =>
  Stream.callback<RichTextEditorMessage>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const element = document.getElementById(id);
        if (!(element instanceof HTMLElement)) return Function.constVoid;

        const onKeyDown = (event: KeyboardEvent) => {
          offerMessage(queue, handledKeyDownMessage(event, options), event);
        };
        const onKeyUp = (event: KeyboardEvent) => {
          offerMessage(queue, handledKeyUpMessage(event, options), event);
        };
        const onInput = (event: Event) => {
          if (!options.isDisabled && !isIgnoredRichTextEditorEvent(event))
            Queue.offerUnsafe(queue, SyncedRichTextEditorPlainText({ value: element.innerText }));
        };
        const onPaste = (event: ClipboardEvent) => {
          const markdown = event.clipboardData?.getData("text/plain");
          if (options.isDisabled || !markdown || isIgnoredRichTextEditorEvent(event)) return;
          event.preventDefault();
          const selection = currentDomSelection(options.model);
          Queue.offerUnsafe(
            queue,
            PastedRichTextEditorMarkdown({ value: markdown, start: selection.anchor, end: selection.focus }),
          );
        };
        const onCopy = (event: ClipboardEvent) => {
          if (
            options.isDisabled ||
            isIgnoredRichTextEditorEvent(event) ||
            !writeMarkdownClipboard(event, options.model)
          )
            return;
          event.preventDefault();
        };
        const onCut = (event: ClipboardEvent) => {
          if (
            options.isDisabled ||
            isIgnoredRichTextEditorEvent(event) ||
            !writeMarkdownClipboard(event, options.model)
          )
            return;
          event.preventDefault();
          const selection = currentDomSelection(options.model);
          Queue.offerUnsafe(queue, DeletedRichTextEditorBackward({ start: selection.anchor, end: selection.focus }));
        };
        const onPointerUp = () => {
          if (!options.isDisabled) {
            Queue.offerUnsafe(queue, richTextSelectionMessageFromDom(richTextEditorPlainText(options.model).length));
          }
        };

        element.addEventListener("keydown", onKeyDown);
        element.addEventListener("keyup", onKeyUp);
        element.addEventListener("input", onInput);
        element.addEventListener("paste", onPaste);
        element.addEventListener("copy", onCopy);
        element.addEventListener("cut", onCut);
        element.addEventListener("pointerup", onPointerUp);

        return () => {
          element.removeEventListener("keydown", onKeyDown);
          element.removeEventListener("keyup", onKeyUp);
          element.removeEventListener("input", onInput);
          element.removeEventListener("paste", onPaste);
          element.removeEventListener("copy", onCopy);
          element.removeEventListener("cut", onCut);
          element.removeEventListener("pointerup", onPointerUp);
        };
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.flatMap(() => Effect.never)),
  );

const highlightRequestsForModel = (model: RichTextEditorModel): ReadonlyArray<RichTextCodeBlockHighlightRequest> =>
  model.document.children.flatMap((block, blockIndex) => {
    if (block.type !== "codeBlock" || !block.language) return [];
    const text = blockText(block);
    const existing = model.codeBlockHighlights.find(
      (highlight) =>
        highlight.blockIndex === blockIndex && highlight.language === block.language && highlight.text === text,
    );
    return existing ? [] : [{ blockIndex, text, language: block.language }];
  });

const codeHighlightStream = (model: RichTextEditorModel): Stream.Stream<RichTextEditorMessage> => {
  const requests = highlightRequestsForModel(model);
  if (requests.length === 0) return Stream.empty;
  return Stream.fromEffect(
    Effect.promise(async () =>
      HighlightedRichTextCodeBlocks({ highlights: await Promise.all(requests.map(highlightRichTextCodeBlock)) }),
    ),
  );
};

export const richTextEditorSubscriptions = (
  options: RichTextEditorSubscriptionOptions,
): Stream.Stream<RichTextEditorMessage> => {
  const highlightStream = codeHighlightStream(options.model);
  if (typeof document === "undefined") return highlightStream;
  const hostId = mountedHostId(options);
  if (!hostId) return highlightStream;

  return Stream.merge(highlightStream, hostEventStream(hostId, { ...options, id: hostId }));
};
