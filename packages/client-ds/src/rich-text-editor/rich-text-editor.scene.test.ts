import { expect, test } from "bun:test";

Object.assign(globalThis, {
  window: {
    requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
  },
});

const { Scene, Story } = await import("foldkit");
const { Effect, Stream } = await import("effect");
const {
  RichTextEditor,
  UpdatedRichTextEditorSelection,
  DeletedRichTextEditorBackward,
  ExitedRichTextEditorCodeBlock,
  InsertedRichTextEditorText,
  ClosedRichTextEditorSlashMenu,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorAll,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ClickedRichTextEditorMark,
  ChangedRichTextCodeBlockLanguage,
  HighlightedRichTextCodeBlocks,
  UpdatedRichTextEditorSlashMenuQuery,
  initRichTextEditor,
  richTextEditorPlainText,
  richTextEditorSubscriptions,
  updateRichTextEditor,
  updateRichTextEditorWithCommands,
} = await import("./rich-text-editor.view");
const { richTextEditorMarkdown, richTextEditorSelectedMarkdown } = await import("./rich-text-editor.markdown");
const { richTextEditorKeyDownMessage } = await import("./rich-text-editor.keyboard");
import type { RichTextEditorMessage, RichTextEditorModel } from "./rich-text-editor.view";

const view = (model: RichTextEditorModel) =>
  RichTextEditor<RichTextEditorMessage>({
    id: "scene-rich-text-editor",
    model,
    label: "Draft",
    isDebugSelectionVisible: true,
    toParentMessage: (message) => message,
  });

const update = (model: RichTextEditorModel, message: RichTextEditorMessage) =>
  [updateRichTextEditor(model, message), []] as const;

const afterMessages = (
  model: RichTextEditorModel,
  messages: ReadonlyArray<RichTextEditorMessage>,
): RichTextEditorModel => messages.reduce(updateRichTextEditor, model);

const containsUndefined = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(containsUndefined);
  if (typeof value === "object" && value !== null) return Object.values(value).some(containsUndefined);
  return false;
};

test("command all then backspace clears the editor", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("Delete this draft"), [
        SelectedRichTextEditorAll(),
        DeletedRichTextEditorBackward({}),
      ]),
    ),
    Scene.expect(Scene.role("textbox", { name: "Draft" })).toExist(),
    Scene.expect(Scene.text("Selection: 0-0")).toExist(),
  );
});

test("slash h then enter applies heading", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("Draft"), [
        OpenedRichTextEditorSlashMenu(),
        UpdatedRichTextEditorSlashMenuQuery({ value: "h" }),
        SelectedRichTextEditorSlashCommand({ value: "heading-1" }),
      ]),
    ),

    Scene.expect(Scene.role("heading", { name: "Draft" })).toExist(),
  );
});

test("slash blockquote applies quote formatting", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Quoted")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "quote" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "blockquote" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "blockquote" });
      expect(richTextEditorPlainText(model)).toBe("Quoted");
    }),
  );
});

test("slash code applies code block formatting", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("const value = 1")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "code" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "code-block" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock" });
      expect(richTextEditorPlainText(model)).toBe("const value = 1");
    }),
  );
});

test("slash code language commands apply code block language", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("console.log('typed')")),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock", language: "typescript" });
      expect(richTextEditorMarkdown(model)).toBe("```typescript\nconsole.log('typed')\n```");
    }),
  );
});

