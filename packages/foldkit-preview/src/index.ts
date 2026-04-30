import { Schema } from "effect";
import { Runtime } from "foldkit";
import { html } from "foldkit/html";
import type { Document, Html } from "foldkit/html";
import { m } from "foldkit/message";

export type PreviewControlValue = string | boolean | number;

export type PreviewControl =
  | Readonly<{ type: "text"; defaultValue: string }>
  | Readonly<{ type: "boolean"; defaultValue: boolean }>
  | Readonly<{ type: "number"; defaultValue: number }>
  | Readonly<{ type: "select"; defaultValue: string; options: ReadonlyArray<string> }>;

export type PreviewControls = Readonly<Record<string, PreviewControl>>;
export type PreviewControlValues = Readonly<Record<string, PreviewControlValue>>;

export type Preview = Readonly<{
  name: string;
  controls?: PreviewControls;
  view: (controls: PreviewControlValues) => Html;
}>;

export type PreviewModule = Readonly<{
  title: string;
  previews: ReadonlyArray<Preview>;
}>;

export type LoadedPreviewModule = PreviewModule & Readonly<{
  path: string;
}>;

export const loadPreviewModules = (
  modules: Record<string, PreviewModule>,
): ReadonlyArray<LoadedPreviewModule> =>
  Object.entries(modules)
    .map(([path, module]) => ({ path, ...module }))
    .sort((a, b) => a.title.localeCompare(b.title));

export type PreviewAppConfig = Readonly<{
  title: string;
  modules: ReadonlyArray<LoadedPreviewModule>;
  root?: HTMLElement | null;
}>;

type ModuleTreeNode = Readonly<{
  name: string;
  key: string;
  children: ReadonlyArray<ModuleTreeNode>;
  moduleIndex?: number;
}>;

type MutableModuleTreeNode = {
  name: string;
  key: string;
  children: Array<MutableModuleTreeNode>;
  moduleIndex?: number;
};

const Model = Schema.Struct({
  selectedModuleIndex: Schema.Number,
  selectedPreviewIndex: Schema.Number,
  theme: Schema.Literal("light", "dark"),
  controlsPlacement: Schema.Literal("right", "bottom", "top"),
  isSidebarCollapsed: Schema.Boolean,
  collapsedModules: Schema.Array(Schema.Number),
  collapsedFolders: Schema.Array(Schema.String),
  controlValues: Schema.Array(Schema.Struct({
    key: Schema.String,
    value: Schema.Union(Schema.String, Schema.Boolean, Schema.Number),
  })),
});
type Model = typeof Model.Type;

const SelectedPreview = m("SelectedPreview", {
  moduleIndex: Schema.Number,
  previewIndex: Schema.Number,
});
const ToggledTheme = m("ToggledTheme");
const ToggledSidebar = m("ToggledSidebar");
const ToggledModule = m("ToggledModule", {
  moduleIndex: Schema.Number,
});
const ToggledFolder = m("ToggledFolder", {
  key: Schema.String,
});
const CycledControlsPlacement = m("CycledControlsPlacement");
const ChangedControl = m("ChangedControl", {
  key: Schema.String,
  value: Schema.Union(Schema.String, Schema.Boolean, Schema.Number),
});

const Message = Schema.Union(SelectedPreview, ToggledTheme, ToggledSidebar, ToggledModule, ToggledFolder, CycledControlsPlacement, ChangedControl);
type Message = typeof Message.Type;

const init: Runtime.ProgramInit<Model, Message> = () => [
  {
    selectedModuleIndex: 0,
    selectedPreviewIndex: 0,
    theme: "light",
    controlsPlacement: "right",
    isSidebarCollapsed: false,
    collapsedModules: [],
    collapsedFolders: [],
    controlValues: [],
  },
  [],
];

const toggleNumber = (values: ReadonlyArray<number>, value: number): ReadonlyArray<number> =>
  values.includes(value) ? values.filter((current) => current !== value) : [...values, value];

const toggleString = (values: ReadonlyArray<string>, value: string): ReadonlyArray<string> =>
  values.includes(value) ? values.filter((current) => current !== value) : [...values, value];

