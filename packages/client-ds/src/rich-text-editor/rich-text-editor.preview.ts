import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import {
  UpdatedRichTextEditorSelection,
  ClosedRichTextEditorSlashMenu,
  DeletedRichTextEditorBackward,
  InsertedRichTextEditorText,
  FailedMountRichTextEditorHost,
  MountedRichTextEditorHost,
  MovedRichTextEditorSlashMenuSelection,
  OpenedRichTextEditorSlashMenu,
  PastedRichTextEditorMarkdown,
  RichTextEditor,
  RichTextEditorMessage,
  RestoredRichTextEditorSelection,
  SelectedRichTextEditorAll,
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorBlockFormat,
  SplitRichTextEditorBlock,
  SyncedRichTextEditorPlainText,
  ClickedRichTextEditorMark,
  UpdatedRichTextEditorSlashMenuQuery,
  initRichTextEditor,
  richTextEditorPlainText,
  richTextEditorSubscriptions,
  updateRichTextEditor,
  type RichTextEditorModel,
} from "./rich-text-editor.view";

const Message = Schema.Union([
  InsertedRichTextEditorText,
  PastedRichTextEditorMarkdown,
  SyncedRichTextEditorPlainText,
  DeletedRichTextEditorBackward,
  SplitRichTextEditorBlock,
  SelectedRichTextEditorAll,
  RestoredRichTextEditorSelection,
  MountedRichTextEditorHost,
  FailedMountRichTextEditorHost,
  UpdatedRichTextEditorSelection,
  OpenedRichTextEditorSlashMenu,
  ClosedRichTextEditorSlashMenu,
  UpdatedRichTextEditorSlashMenuQuery,
  MovedRichTextEditorSlashMenuSelection,
  SelectedRichTextEditorSlashCommand,
  SelectedRichTextEditorBlockFormat,
  ClickedRichTextEditorMark,
]);

type Model = RichTextEditorModel;
type Message = typeof Message.Type;

const initialValue = "Foldkit editor mental model";

const insertTextMessages = (value: string): ReadonlyArray<Message> =>
  [...value].map((character) => InsertedRichTextEditorText({ value: character }));

const UpdatedSlashMenuInput = (value: string) => UpdatedRichTextEditorSlashMenuQuery({ value });

const selectedModel = updateRichTextEditor(
  initRichTextEditor("Make this word bold"),
  UpdatedRichTextEditorSelection({ start: 10, end: 14 }),
);

const boldModel = updateRichTextEditor(selectedModel, ClickedRichTextEditorMark({ type: "bold" }));
const headingModel = updateRichTextEditor(
  initRichTextEditor("Editor roadmap"),
  SelectedRichTextEditorBlockFormat({ type: "heading", level: 1 }),
);
const slashOpenModel = updateRichTextEditor(initRichTextEditor(""), OpenedRichTextEditorSlashMenu());

const states = () => {
  const { div, Class } = html<Message>();

  return div(
    [Class("grid w-[min(48rem,calc(100vw-4rem))] gap-4")],
    [
      RichTextEditor<Message>({
        id: "preview-rich-text-editor-empty",
        model: initRichTextEditor(),
        label: "Empty paragraph",
        toParentMessage: (message) => message,
      }),
      RichTextEditor<Message>({
        id: "preview-rich-text-editor-selected",
        model: selectedModel,
        label: "Stored selection",
        description: "The selection is model state, so commands know what range they affect.",
        toParentMessage: (message) => message,
      }),
      RichTextEditor<Message>({
        id: "preview-rich-text-editor-bold",
        model: boldModel,
        label: "Bold range",
        description: "Only the selected range becomes bold; surrounding text remains plain.",
        toParentMessage: (message) => message,
      }),
      RichTextEditor<Message>({
        id: "preview-rich-text-editor-heading",
        model: headingModel,
        label: "Heading block",
        description: "Heading is block-level, not a text wrapper.",
        toParentMessage: (message) => message,
      }),
      RichTextEditor<Message>({
        id: "preview-rich-text-editor-slash-open",
        model: slashOpenModel,
        label: "Slash menu open",
        description: "Shows the transient slash token and open command menu state.",
        isSlashMenuBackdropDisabled: true,
        toParentMessage: (message) => message,
      }),
    ],
  );
};

const inspector = (model: Model) => {
  const { div, pre, span, Class } = html<Message>();

  return div(
    [Class("grid gap-2 rounded-lg border border-border bg-muted p-3")],
    [
      span(
        [Class("text-xs font-medium uppercase tracking-[var(--letter-spacing-label)] text-muted-foreground")],
        ["Serialized model"],
      ),
      pre(
        [Class("m-0 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-foreground")],
        [
          // eslint-disable-next-line effect-local/no-json-parse -- preview-only model inspector output
          JSON.stringify(model, null, 2),
        ],
      ),
    ],
  );
};

