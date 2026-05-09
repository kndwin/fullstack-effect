import { Effect, Function, Option, Queue, Stream } from "effect";
import type { KeyboardModifiers } from "foldkit/html";
import { richTextSelectionMessageFromDom, selectRichTextEditorDomAll } from "./rich-text-editor.dom";
import { richTextEditorKeyDownMessage, richTextEditorKeyUpMessage } from "./rich-text-editor.keyboard";
import { richTextEditorSelectedMarkdown } from "./rich-text-editor.markdown";
import { richTextEditorPlainText } from "./rich-text-editor.model";
import {
  DeletedRichTextEditorBackward,
  PastedRichTextEditorMarkdown,
  SyncedRichTextEditorPlainText,
  type RichTextEditorMessage,
  type RichTextEditorModel,
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

const mountedHostId = (options: RichTextEditorSubscriptionOptions): string | undefined =>
  Option.getOrUndefined(options.model.maybeMountedHostId);

const handledKeyDownMessage = (
  event: KeyboardEvent,
  options: RichTextEditorSubscriptionOptions,
): RichTextEditorMessage | undefined => {
  if (options.isDisabled || !isRichTextEditorFocused(options.id)) return undefined;

  const modifiers = keyboardModifiersFromEvent(event);
  const key = event.key;
  const plainText = richTextEditorPlainText(options.model);

  if ((modifiers.metaKey || modifiers.ctrlKey) && key.toLowerCase() === "a") {
    selectRichTextEditorDomAll(options.id);
  }

  if (key === "Backspace" && !options.model.slashMenu.isOpen) {
    const selection = typeof window === "undefined" || typeof window.getSelection !== "function"
      ? options.model.selection
      : richTextSelectionMessageFromDom(plainText.length);
    return DeletedRichTextEditorBackward({ start: selection.start, end: selection.end });
  }

  return richTextEditorKeyDownMessage(key, modifiers, options.model);
};

const handledKeyUpMessage = (
  event: KeyboardEvent,
  options: RichTextEditorSubscriptionOptions,
): RichTextEditorMessage | undefined => {
  if (options.isDisabled || !isRichTextEditorFocused(options.id)) return undefined;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") return undefined;

  return richTextEditorKeyUpMessage(
    event.key,
    keyboardModifiersFromEvent(event),
    () => richTextSelectionMessageFromDom(richTextEditorPlainText(options.model).length),
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

const currentDomSelection = (model: RichTextEditorModel): typeof model.selection => {
  if (typeof window === "undefined" || typeof window.getSelection !== "function") return model.selection;
  return richTextSelectionMessageFromDom(richTextEditorPlainText(model).length);
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
        const onInput = () => {
          if (!options.isDisabled) Queue.offerUnsafe(queue, SyncedRichTextEditorPlainText({ value: element.innerText }));
        };
        const onPaste = (event: ClipboardEvent) => {
          const markdown = event.clipboardData?.getData("text/plain");
          if (options.isDisabled || !markdown) return;
          event.preventDefault();
          const selection = currentDomSelection(options.model);
          Queue.offerUnsafe(queue, PastedRichTextEditorMarkdown({ value: markdown, start: selection.start, end: selection.end }));
        };
        const onCopy = (event: ClipboardEvent) => {
          if (options.isDisabled || !writeMarkdownClipboard(event, options.model)) return;
          event.preventDefault();
        };
        const onCut = (event: ClipboardEvent) => {
          if (options.isDisabled || !writeMarkdownClipboard(event, options.model)) return;
          event.preventDefault();
          const selection = currentDomSelection(options.model);
          Queue.offerUnsafe(queue, DeletedRichTextEditorBackward({ start: selection.start, end: selection.end }));
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

export const richTextEditorSubscriptions = (
  options: RichTextEditorSubscriptionOptions,
): Stream.Stream<RichTextEditorMessage> => {
  if (typeof document === "undefined") return Stream.empty;
  const hostId = mountedHostId(options);
  if (!hostId) return Stream.empty;

  return hostEventStream(hostId, { ...options, id: hostId });
};