test("code block language selector updates the block language", () => {
  Story.story(
    update,
    Story.with(
      afterMessages(initRichTextEditor("print('hello')"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block" }),
      ]),
    ),
    Story.message(ChangedRichTextCodeBlockLanguage({ blockIndex: 0, language: "python" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock", language: "python" });
      expect(richTextEditorMarkdown(model)).toBe("```python\nprint('hello')\n```");
    }),
  );
});

test("code block language selector can clear the block language", () => {
  Story.story(
    update,
    Story.with(
      afterMessages(initRichTextEditor("const value = 1"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
      ]),
    ),
    Story.message(ChangedRichTextCodeBlockLanguage({ blockIndex: 0 })),
    Story.model((model) => {
      expect(model.document.children[0]).toEqual({
        type: "codeBlock",
        children: [{ type: "text", text: "const value = 1" }],
      });
      expect(richTextEditorMarkdown(model)).toBe("```\nconst value = 1\n```");
    }),
  );
});

test("code block slash inserts text instead of opening slash menu", () => {
  const model = afterMessages(initRichTextEditor("const value = 1"), [
    SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
  ]);

  expect(
    richTextEditorKeyDownMessage("/", { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }, model),
  ).toEqual(InsertedRichTextEditorText({ value: "/" }));
});

test("code block enter inserts a newline inside the code block", () => {
  const model = afterMessages(initRichTextEditor("const value = 1"), [
    SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
  ]);

  expect(
    richTextEditorKeyDownMessage("Enter", { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false }, model),
  ).toEqual(InsertedRichTextEditorText({ value: "\n" }));
  expect(
    richTextEditorKeyDownMessage("Enter", { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true }, model),
  ).toEqual(InsertedRichTextEditorText({ value: "\n" }));

  const nextModel = updateRichTextEditor(model, InsertedRichTextEditorText({ value: "\n" }));
  expect(nextModel.document.children).toHaveLength(1);
  expect(nextModel.document.children[0]).toMatchObject({ type: "codeBlock" });
  expect(richTextEditorPlainText(nextModel)).toBe("const value = 1\n");
});

test("code block trailing newline renders a caret placeholder on the next line", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("con"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block" }),
        InsertedRichTextEditorText({ value: "\n" }),
      ]),
    ),
    Scene.expect(Scene.selector('pre code [data-rte-placeholder="true"][data-rte-start="4"]')).toExist(),
  );
});

test("command enter exits a code block", () => {
  const model = afterMessages(initRichTextEditor("const value = 1"), [
    SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
  ]);

  expect(
    richTextEditorKeyDownMessage("Enter", { altKey: false, ctrlKey: false, metaKey: true, shiftKey: false }, model),
  ).toEqual(ExitedRichTextEditorCodeBlock());

  const nextModel = updateRichTextEditor(model, ExitedRichTextEditorCodeBlock());
  expect(nextModel.document.children).toHaveLength(2);
  expect(nextModel.document.children[0]).toMatchObject({ type: "codeBlock" });
  expect(nextModel.document.children[1]).toMatchObject({ type: "paragraph" });
  expect(nextModel.selection).toEqual({ anchor: 16, focus: 16 });
});

test("code block renders a language selector", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("echo hello"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block-bash" }),
      ]),
    ),
    Scene.expect(Scene.role("combobox")).toExist(),
  );
});

test("empty code block renders its caret placeholder inside code", () => {
  Scene.scene(
    { update, view },
    Scene.with(afterMessages(initRichTextEditor(""), [SelectedRichTextEditorSlashCommand({ value: "code-block" })])),
    Scene.expect(Scene.selector('pre code [data-rte-placeholder="true"][data-rte-start="0"]')).toExist(),
  );
});

test("code block language subscription highlights supported code with shiki tokens", async () => {
  const [model, commands] = updateRichTextEditorWithCommands(
    initRichTextEditor("const value = 1"),
    SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
  );
  expect(model.document.children[0]).toMatchObject({ type: "codeBlock", language: "typescript" });
  expect(commands).toHaveLength(0);

  const messages = await Effect.runPromise(
    richTextEditorSubscriptions({ id: "scene-rich-text-editor", model }).pipe(Stream.take(1), Stream.runCollect),
  );
  const message = messages[0]!;
  const highlightedModel = updateRichTextEditor(model, message);
  expect(highlightedModel.codeBlockHighlights[0]).toMatchObject({
    blockIndex: 0,
    text: "const value = 1",
    language: "typescript",
  });
  expect(highlightedModel.codeBlockHighlights[0]?.lines.flat()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ content: "const", lightColor: expect.any(String), darkColor: expect.any(String) }),
    ]),
  );
});