const nextControlsPlacement = (placement: Model["controlsPlacement"]): Model["controlsPlacement"] => {
  switch (placement) {
    case "right":
      return "bottom";
    case "bottom":
      return "top";
    case "top":
      return "right";
  }
};

const moduleFolders = (path: string): ReadonlyArray<string> => {
  const normalized = path.replaceAll("\\", "/");
  const srcIndex = normalized.lastIndexOf("/src/");
  const relative = srcIndex >= 0 ? normalized.slice(srcIndex + 5) : normalized;
  const segments = relative.split("/").filter(Boolean);

  return segments.slice(0, Math.max(0, segments.length - 2)).slice(-2);
};

const buildModuleTree = (modules: ReadonlyArray<LoadedPreviewModule>): ReadonlyArray<ModuleTreeNode> => {
  const roots: Array<MutableModuleTreeNode> = [];

  modules.forEach((module, moduleIndex) => {
    let children = roots;
    let key = "";
    const folders = moduleFolders(module.path);

    folders.forEach((folder) => {
      key = key ? `${key}/${folder}` : folder;
      let existing = children.find((node) => node.key === key);

      if (!existing) {
        existing = { name: folder, key, children: [] };
        children.push(existing);
      }

      children = existing.children;
    });

    children.push({
      name: module.title,
      key: `${key}/${module.title}`,
      moduleIndex,
      children: [],
    });
  });

  return roots;
};

const controlKey = (moduleIndex: number, previewIndex: number, name: string): string =>
  `${moduleIndex}:${previewIndex}:${name}`;

const setControlValue = (
  values: Model["controlValues"],
  key: string,
  value: PreviewControlValue,
): Model["controlValues"] => [
  ...values.filter((entry) => entry.key !== key),
  { key, value },
];

const getStoredControlValue = (
  values: Model["controlValues"],
  key: string,
): PreviewControlValue | undefined => values.find((entry) => entry.key === key)?.value;

const update = (
  model: Model,
  message: Message,
): readonly [Model, ReadonlyArray<never>] => {
  switch (message._tag) {
    case "SelectedPreview":
      return [
        {
          ...model,
          selectedModuleIndex: message.moduleIndex,
          selectedPreviewIndex: message.previewIndex,
        },
        [],
      ];
    case "ToggledTheme":
      return [{ ...model, theme: model.theme === "light" ? "dark" : "light" }, []];
    case "ToggledSidebar":
      return [{ ...model, isSidebarCollapsed: !model.isSidebarCollapsed }, []];
    case "ToggledModule":
      return [{ ...model, collapsedModules: toggleNumber(model.collapsedModules, message.moduleIndex) }, []];
    case "ToggledFolder":
      return [{ ...model, collapsedFolders: toggleString(model.collapsedFolders, message.key) }, []];
    case "CycledControlsPlacement":
      return [{ ...model, controlsPlacement: nextControlsPlacement(model.controlsPlacement) }, []];
    case "ChangedControl":
      return [{ ...model, controlValues: setControlValue(model.controlValues, message.key, message.value) }, []];
  }
};

const previewId = (moduleIndex: number, previewIndex: number): string =>
  `preview-${moduleIndex}-${previewIndex}`;

