import { Effect, Equivalence, Function, Option, Queue, Stream } from "effect";
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

export type RichTextEditorSubscriptionDependencies = Readonly<{
  hostId: string | undefined;
  isDisabled: boolean;
  model: RichTextEditorModel;
  codeBlockStructure: string;
}>;

export type RichTextEditorSubscriptionConfig = Readonly<{
  modelToDependencies: (options: RichTextEditorSubscriptionOptions) => RichTextEditorSubscriptionDependencies;
  dependenciesToStream: (
    dependencies: RichTextEditorSubscriptionDependencies,
    readDependencies: () => RichTextEditorSubscriptionDependencies,
  ) => Stream.Stream<RichTextEditorMessage>;
  equivalence: Equivalence.Equivalence<RichTextEditorSubscriptionDependencies>;
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
  readOptions: () => RichTextEditorSubscriptionOptions,
): Stream.Stream<RichTextEditorMessage> =>
  Stream.callback<RichTextEditorMessage>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const element = document.getElementById(id);
        if (!(element instanceof HTMLElement)) return Function.constVoid;

        const onKeyDown = (event: KeyboardEvent) => {
          const options = readOptions();
          offerMessage(queue, handledKeyDownMessage(event, options), event);
        };
        const onKeyUp = (event: KeyboardEvent) => {
          const options = readOptions();
          offerMessage(queue, handledKeyUpMessage(event, options), event);
        };
        const onInput = (event: Event) => {
          const options = readOptions();
          if (!options.isDisabled && !isIgnoredRichTextEditorEvent(event))
            Queue.offerUnsafe(queue, SyncedRichTextEditorPlainText({ value: element.innerText }));
        };
        const onPaste = (event: ClipboardEvent) => {
          const options = readOptions();
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
          const options = readOptions();
          if (
            options.isDisabled ||
            isIgnoredRichTextEditorEvent(event) ||
            !writeMarkdownClipboard(event, options.model)
          )
            return;
          event.preventDefault();
        };
        const onCut = (event: ClipboardEvent) => {
          const options = readOptions();
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
          const options = readOptions();
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

const highlightRequestFingerprint = (requests: ReadonlyArray<RichTextCodeBlockHighlightRequest>): string =>
  JSON.stringify(requests.map((request) => [request.blockIndex, request.language, request.text]));

const codeBlockStructure = (model: RichTextEditorModel): string =>
  JSON.stringify(
    model.document.children.flatMap((block, blockIndex) =>
      block.type === "codeBlock" && block.language ? [[blockIndex, block.language]] : [],
    ),
  );

const codeHighlightStream = (
  dependencies: RichTextEditorSubscriptionDependencies,
  readDependencies: () => RichTextEditorSubscriptionDependencies,
): Stream.Stream<RichTextEditorMessage> => {
  if (dependencies.isDisabled || dependencies.codeBlockStructure === "[]") {
    return Stream.empty;
  }

  return Stream.callback<RichTextEditorMessage>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        let lastSeenFingerprint = "";
        let lastHighlightedFingerprint = "";
        let isCancelled = false;

        const interval = globalThis.setInterval(() => {
          const requests = highlightRequestsForModel(readDependencies().model);
          const fingerprint = highlightRequestFingerprint(requests);
          if (requests.length === 0) {
            lastSeenFingerprint = "";
            lastHighlightedFingerprint = "";
            return;
          }
          if (fingerprint !== lastSeenFingerprint) {
            lastSeenFingerprint = fingerprint;
            return;
          }
          if (fingerprint === lastHighlightedFingerprint) return;
          lastHighlightedFingerprint = fingerprint;

          void Promise.all(requests.map(highlightRichTextCodeBlock)).then((highlights) => {
            if (isCancelled) return;
            Queue.offerUnsafe(queue, HighlightedRichTextCodeBlocks({ highlights }));
          });
        }, 180);

        return () => {
          isCancelled = true;
          globalThis.clearInterval(interval);
        };
      }),
      (cleanup) => Effect.sync(cleanup),
    ).pipe(Effect.flatMap(() => Effect.never)),
  );
};

export const richTextEditorSubscriptionConfig = (): RichTextEditorSubscriptionConfig => ({
  modelToDependencies: (options) => ({
    hostId: mountedHostId(options),
    isDisabled: Boolean(options.isDisabled),
    model: options.model,
    codeBlockStructure: codeBlockStructure(options.model),
  }),
  equivalence: Equivalence.make(
    (a, b) =>
      a.hostId === b.hostId && a.isDisabled === b.isDisabled && a.codeBlockStructure === b.codeBlockStructure,
  ),
  dependenciesToStream: (dependencies, readDependencies) => {
    const highlightStream = codeHighlightStream(dependencies, readDependencies);
    if (typeof document === "undefined") return highlightStream;
    if (!dependencies.hostId) return highlightStream;

    return Stream.merge(
      highlightStream,
      hostEventStream(dependencies.hostId, () => {
        const latest = readDependencies();
        return { id: latest.hostId ?? dependencies.hostId!, model: latest.model, isDisabled: latest.isDisabled };
      }),
    );
  },
});

export const richTextEditorSubscriptions = (
  options: RichTextEditorSubscriptionOptions,
): Stream.Stream<RichTextEditorMessage> => {
  const config = richTextEditorSubscriptionConfig();
  const dependencies = config.modelToDependencies(options);
  const highlightStream = codeHighlightStream(dependencies, () => dependencies);
  if (typeof document === "undefined") return highlightStream;
  const hostId = mountedHostId(options);
  if (!hostId) return highlightStream;

  return Stream.merge(highlightStream, hostEventStream(hostId, () => ({ ...options, id: hostId })));
};
