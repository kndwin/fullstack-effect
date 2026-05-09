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
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorAll,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ToggledRichTextEditorBold,
  UpdatedRichTextEditorSlashMenuQuery,
  initRichTextEditor,
  richTextEditorPlainText,
  updateRichTextEditor,
} = await import("./rich-text-editor.view");
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

const editor = Scene.selector("#scene-rich-text-editor");

const containsUndefined = (value: unknown): boolean => {
  if (value === undefined) return true;
  if (Array.isArray(value)) return value.some(containsUndefined);
  if (typeof value === "object" && value !== null) return Object.values(value).some(containsUndefined);
  return false;
};

test("command all then backspace clears the editor", () => {
  Scene.scene(
    { update, view },
    Scene.with(initRichTextEditor("Delete this draft")),

    Scene.keydown(editor, "a", { metaKey: true }),
    Scene.expect(Scene.text("Selection: 0-17")).toExist(),

    Scene.keydown(editor, "Backspace", { metaKey: true }),
    Scene.expect(Scene.role("textbox", { name: "Draft" })).toExist(),
    Scene.expect(Scene.text("Selection: 0-0")).toExist(),
  );
});

test("slash h then enter applies heading", () => {
  Scene.scene(
    { update, view },
    Scene.with(initRichTextEditor("Draft")),

    Scene.keydown(editor, "/"),
    Scene.keydown(editor, "h"),
    Scene.keydown(editor, "Enter"),

    Scene.expect(Scene.role("heading", { name: "Draft" })).toExist(),
  );
});

test("slash bold then typing inserts bold text", () => {
  Scene.scene(
    { update, view },
    Scene.with(initRichTextEditor("")),

    Scene.keydown(editor, "/"),
    Scene.keydown(editor, "b"),
    Scene.keydown(editor, "Enter"),
    Scene.keydown(editor, "H"),
    Scene.keydown(editor, "i"),

    Scene.expect(Scene.text("Hi")).toExist(),
  );
});

test("command b toggles bold marks", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Bold")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ToggledRichTextEditorBold()),
    Story.model((model) => {
      expect(model.document.children[0]?.children[0]?.marks).toEqual([{ type: "bold" }]);
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

test("story: model omits undefined optional fields", () => {
  Story.story(
    update,
    Story.with(initRichTextEditor("Plain")),
    Story.message(SelectedRichTextEditorAll()),
    Story.message(ToggledRichTextEditorBold()),
    Story.message(ToggledRichTextEditorBold()),
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

test("bold formatting survives typing enter and delete", () => {
  Scene.scene(
    { update, view },
    Scene.with(initRichTextEditor("Bold wordx")),

    Scene.keydown(editor, "a", { metaKey: true }),
    Scene.keydown(editor, "b", { metaKey: true }),
    Scene.keydown(editor, "Backspace"),
    Scene.keydown(editor, "B"),
    Scene.keydown(editor, "o"),
    Scene.keydown(editor, "l"),
    Scene.keydown(editor, "d"),
    Scene.keydown(editor, " "),
    Scene.keydown(editor, "w"),
    Scene.keydown(editor, "o"),
    Scene.keydown(editor, "r"),
    Scene.keydown(editor, "d"),
    Scene.keydown(editor, "Enter"),
    Scene.keydown(editor, "N"),
    Scene.keydown(editor, "e"),
    Scene.keydown(editor, "x"),
    Scene.keydown(editor, "t"),

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