test("highlighted code tokens keep rich text selection offsets", () => {
  const model = updateRichTextEditor(
    {
      ...afterMessages(initRichTextEditor("const value = 1"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
      ]),
      selection: { anchor: 6, focus: 11 },
    },
    HighlightedRichTextCodeBlocks({
      highlights: [
        {
          blockIndex: 0,
          text: "const value = 1",
          language: "typescript",
          lines: [
            [
              { content: "const", lightColor: "#ff0000", darkColor: "#880000" },
              { content: " " },
              { content: "value", lightColor: "#00ff00", darkColor: "#008800" },
              { content: " = 1" },
            ],
          ],
        },
      ],
    }),
  );

  Scene.scene(
    { update, view },
    Scene.with(model),
    Scene.expect(Scene.selector('code [data-rte-start="0"]')).toExist(),
    Scene.expect(Scene.selector('code [data-rte-start="5"]')).toExist(),
    Scene.expect(Scene.selector('code [data-rte-start="6"]')).toExist(),
    Scene.expect(Scene.selector('code [data-rte-start="11"]')).toExist(),
  );
});

test("highlighted code block trailing newline renders a caret placeholder on the next line", () => {
  const model = updateRichTextEditor(
    afterMessages(initRichTextEditor("const value = 1"), [
      SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
      InsertedRichTextEditorText({ value: "\n" }),
    ]),
    HighlightedRichTextCodeBlocks({
      highlights: [
        {
          blockIndex: 0,
          text: "const value = 1\n",
          language: "typescript",
          lines: [[{ content: "const", lightColor: "#ff0000", darkColor: "#880000" }, { content: " value = 1" }], []],
        },
      ],
    }),
  );

  Scene.scene(
    { update, view },
    Scene.with(model),
    Scene.expect(Scene.selector('pre code [data-rte-placeholder="true"][data-rte-start="16"]')).toExist(),
  );
});

test("code block language selector overlays code without reserving a top line", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("const value = 1"), [
        SelectedRichTextEditorSlashCommand({ value: "code-block-typescript" }),
      ]),
    ),
    Scene.expect(Scene.selector("pre.pr-48")).toExist(),
    Scene.expect(Scene.selector("[data-rte-ignore-events].absolute")).toExist(),
  );
});

test("typing markdown fences formats an empty code block", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: "`" })),
    Story.message(InsertedRichTextEditorText({ value: "`" })),
    Story.message(InsertedRichTextEditorText({ value: "`" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock" });
      expect(richTextEditorPlainText(model)).toBe("");
    }),
  );

  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: "~" })),
    Story.message(InsertedRichTextEditorText({ value: "~" })),
    Story.message(InsertedRichTextEditorText({ value: "~" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock" });
      expect(richTextEditorPlainText(model)).toBe("");
    }),
  );
});

test("typing blockquote marker and space formats an empty block", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: ">" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "paragraph" });
      expect(richTextEditorPlainText(model)).toBe(">");
    }),
    Story.message(InsertedRichTextEditorText({ value: " " })),
    Story.message(InsertedRichTextEditorText({ value: "Q" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "blockquote" });
      expect(richTextEditorPlainText(model)).toBe("Q");
    }),
  );
});

test("typing heading markers and space formats empty blocks", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: " " })),
    Story.message(InsertedRichTextEditorText({ value: "H" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 1 });
      expect(richTextEditorPlainText(model)).toBe("H");
    }),
  );

  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: " " })),
    Story.message(InsertedRichTextEditorText({ value: "H" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 2 });
      expect(richTextEditorPlainText(model)).toBe("H");
    }),
  );

  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: "#" })),
    Story.message(InsertedRichTextEditorText({ value: " " })),
    Story.message(InsertedRichTextEditorText({ value: "H" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 3 });
      expect(richTextEditorPlainText(model)).toBe("H");
    }),
  );
});