export const RichTextEditorPreview = Preview.module({
  title: "Ui/RichTextEditor",
  previews: [
    Preview.preview({ name: "States", view: states }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Editor draft"),
        description: Preview.text("Replay selection and toolbar commands from the Scenarios tab."),
        isDisabled: Preview.boolean(false),
      },
      init: (): Model => initRichTextEditor(initialValue),
      update: updateRichTextEditor,
      subscriptions: ({ model, controls }) =>
        richTextEditorSubscriptions({
          id: "preview-rich-text-editor-replay",
          model,
          isDisabled: Boolean(controls.isDisabled),
        }),
      view: (model: Model, controls: PreviewControlValues) => {
        const { div, p, Class } = html<Message>();

        return div(
          [Class("grid w-[min(48rem,calc(100vw-4rem))] gap-4")],
          [
            RichTextEditor<Message>({
              id: "preview-rich-text-editor-replay",
              model,
              label: String(controls.label),
              description: String(controls.description),
              isDisabled: Boolean(controls.isDisabled),
              toParentMessage: (message) => message,
            }),
            p([Class("m-0 text-sm text-muted-foreground")], [`Plain text: ${richTextEditorPlainText(model)}`]),
            inspector(model),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Write and format draft", [
          UpdatedRichTextEditorSelection({ start: 0, end: 27 }),
          DeletedRichTextEditorBackward({}),
          ...insertTextMessages("Add channel mentions later"),
          UpdatedRichTextEditorSelection({ start: 4, end: 20 }),
          ClickedRichTextEditorMark({ type: "bold" }),
          UpdatedRichTextEditorSelection({ start: 26, end: 26 }),
          ...insertTextMessages(" today"),
        ]),
        Preview.scenario("Bold survives enter and delete", [
          UpdatedRichTextEditorSelection({ start: 0, end: 27 }),
          DeletedRichTextEditorBackward({}),
          ...insertTextMessages("Bold wordx"),
          UpdatedRichTextEditorSelection({ start: 0, end: 9 }),
          ClickedRichTextEditorMark({ type: "bold" }),
          UpdatedRichTextEditorSelection({ start: 9, end: 9 }),
          DeletedRichTextEditorBackward({}),
          UpdatedRichTextEditorSelection({ start: 8, end: 8 }),
          SplitRichTextEditorBlock(),
          ...insertTextMessages("Next line"),
        ]),
        Preview.scenario("Slash menu search and escape", [
          UpdatedRichTextEditorSelection({ start: 27, end: 27 }),
          OpenedRichTextEditorSlashMenu(),
          UpdatedSlashMenuInput("hea"),
          ClosedRichTextEditorSlashMenu(),
        ]),
        Preview.scenario("Slash menu keyboard bold", [
          UpdatedRichTextEditorSelection({ start: 0, end: 7 }),
          OpenedRichTextEditorSlashMenu(),
          UpdatedSlashMenuInput("bo"),
          SelectedRichTextEditorSlashCommand({ value: "bold" }),
        ]),
        Preview.scenario("Toolbar heading levels", [
          UpdatedRichTextEditorSelection({ start: 0, end: 27 }),
          DeletedRichTextEditorBackward({}),
          ...insertTextMessages("Title"),
          SelectedRichTextEditorBlockFormat({ type: "heading", level: 1 }),
          SplitRichTextEditorBlock(),
          ...insertTextMessages("Section"),
          UpdatedRichTextEditorSelection({ start: 6, end: 13 }),
          SelectedRichTextEditorBlockFormat({ type: "heading", level: 2 }),
          SplitRichTextEditorBlock(),
          ...insertTextMessages("Subsection"),
          UpdatedRichTextEditorSelection({ start: 14, end: 24 }),
          SelectedRichTextEditorBlockFormat({ type: "heading", level: 3 }),
        ]),
        Preview.scenario("Slash paragraph from heading", [
          UpdatedRichTextEditorSelection({ start: 0, end: 27 }),
          DeletedRichTextEditorBackward({}),
          ...insertTextMessages("Temporary heading"),
          SelectedRichTextEditorBlockFormat({ type: "heading", level: 2 }),
          OpenedRichTextEditorSlashMenu(),
          UpdatedSlashMenuInput("para"),
          SelectedRichTextEditorSlashCommand({ value: "paragraph" }),
        ]),
        Preview.scenario("Slash H2 on third line", [
          UpdatedRichTextEditorSelection({ start: 0, end: 27 }),
          DeletedRichTextEditorBackward({}),
          ...insertTextMessages("Title"),
          SplitRichTextEditorBlock(),
          ...insertTextMessages("Second"),
          SplitRichTextEditorBlock(),
          ...insertTextMessages("Third"),
          UpdatedRichTextEditorSelection({ start: 18, end: 18 }),
          OpenedRichTextEditorSlashMenu(),
          UpdatedSlashMenuInput("heading 2"),
          SelectedRichTextEditorSlashCommand({ value: "heading-2" }),
          ...insertTextMessages(" stays here"),
        ]),
      ],
    }),
  ],
});

export { Message, RichTextEditorMessage };