export const runPreviewApp = (config: PreviewAppConfig): void => {
  const { aside, button, div, h1, h2, h3, header, input, main, nav, option, p, section, select, span, Class, Id, OnChange, OnClick, OnInput, Type, Value } = html<Message>();
  const moduleTree = buildModuleTree(config.modules);

  const view = (model: Model): Document => {
    const selectedModule = config.modules[model.selectedModuleIndex] ?? config.modules[0];
    const selectedPreview = selectedModule?.previews[model.selectedPreviewIndex] ?? selectedModule?.previews[0];
    const selectedControls = selectedPreview?.controls ?? {};
    const controlEntries = Object.entries(selectedControls);
    const controlValues = Object.fromEntries(
      controlEntries.map(([name, control]) => {
        const key = controlKey(model.selectedModuleIndex, model.selectedPreviewIndex, name);

        return [name, getStoredControlValue(model.controlValues, key) ?? control.defaultValue];
      }),
    );
    const isDark = model.theme === "dark";
    const hasRightControls = model.controlsPlacement === "right";
    const shellClass = isDark
      ? `grid min-h-screen bg-neutral-950 text-neutral-50 ${model.isSidebarCollapsed ? (hasRightControls ? "lg:grid-cols-[4.75rem_1fr_18rem]" : "lg:grid-cols-[4.75rem_1fr]") : (hasRightControls ? "lg:grid-cols-[16rem_1fr_18rem]" : "lg:grid-cols-[16rem_1fr]")}`
      : `grid min-h-screen bg-neutral-100 text-neutral-950 ${model.isSidebarCollapsed ? (hasRightControls ? "lg:grid-cols-[4.75rem_1fr_18rem]" : "lg:grid-cols-[4.75rem_1fr]") : (hasRightControls ? "lg:grid-cols-[16rem_1fr_18rem]" : "lg:grid-cols-[16rem_1fr]")}`;
    const sidebarClass = isDark
      ? "border-b border-neutral-800 bg-neutral-950/95 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r"
      : "border-b border-neutral-200 bg-white/95 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r";
    const dividerClass = isDark ? "border-neutral-800" : "border-neutral-200";
    const mutedClass = isDark ? "text-neutral-400" : "text-neutral-500";
    const panelClass = isDark
      ? "overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-sm"
      : "overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm";
    const canvasClass = isDark
      ? "grid min-h-[20rem] place-items-center bg-[radial-gradient(circle_at_1px_1px,rgb(64_64_64)_1px,transparent_0)] bg-[length:20px_20px] p-4"
      : "grid min-h-[20rem] place-items-center bg-[radial-gradient(circle_at_1px_1px,rgb(212_212_212)_1px,transparent_0)] bg-[length:20px_20px] p-4";
    const cardClass = isDark
      ? "rounded-md border border-neutral-800 bg-neutral-900 p-4 shadow-sm"
      : "rounded-md border border-neutral-200 bg-white p-4 shadow-sm";
    const controlsPanelClass = hasRightControls
      ? (isDark ? "border-t border-neutral-800 bg-neutral-950 lg:sticky lg:top-0 lg:h-screen lg:border-l lg:border-t-0" : "border-t border-neutral-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-l lg:border-t-0")
      : panelClass;

    const renderTreeNodes = (nodes: ReadonlyArray<ModuleTreeNode>, depth: number): ReadonlyArray<Html> =>
      nodes.flatMap((node) => {
        if (node.moduleIndex !== undefined) {
          const module = config.modules[node.moduleIndex];

          if (!module) {
            return [];
          }

          const isModuleCollapsed = model.collapsedModules.includes(node.moduleIndex);
          const isModuleSelected = selectedModule === module;
          const moduleRow = button([OnClick(ToggledModule({ moduleIndex: node.moduleIndex })), Class(`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px] ${isModuleSelected ? (isDark ? "bg-neutral-800 text-neutral-50" : "bg-neutral-100 text-neutral-950") : (isDark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}`)], [
            span([Class("w-3 text-neutral-400")], [isModuleCollapsed ? "›" : "⌄"]),
            span([Class("truncate")], [node.name]),
          ]);
          const previews = isModuleCollapsed ? [] : module.previews.map((preview, previewIndex) => {
            const isSelected = selectedModule === module && selectedPreview === preview;

            return button([OnClick(SelectedPreview({ moduleIndex: node.moduleIndex!, previewIndex })), Class(`ml-5 flex w-[calc(100%-1.25rem)] rounded-sm px-2 py-1 text-left text-[13px] ${isSelected ? (isDark ? "bg-neutral-800 text-neutral-50" : "bg-neutral-200 text-neutral-950") : (isDark ? "text-neutral-300 hover:bg-neutral-900" : "text-neutral-700 hover:bg-neutral-100")}`)], [preview.name]);
          });

          return [div([Class("grid")], [moduleRow, ...previews])];
        }

        const isCollapsed = model.collapsedFolders.includes(node.key);

        return [div([Class("grid")], [
          button([OnClick(ToggledFolder({ key: node.key })), Class(`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px] ${depth > 0 ? "ml-4 w-[calc(100%-1rem)]" : ""} ${isDark ? "text-neutral-100 hover:bg-neutral-900" : "text-neutral-950 hover:bg-neutral-100"}`)], [
            span([Class("w-3 text-neutral-400")], [isCollapsed ? "›" : "⌄"]),
            span([Class("truncate")], [node.name]),
          ]),
          ...(isCollapsed ? [] : renderTreeNodes(node.children, depth + 1).map((child) =>
            div([Class(depth > 0 ? "ml-4" : "ml-3")], [child]),
          )),
        ])];
      });

    const controlsPanel = aside([Class(controlsPanelClass)], [
      div([Class(`flex h-11 items-center justify-between border-b px-3 ${dividerClass}`)], [
        div([Class("min-w-0")], [
          h2([Class("truncate text-[13px] font-semibold")], ["Controls"]),
          p([Class(`m-0 truncate text-xs ${mutedClass}`)], [selectedPreview?.name ?? "No preview"]),
        ]),
        button([OnClick(CycledControlsPlacement()), Class(isDark ? "rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-800" : "rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 shadow-sm hover:bg-neutral-100")], [
          model.controlsPlacement === "right" ? "Bottom" : model.controlsPlacement === "bottom" ? "Top" : "Right",
        ]),
      ]),
      div([Class(hasRightControls ? "grid gap-3 p-3" : "grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3")], [
        ...(controlEntries.length === 0
          ? [p([Class(`m-0 text-sm ${mutedClass}`)], ["No controls for this preview."])]
          : controlEntries.map(([name, control]) => {
            const key = controlKey(model.selectedModuleIndex, model.selectedPreviewIndex, name);
            const value = getStoredControlValue(model.controlValues, key) ?? control.defaultValue;
            const label = name.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
            const inputClass = isDark
              ? "h-8 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 text-[13px] text-neutral-50 outline-none ring-offset-neutral-950 focus:ring-2 focus:ring-neutral-700"
              : "h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-950 outline-none ring-offset-white focus:ring-2 focus:ring-neutral-300";

            return div([Class("grid gap-1")], [
              div([Class(`text-xs font-medium ${mutedClass}`)], [label]),
              control.type === "boolean"
                ? button([OnClick(ChangedControl({ key, value: !Boolean(value) })), Class(Boolean(value) ? (isDark ? "flex h-8 items-center justify-between rounded-md border border-neutral-700 bg-neutral-800 px-2.5 text-[13px] text-neutral-50" : "flex h-8 items-center justify-between rounded-md border border-neutral-300 bg-neutral-100 px-2.5 text-[13px] text-neutral-950") : (isDark ? "flex h-8 items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-2.5 text-[13px] text-neutral-400" : "flex h-8 items-center justify-between rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-600"))], [
                  span([], [Boolean(value) ? "True" : "False"]),
                  span([Class(Boolean(value) ? "text-emerald-500" : mutedClass)], [Boolean(value) ? "●" : "○"]),
                ])
                : control.type === "select"
                  ? select([Value(String(value)), OnChange((nextValue) => ChangedControl({ key, value: nextValue })), Class(inputClass)], control.options.map((choice) => option([Value(choice)], [choice])))
                  : input([Type(control.type === "number" ? "number" : "text"), Value(String(value)), OnInput((nextValue) => ChangedControl({ key, value: control.type === "number" ? Number(nextValue) : nextValue })), Class(inputClass)]),
            ]);
          })),
      ]),
    ]);

    return {
      title: config.title,
      body: main([Class("min-h-screen bg-neutral-950 text-neutral-950")], [
        div([Class(shellClass)], [
          aside([Class(sidebarClass)], [
            div([Class(`flex h-12 items-center gap-2 border-b px-2.5 ${dividerClass}`)], [
              div([Class(isDark ? "grid size-7 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-neutral-950" : "grid size-7 shrink-0 place-items-center rounded-md bg-neutral-950 text-xs font-semibold text-white")], ["F"]),
              div([Class(model.isSidebarCollapsed ? "hidden" : "min-w-0")], [
                h1([Class("truncate text-sm font-semibold tracking-tight")], [config.title]),
                p([Class(`m-0 text-[11px] ${mutedClass}`)], ["Component previews"]),
              ]),
              button([OnClick(ToggledSidebar()), Class(isDark ? "ml-auto shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-800" : "ml-auto shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 hover:bg-neutral-100")], [
                model.isSidebarCollapsed ? "›" : "‹",
              ]),
            ]),
            nav([Class(model.isSidebarCollapsed ? "grid max-h-[40vh] gap-1 overflow-auto p-2 lg:max-h-[calc(100vh-3rem)]" : "grid max-h-[40vh] gap-0.5 overflow-auto p-2 lg:max-h-[calc(100vh-3rem)]")], model.isSidebarCollapsed
              ? config.modules.map((module, moduleIndex) => {
                const isModuleSelected = selectedModule === module;

                return button([OnClick(SelectedPreview({ moduleIndex, previewIndex: 0 })), Class(isDark ? `grid size-9 place-items-center rounded-md text-xs font-medium ${isModuleSelected ? "bg-neutral-800 text-neutral-50" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-50"}` : `grid size-9 place-items-center rounded-md text-xs font-medium ${isModuleSelected ? "bg-neutral-100 text-neutral-950" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"}`)], [
                  module.title.slice(0, 1),
                ]);
              })
              : renderTreeNodes(moduleTree, 0)),
          ]),
          section([Class("grid min-w-0 grid-rows-[auto_1fr]")], [
            header([Class(`sticky top-0 z-10 flex h-12 items-center justify-between border-b px-3 backdrop-blur ${dividerClass} ${isDark ? "bg-neutral-950/90" : "bg-white/90"}`)], [
              div([Class("min-w-0")], [
                h2([Class("truncate text-sm font-semibold")], [selectedModule?.title ?? "No previews"]),
                p([Class(`m-0 truncate text-xs ${mutedClass}`)], [selectedModule?.path ?? "Add src/**/*.preview.ts files"]),
              ]),
              div([Class("flex items-center gap-2")], [
                span([Class(isDark ? "rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400 shadow-sm" : "rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600 shadow-sm")], [
                  `${config.modules.length} modules`,
                ]),
                button([OnClick(ToggledTheme()), Class(isDark ? "rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-neutral-100 hover:bg-neutral-800" : "rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-sm hover:bg-neutral-100")], [
                  isDark ? "Light" : "Dark",
                ]),
              ]),
            ]),
            div([Class("grid gap-3 p-3 lg:p-4")], [
              ...(model.controlsPlacement === "top" ? [controlsPanel] : []),
              section([Class(panelClass)], [
                div([Class(`flex items-center justify-between border-b px-3 py-2 ${dividerClass}`)], [
                  div([Class("grid gap-0.5")], [
                    h3([Class("text-sm font-medium")], [selectedPreview?.name ?? "No preview selected"]),
                    p([Class(`m-0 text-xs ${mutedClass}`)], ["Isolated canvas"]),
                  ]),
                  div([Class("flex gap-1.5")], [
                    span([Class("size-3 rounded-full bg-red-400")], []),
                    span([Class("size-3 rounded-full bg-yellow-400")], []),
                    span([Class("size-3 rounded-full bg-green-400")], []),
                  ]),
                ]),
                div([Id(previewId(model.selectedModuleIndex, model.selectedPreviewIndex)), Class(canvasClass)], [
                  div([Class(cardClass)], [selectedPreview ? selectedPreview.view(controlValues) : div([], [])]),
                ]),
              ]),
              ...(model.controlsPlacement === "bottom" ? [controlsPanel] : []),
            ]),
          ]),
          ...(model.controlsPlacement === "right" ? [controlsPanel] : []),
        ]),
      ]),
    };
  };

  const program = Runtime.makeProgram({
    Model,
    init,
    update,
    view,
    container: config.root ?? document.getElementById("root")!,
    devTools: { Message, banner: config.title },
  });

  Runtime.run(program);
};