test("backspace on an empty formatted block resets to paragraph", () => {
  Story.story(
    update,
    Story.with(
      afterMessages(initRichTextEditor(""), [
        InsertedRichTextEditorText({ value: ">" }),
        InsertedRichTextEditorText({ value: " " }),
      ]),
    ),
    Story.message(DeletedRichTextEditorBackward({})),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "paragraph" });
      expect(richTextEditorPlainText(model)).toBe("");
    }),
  );
});

test("select all and backspace resets blockquote to empty paragraph", () => {
  Story.story(
    update,
    Story.with(
      afterMessages(initRichTextEditor(""), [
        InsertedRichTextEditorText({ value: ">" }),
        InsertedRichTextEditorText({ value: " " }),
        InsertedRichTextEditorText({ value: "a" }),
        InsertedRichTextEditorText({ value: "b" }),
        InsertedRichTextEditorText({ value: "c" }),
      ]),
    ),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(DeletedRichTextEditorBackward({})),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "paragraph" });
      expect(richTextEditorPlainText(model)).toBe("");
      expect(model.selection).toEqual({ anchor: 0, focus: 0 });
    }),
  );
});

test("slash bold then typing inserts bold text", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor(""), [
        OpenedRichTextEditorSlashMenu(),
        UpdatedRichTextEditorSlashMenuQuery({ value: "b" }),
        SelectedRichTextEditorSlashCommand({ value: "bold" }),
        InsertedRichTextEditorText({ value: "H" }),
        InsertedRichTextEditorText({ value: "i" }),
      ]),
    ),

    Scene.expect(Scene.text("Hi")).toExist(),
  );
});

test("slash italic then typing inserts italic text", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor(""), [
        OpenedRichTextEditorSlashMenu(),
        UpdatedRichTextEditorSlashMenuQuery({ value: "i" }),
        SelectedRichTextEditorSlashCommand({ value: "italic" }),
        InsertedRichTextEditorText({ value: "H" }),
        InsertedRichTextEditorText({ value: "i" }),
      ]),
    ),

    Scene.expect(Scene.text("Hi")).toExist(),
  );
});

test("command b toggles bold marks", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Bold")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ClickedRichTextEditorMark({ type: "bold" })),
    Story.model((model) => {
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "bold" }]);
    }),
  );
});

test("command italic toggles italic marks", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Italic")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ClickedRichTextEditorMark({ type: "italic" })),
    Story.model((model) => {
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "italic" }]);
    }),
  );
});

test("command i toggles italic marks", () => {
  const message = richTextEditorKeyDownMessage(
    "i",
    { altKey: false, ctrlKey: false, metaKey: true, shiftKey: false },
    initRichTextEditor("Italic"),
  );
  expect(message).toEqual(ClickedRichTextEditorMark({ type: "italic" }));
});

test("shift arrow keys move focus while preserving anchor", () => {
  const model = initRichTextEditor("Text");
  expect(
    richTextEditorKeyDownMessage(
      "ArrowRight",
      { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true },
      model,
    ),
  ).toEqual(UpdatedRichTextEditorSelection({ start: 4, end: 4 }));

  expect(
    richTextEditorKeyDownMessage(
      "ArrowRight",
      { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true },
      { ...model, selection: { anchor: 0, focus: 0 } },
    ),
  ).toEqual(UpdatedRichTextEditorSelection({ start: 0, end: 1 }));

  expect(
    richTextEditorKeyDownMessage("ArrowLeft", { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true }, model),
  ).toEqual(UpdatedRichTextEditorSelection({ start: 4, end: 3 }));

  expect(
    richTextEditorKeyDownMessage(
      "ArrowRight",
      { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true },
      { ...model, selection: { anchor: 4, focus: 1 } },
    ),
  ).toEqual(UpdatedRichTextEditorSelection({ start: 4, end: 2 }));
});

