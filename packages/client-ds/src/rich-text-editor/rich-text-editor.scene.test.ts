import { expect, test } from "bun:test";

Object.assign(globalThis, {
  window: {
    requestAnimationFrame: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
  },
});

const { Scene, Story } = await import("foldkit");
const {
  RichTextEditor,
  ChangedRichTextEditorSelection,
  DeletedRichTextEditorBackward,
  InsertedRichTextEditorText,
  ClosedRichTextEditorSlashMenu,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorAll,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ToggledRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  initRichTextEditor,
  richTextEditorPlainText,
  updateRichTextEditor,
} = await import("./rich-text-editor.view");
const { richTextEditorMarkdown, richTextEditorSelectedMarkdown } = await import("./rich-text-editor.markdown");
const { richTextEditorKeyDownMessage } = await import("./rich-text-editor.keyboard");
import type { RichTextEditorMessage, RichTextEditorModel } from "./rich-text-editor.view";

const view = (model: RichTextEditorModel) =>
  RichTextEditor<RichTextEditorMessage>({
    id: "scene-rich-text-editor",
    model,
    label: "Draft",
    toParentMessage: (message) => message,
  });

const update = (model: RichTextEditorModel, message: RichTextEditorMessage) => [
  updateRichTextEditor(model, message),
  [],
] as const;

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
    Scene.with(afterMessages(initRichTextEditor("Delete this draft"), [
      SelectedRichTextEditorAll(),
      DeletedRichTextEditorBackward({}),
    ])),
    Scene.expect(Scene.role("textbox", { name: "Draft" })).toExist(),
    Scene.expect(Scene.text("Selection: 0-0")).toExist(),
  );
});

test("slash h then enter applies heading", () => {
  Scene.scene(
    { update, view },
    Scene.with(afterMessages(initRichTextEditor("Draft"), [
      OpenedRichTextEditorSlashMenu(),
      UpdatedRichTextEditorSlashMenuQuery({ value: "h" }),
      SelectedRichTextEditorSlashCommand({ value: "heading-1" }),
    ])),

    Scene.expect(Scene.role("heading", { name: "Draft" })).toExist(),
  );
});

test("slash bold then typing inserts bold text", () => {
  Scene.scene(
    { update, view },
    Scene.with(afterMessages(initRichTextEditor(""), [
      OpenedRichTextEditorSlashMenu(),
      UpdatedRichTextEditorSlashMenuQuery({ value: "b" }),
      SelectedRichTextEditorSlashCommand({ value: "bold" }),
      InsertedRichTextEditorText({ value: "H" }),
      InsertedRichTextEditorText({ value: "i" }),
    ])),

    Scene.expect(Scene.text("Hi")).toExist(),
  );
});

test("slash italic then typing inserts italic text", () => {
  Scene.scene(
    { update, view },
    Scene.with(afterMessages(initRichTextEditor(""), [
      OpenedRichTextEditorSlashMenu(),
      UpdatedRichTextEditorSlashMenuQuery({ value: "i" }),
      SelectedRichTextEditorSlashCommand({ value: "italic" }),
      InsertedRichTextEditorText({ value: "H" }),
      InsertedRichTextEditorText({ value: "i" }),
    ])),

    Scene.expect(Scene.text("Hi")).toExist(),
  );
});

test("command b toggles bold marks", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Bold")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ToggledRichTextEditorMark({ type: "bold" })),
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
    Story.message(ToggledRichTextEditorMark({ type: "italic" })),
    Story.model((model) => {
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "italic" }]);
    }),
  );
});

test("command i toggles italic marks", () => {
  const message = richTextEditorKeyDownMessage("i", { altKey: false, ctrlKey: false, metaKey: true, shiftKey: false }, initRichTextEditor("Italic"));
  expect(message).toEqual(ToggledRichTextEditorMark({ type: "italic" }));
});

test("bold and italic marks can coexist", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Both")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ToggledRichTextEditorMark({ type: "bold" })),
    Story.message(ToggledRichTextEditorMark({ type: "italic" })),
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
      expect(model.selection).toEqual({ start: 0, end: 0 });
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
      expect(model.selection).toEqual({ start: 1, end: 1 });
    }),
  );
});

test("command all then typing renders a collapsed replacement selection", () => {
  Scene.scene(
    { update, view },
    Scene.with(afterMessages(initRichTextEditor("Hello"), [
      SelectedRichTextEditorAll(),
      InsertedRichTextEditorText({ value: "A" }),
    ])),
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
      expect(model.selection).toEqual({ start: 0, end: 0 });
    }),
  );
});

test("story: slash query remains visible while typing", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft/h");
      expect(model.slashMenu).toMatchObject({ isOpen: true, query: "h" });
      expect(model.selection).toEqual({ start: 7, end: 7 });
    }),
  );
});

test("story: closing slash menu removes transient slash text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Draft")),
    Story.message(OpenedRichTextEditorSlashMenu()),
    Story.message(UpdatedRichTextEditorSlashMenuQuery({ value: "h" })),
    Story.message(ClosedRichTextEditorSlashMenu()),
    Story.model((model) => {
      expect(richTextEditorPlainText(model)).toBe("Draft");
      expect(model.slashMenu.isOpen).toBe(false);
      expect(model.selection).toEqual({ start: 5, end: 5 });
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
      expect(model.selection).toEqual({ start: 5, end: 5 });
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
      expect(model.selection).toEqual({ start: 11, end: 11 });
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

test("story: markdown paste replaces the live selection", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Replace me")),
    Story.message(PastedRichTextEditorMarkdown({ value: "## New", start: 0, end: 10 })),
    Story.model((model) => {
      expect(model.document.children[0]).toMatchObject({ type: "heading", level: 2 });
      expect(richTextEditorPlainText(model)).toBe("New");
      expect(model.selection).toEqual({ start: 3, end: 3 });
    }),
  );
});

test("markdown serialization copies supported nodes", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "### Title\nCopy **bold** and *italic*" }),
  ]);

  expect(richTextEditorMarkdown(model)).toBe("### Title\nCopy **bold** and *italic*");
});

test("selected markdown serialization preserves block format and marks", () => {
  const model = afterMessages(initRichTextEditor(""), [
    PastedRichTextEditorMarkdown({ value: "# Title\nCopy **bold**" }),
  ]);

  expect(richTextEditorSelectedMarkdown({ ...model, selection: { start: 0, end: richTextEditorPlainText(model).length } })).toBe(
    "# Title\nCopy **bold**",
  );
});

test("story: model omits undefined optional fields", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Plain")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ToggledRichTextEditorMark({ type: "bold" })),
    Story.message(ToggledRichTextEditorMark({ type: "bold" })),
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
      expect(model.selection).toEqual({ start: 5, end: 5 });
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
    Scene.with(afterMessages(initRichTextEditor("Bold wordx"), [
      SelectedRichTextEditorAll(),
      ToggledRichTextEditorMark({ type: "bold" }),
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
    ])),

    Scene.expect(Scene.text("Next")).toExist(),
  );
});

test("story: typing enter and delete preserve document text", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Bold wordx")),
    Story.message(ChangedRichTextEditorSelection({ start: 9, end: 9 })),
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