test("story: shift right shrinks a backward selection", () => {
  const selectedBackward = afterMessages(initRichTextEditor("Text"), [
    UpdatedRichTextEditorSelection({ start: 4, end: 3 }),
    UpdatedRichTextEditorSelection({ start: 4, end: 2 }),
    UpdatedRichTextEditorSelection({ start: 4, end: 1 }),
  ]);

  expect(selectedBackward.selection).toEqual({ anchor: 4, focus: 1 });
  const message = richTextEditorKeyDownMessage(
    "ArrowRight",
    { altKey: false, ctrlKey: false, metaKey: false, shiftKey: true },
    selectedBackward,
  );
  expect(message).toEqual(UpdatedRichTextEditorSelection({ start: 4, end: 2 }));
  if (!message) throw new Error("Expected shift ArrowRight to produce a selection message.");
  expect(updateRichTextEditor(selectedBackward, message)).toMatchObject({ selection: { anchor: 4, focus: 2 } });
});

test("bold and italic marks can coexist", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Both")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ClickedRichTextEditorMark({ type: "bold" })),
    Story.message(ClickedRichTextEditorMark({ type: "italic" })),
    Story.model((model) => {
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "bold" }, { type: "italic" }]);
    }),
  );
});

test("story: command all then backspace clears the model", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Delete this draft")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(DeletedRichTextEditorBackward({})),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("");
      expect(model.selection).toEqual({ anchor: 0, focus: 0 });
    }),
  );
});

test("story: command all then typing replaces the selection", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Hello")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(InsertedRichTextEditorText({ value: "A" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("A");
      expect(model.selection).toEqual({ anchor: 1, focus: 1 });
    }),
  );
});

test("command all then typing renders a collapsed replacement selection", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("Hello"), [
        SelectedRichTextEditorAll(),
        InsertedRichTextEditorText({ value: "A" }),
      ]),
    ),
    Scene.expect(Scene.role("textbox", { name: "Draft" })).toExist(),
    Scene.expect(Scene.text("A")).toExist(),
    Scene.expect(Scene.text("Selection: 1-1")).toExist(),
  );
});

test("story: backspace uses live DOM selection over stale model selection", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Delete this draft")),
    Story.message(DeletedRichTextEditorBackward({ start: 0, end: 17 })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("");
      expect(model.selection).toEqual({ anchor: 0, focus: 0 });
    }),
  );
});

test("story: slash query stays in menu state while typing", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.slashMenu).toMatchObject({ isOpen: true, query: "h" });
      expect(model.selection).toEqual({ anchor: 5, focus: 5 });
    }),
  );
});

test("story: closing slash menu clears query without changing text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.message(ClosedRichTextEditorSlashMenu()),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.slashMenu.isOpen).toBe(false);
      expect(model.selection).toEqual({ anchor: 5, focus: 5 });
    }),
  );
});

test("story: closing slash menu is idempotent", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(ClosedRichTextEditorSlashMenu()),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.selection).toEqual({ anchor: 5, focus: 5 });
    }),
  );
});

test("story: input sync keeps model aligned after native edits", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(SyncedRichTextEditorPlainText({ value: "Pasted text" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Pasted text");
      expect(model.selection).toEqual({ anchor: 11, focus: 11 });
    }),
  );
});

test("story: markdown paste creates supported rich text nodes", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(PastedRichTextEditorMarkdown({ value: "# Title\nBody with **bold** and *italic*" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 1 });
      expect(model.document.children[1]).toMatchObject({ type: "paragraph" });
      expect(model.document.children[1]?.children).toEqual([
        { type: "text", text: "Body with " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        { type: "text", text: "italic", marks: [{ type: "italic" }] },
      ]);
      expect(richTextEditorPlainText(model)).toBe("Title\nBody with bold and italic");
    }),
  );
});

test("story: markdown paste creates blockquote nodes", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(PastedRichTextEditorMarkdown({ value: "> Quoted **bold**" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "blockquote" });
      expect(model.document.children[0]?.children).toEqual([
        { type: "text", text: "Quoted " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
      ]);
    }),
  );
});

test("story: markdown paste creates code block nodes", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(PastedRichTextEditorMarkdown({ value: "```ts\nconst value = 1\n```" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock", language: "typescript" });
      expect(model.document.children[0]?.children).toEqual([{ type: "text", text: "const value = 1" }]);
      expect(richTextEditorPlainText(model)).toBe("const value = 1");
    }),
  );
});

test("story: markdown paste accepts tilde code fences and supported language aliases", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(PastedRichTextEditorMarkdown({ value: "~~~py\nprint('hello')\n~~~" })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "codeBlock", language: "python" });
      expect(richTextEditorMarkdown(model)).toBe("```python\nprint('hello')\n```");
    }),
  );
});

test("story: markdown paste replaces the live selection", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Replace me")),
    Story.message(PastedRichTextEditorMarkdown({ value: "## New", start: 0, end: 10 })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 2 });
      expect(richTextEditorPlainText(model)).toBe("New");
      expect(model.selection).toEqual({ anchor: 3, focus: 3 });
    }),
  );
});

test("markdown serialization copies supported nodes", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "### Title\nCopy **bold** and *italic*" }),
  ]);

  expect(richTextEditorMarkdown(model)).toBe("### Title\nCopy **bold** and *italic*");
});

test("markdown serialization copies blockquote nodes", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "> Copy **bold** quote" }),
  ]);

  expect(richTextEditorMarkdown(model)).toBe("> Copy **bold** quote");
});

test("markdown serialization copies code block nodes", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "```ts\nconst value = 1\n```" }),
  ]);

  expect(richTextEditorMarkdown(model)).toBe("```typescript\nconst value = 1\n```");
});

test("sample markdown round-trips supported formatting", () => {
  const markdown = [
    "# Product Notes",
    "",
    "This paragraph has **bold text**, *italic text*, and ***bold italic text***.",
    "",
    "## Next Steps",
    "",
    "Copy this into the editor to test Markdown paste.",
    "",
    "### Details",
    "",
    "Unsupported Markdown like lists or links will paste as plain paragraph text for now.",
  ].join("\n");
  const model = afterMessages(initRichTextEditor(""), [PastedRichTextEditorMarkdown({ value: markdown })]);

  expect(model.document.children[0]).toMatchObject({ type: "heading", level: 1 });
  expect(model.document.children[4]).toMatchObject({ type: "heading", level: 2 });
  expect(model.document.children[8]).toMatchObject({ type: "heading", level: 3 });
  expect(model.document.children[2]?.children).toEqual([
    { type: "text", text: "This paragraph has " },
    { type: "text", text: "bold text", marks: [{ type: "bold" }] },
    { type: "text", text: ", " },
    { type: "text", text: "italic text", marks: [{ type: "italic" }] },
    { type: "text", text: ", and " },
    { type: "text", text: "bold italic text", marks: [{ type: "bold" }, { type: "italic" }] },
    { type: "text", text: "." },
  ]);
  expect(richTextEditorMarkdown(model)).toBe(markdown);
});

test("selected markdown serialization preserves block format and marks", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "# Title\nCopy **bold**" }),
  ]);

  expect(
    richTextEditorSelectedMarkdown({
      ...model,
      selection: { anchor: 0, focus: richTextEditorPlainText(model).length },
    }),
  ).toBe("# Title\nCopy **bold**");
});

test("story: model omits undefined optional fields", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Plain")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ClickedRichTextEditorMark({ type: "bold" })),
    Story.message(ClickedRichTextEditorMark({ type: "bold" })),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "b" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "bold" })),
    Story.message(InsertedRichTextEditorText({ value: "!" })),
    Story.model((model) => {
      expect(containsUndefined(model)).toBe(false);
    }),
  );
});

test("story: selecting slash command removes query before applying command", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "heading-2" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 2 });
      expect(model.selection).toEqual({ anchor: 5, focus: 5 });
    }),
  );
});

test("story: slash h defaults to heading before description matches", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "heading-1" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 1 });
    }),
  );
});

test("story: slash bold stores marks for inserted text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "b" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "bold" })),
    Story.message(InsertedRichTextEditorText({ value: "H" })),
    Story.message(InsertedRichTextEditorText({ value: "i" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Hi");
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "bold" }]);
    }),
  );
});

test("story: slash italic stores marks for inserted text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "i" })),
    Story.message(SelectedRichTextEditorSlashCommand({ value: "italic" })),
    Story.message(InsertedRichTextEditorText({ value: "H" })),
    Story.message(InsertedRichTextEditorText({ value: "i" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Hi");
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "italic" }]);
    }),
  );
});

test("bold formatting survives typing enter and delete", () => {
  Scene.scene(
    { update, view },
    Scene.with(
      afterMessages(initRichTextEditor("Bold wordx"), [
        SelectedRichTextEditorAll(),
        ClickedRichTextEditorMark({ type: "bold" }),
        DeletedRichTextEditorBackward({}),
        InsertedRichTextEditorText({ value: "B" }),
        InsertedRichTextEditorText({ value: "o" }),
        InsertedRichTextEditorText({ value: "l" }),
        InsertedRichTextEditorText({ value: "d" }),
        InsertedRichTextEditorText({ value: " " }),
        InsertedRichTextEditorText({ value: "w" }),
        InsertedRichTextEditorText({ value: "o" }),
        InsertedRichTextEditorText({ value: "r" }),
        InsertedRichTextEditorText({ value: "d" }),
        SplitRichTextEditorBlock(),
        InsertedRichTextEditorText({ value: "N" }),
        InsertedRichTextEditorText({ value: "e" }),
        InsertedRichTextEditorText({ value: "x" }),
        InsertedRichTextEditorText({ value: "t" }),
      ]),
    ),

    Scene.expect(Scene.text("Next")).toExist(),
  );
});

test("story: typing enter and delete preserve document text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Bold wordx")),
    Story.message(UpdatedRichTextEditorSelection({ start: 9, end: 9 })),
    Story.message(DeletedRichTextEditorBackward({})),
    Story.message(SplitRichTextEditorBlock()),
    Story.message(InsertedRichTextEditorText({ value: "N" })),
    Story.message(InsertedRichTextEditorText({ value: "e" })),
    Story.message(InsertedRichTextEditorText({ value: "x" })),
    Story.message(InsertedRichTextEditorText({ value: "t" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Bold wor\nNextx");
    }),
  );
});

test("option backspace deletes the previous word", () => {
  const message = richTextEditorKeyDownMessage(
    "Backspace",
    { altKey: true, ctrlKey: false, metaKey: false, shiftKey: false },
    initRichTextEditor("Delete word"),
  );
  expect(message).toEqual(DeletedRichTextEditorBackward({ unit: "word" }));

  Story.story(
    update,
    Story.with(initRichTextEditor("Delete word")),
    Story.message(DeletedRichTextEditorBackward({ unit: "word" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Delete ");
      expect(model.selection).toEqual({ anchor: 7, focus: 7 });
    }),
  );
});

test("option backspace deletes trailing whitespace and previous word", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Delete word   ")),
    Story.message(DeletedRichTextEditorBackward({ unit: "word" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Delete ");
      expect(model.selection).toEqual({ anchor: 7, focus: 7 });
    }),
  );
});
