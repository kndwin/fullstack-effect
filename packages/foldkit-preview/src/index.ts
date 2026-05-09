import { cva } from "class-variance-authority";
import { Effect, Option, Schema, Stream } from "effect";
import { Command, Runtime, Subscription, Task, Ui } from "foldkit";
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

export type PreviewReplayStep<Message = unknown> = Readonly<{
  type: "message";
  message: Message;
  delayMs?: number;
}>;
export type PreviewReplayEntry<Message = unknown> = Message | PreviewReplayStep<Message>;
export type PreviewScenario<Message = unknown> = Readonly<{
  name: string;
  steps: ReadonlyArray<PreviewReplayEntry<Message>>;
}>;

export type PreviewCommandResolution<Model = unknown, Message = unknown> = Readonly<{
  label: string;
  message: (
    context: Readonly<{ model: Model; sourceModel: Model; sourceMessage: Message; command: unknown }>,
  ) => Message;
}>;

export type PreviewCommandResolutions<Model = unknown, Message = unknown> = Readonly<
  Record<string, ReadonlyArray<PreviewCommandResolution<Model, Message>>>
>;

export const Preview = {
  module: <Module extends PreviewModule>(module: Module): Module => module,
  preview: <Model, Message>(preview: Preview<Model, Message>): Preview<Model, Message> => preview,
  text: (defaultValue: string): PreviewControl => ({ type: "text", defaultValue }),
  boolean: (defaultValue: boolean): PreviewControl => ({ type: "boolean", defaultValue }),
  number: (defaultValue: number): PreviewControl => ({ type: "number", defaultValue }),
  select: (defaultValue: string, options: ReadonlyArray<string>): PreviewControl => ({
    type: "select",
    defaultValue,
    options,
  }),
  step: <Message>(message: Message, options?: Readonly<{ delayMs?: number }>): PreviewReplayStep<Message> => ({
    type: "message",
    message,
    delayMs: options?.delayMs,
  }),
  scenario: (name: string, steps: ReadonlyArray<PreviewReplayEntry<any>>): PreviewScenario<any> => ({ name, steps }),
};

export type Preview<Model = unknown, Message = unknown> = Readonly<{
  name: string;
  controls?: PreviewControls;
  init?: (controls: PreviewControlValues) => Model;
  update?: (model: Model, message: Message) => Model | readonly [Model, ReadonlyArray<unknown>];
  view: ((controls: PreviewControlValues) => Html) | ((model: Model, controls: PreviewControlValues) => Html);
  routing?: Readonly<{
    onUrlRequest?: (request: typeof Runtime.UrlRequest.Type) => Message;
  }>;
  scenarios?: ReadonlyArray<PreviewScenario<Message>>;
  commandResolutions?: PreviewCommandResolutions<Model, Message>;
}>;

export type PreviewModule = Readonly<{
  title: string;
  previews: ReadonlyArray<Preview<any, any>>;
}>;

type RightPanelTab = "controls" | "history" | "scenarios" | "commands" | "model";

export type LoadedPreviewModule = PreviewModule &
  Readonly<{
    path: string;
  }>;

const isPreviewModule = (value: unknown): value is PreviewModule =>
  typeof value === "object" && value !== null && "title" in value && "previews" in value;

const previewModuleFromExport = (value: unknown): PreviewModule | undefined => {
  if (isPreviewModule(value)) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return Object.values(value).find(isPreviewModule);
};

export const loadPreviewModules = (modules: Record<string, unknown>): ReadonlyArray<LoadedPreviewModule> =>
  Object.entries(modules)
    .flatMap(([path, module]) => {
      const previewModule = previewModuleFromExport(module);

      return previewModule ? [{ path, ...previewModule }] : [];
    })
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

const inspectorWidthMinPx = 288;
const inspectorWidthMaxPx = 560;
const inspectorWidthDefaultPx = 352;

const accentThemeOptions = [
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "yellow",
  "amber",
  "orange",
] as const;
const grayThemeOptions = ["slate", "gray", "mauve", "sage", "olive", "sand"] as const;
const radiusThemeOptions = [
  { value: "none", label: "None", radius: "0rem" },
  { value: "small", label: "Small", radius: "0.375rem" },
  { value: "medium", label: "Medium", radius: "0.625rem" },
  { value: "large", label: "Large", radius: "1rem" },
  { value: "full", label: "Full", radius: "9999px" },
] as const;
const scaleThemeOptions = ["90%", "95%", "100%", "105%", "110%"] as const;
const spacingThemeOptions = ["Compact", "Cozy", "Comfortable", "Loose", "Spacious"] as const;

const clampInspectorWidth = (widthPx: number): number =>
  Math.max(inspectorWidthMinPx, Math.min(inspectorWidthMaxPx, Math.round(widthPx)));

const inspectorWidthFromClientX = (clientX: number): number => clampInspectorWidth(window.innerWidth - clientX - 16);

const shellClass = cva("grid min-h-screen", {
  variants: {
    theme: {
      light: "bg-neutral-100 text-neutral-950",
      dark: "bg-neutral-950 text-neutral-50",
    },
    sidebar: {
      expanded: "lg:grid-cols-[16rem_1fr]",
      collapsed: "lg:grid-cols-[4.75rem_1fr]",
    },
  },
});

const sidebarClass = cva("border-b lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r", {
  variants: {
    theme: {
      light: "border-neutral-200 bg-white/95",
      dark: "border-neutral-800 bg-neutral-950/95",
    },
  },
});

const panelClass = cva("overflow-hidden rounded-lg border shadow-sm", {
  variants: {
    theme: {
      light: "border-neutral-200 bg-white",
      dark: "border-neutral-800 bg-neutral-950",
    },
  },
});

const cardClass = cva("rounded-md border p-4 shadow-sm", {
  variants: {
    theme: {
      light: "border-border bg-card text-card-foreground",
      dark: "border-border bg-card text-card-foreground",
    },
  },
});

const controlsPanelClass = cva("rounded-md border shadow-sm", {
  variants: {
    theme: {
      light: "border-neutral-200 bg-white",
      dark: "border-neutral-800 bg-neutral-950",
    },
  },
  defaultVariants: {
    theme: "light",
  },
});

const panelTabClass = cva("flex h-12 flex-1 items-center border-b px-3 text-left text-xs font-medium", {
  variants: {
    theme: {
      light: "",
      dark: "",
    },
    selected: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { theme: "light", selected: true, class: "border-neutral-950 text-neutral-950" },
    { theme: "light", selected: false, class: "border-neutral-200 text-neutral-500 hover:text-neutral-950" },
    { theme: "dark", selected: true, class: "border-neutral-50 text-neutral-50" },
    { theme: "dark", selected: false, class: "border-neutral-800 text-neutral-400 hover:text-neutral-50" },
  ],
});

const toolbarButtonClass = cva("rounded-md border px-2.5 py-1 text-xs font-medium disabled:opacity-50", {
  variants: {
    theme: {
      light: "border-neutral-200 bg-white text-neutral-900 shadow-sm hover:bg-neutral-100",
      dark: "border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
    },
  },
});

const compactButtonClass = cva("rounded-md border px-2 py-1 text-xs", {
  variants: {
    theme: {
      light: "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100",
      dark: "border-neutral-800 bg-neutral-900 text-neutral-100 hover:bg-neutral-800",
    },
  },
});

const navModuleButtonClass = cva("flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px]", {
  variants: {
    theme: {
      light: "",
      dark: "",
    },
    selected: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { theme: "light", selected: true, class: "bg-neutral-100 text-neutral-950" },
    { theme: "light", selected: false, class: "text-neutral-700 hover:bg-neutral-100" },
    { theme: "dark", selected: true, class: "bg-neutral-800 text-neutral-50" },
    { theme: "dark", selected: false, class: "text-neutral-300 hover:bg-neutral-900" },
  ],
});

const navPreviewButtonClass = cva("ml-5 flex w-[calc(100%-1.25rem)] rounded-sm px-2 py-1 text-left text-[13px]", {
  variants: {
    theme: {
      light: "",
      dark: "",
    },
    selected: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { theme: "light", selected: true, class: "bg-neutral-200 text-neutral-950" },
    { theme: "light", selected: false, class: "text-neutral-700 hover:bg-neutral-100" },
    { theme: "dark", selected: true, class: "bg-neutral-800 text-neutral-50" },
    { theme: "dark", selected: false, class: "text-neutral-300 hover:bg-neutral-900" },
  ],
});

const collapsedModuleButtonClass = cva("grid size-9 place-items-center rounded-md text-xs font-medium", {
  variants: {
    theme: {
      light: "",
      dark: "",
    },
    selected: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { theme: "light", selected: true, class: "bg-neutral-100 text-neutral-950" },
    { theme: "light", selected: false, class: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950" },
    { theme: "dark", selected: true, class: "bg-neutral-800 text-neutral-50" },
    { theme: "dark", selected: false, class: "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-50" },
  ],
});

const booleanControlButtonClass = cva("flex h-8 items-center justify-between rounded-md border px-2.5 text-[13px]", {
  variants: {
    theme: {
      light: "",
      dark: "",
    },
    checked: {
      true: "",
      false: "",
    },
  },
  compoundVariants: [
    { theme: "light", checked: true, class: "border-neutral-300 bg-neutral-100 text-neutral-950" },
    { theme: "light", checked: false, class: "border-neutral-200 bg-white text-neutral-600" },
    { theme: "dark", checked: true, class: "border-neutral-700 bg-neutral-800 text-neutral-50" },
    { theme: "dark", checked: false, class: "border-neutral-800 bg-neutral-900 text-neutral-400" },
  ],
});

const Model = Schema.Struct({
  selectedModuleIndex: Schema.Number,
  selectedPreviewIndex: Schema.Number,
  theme: Schema.Literals(["light", "dark"]),
  isThemeTokenPanelOpen: Schema.Boolean,
  themeAccentColor: Schema.String,
  themeGrayColor: Schema.String,
  themeRadius: Schema.String,
  themeScale: Schema.String,
  themeSpacing: Schema.String,
  themePanelBackground: Schema.Literals(["solid", "translucent"]),
  rightPanelTab: Schema.Literals(["controls", "history", "scenarios", "commands", "model"]),
  isSidebarCollapsed: Schema.Boolean,
  treeSearch: Schema.String,
  collapsedModules: Schema.Array(Schema.Number),
  collapsedFolders: Schema.Array(Schema.String),
  controlValues: Schema.Array(
    Schema.Struct({
      key: Schema.String,
      value: Schema.Union([Schema.String, Schema.Boolean, Schema.Number]),
    }),
  ),
  previewModels: Schema.Array(
    Schema.Struct({
      key: Schema.String,
      value: Schema.Any,
    }),
  ),
  replay: Schema.Struct({
    isPlaying: Schema.Boolean,
    scenarioIndex: Schema.Number,
    stepIndex: Schema.Number,
    delayMs: Schema.Number,
  }),
  historyMessageList: Ui.VirtualList.Model,
  scenarioMessageList: Ui.VirtualList.Model,
  historyReplayIndex: Schema.Number,
  messageLog: Schema.Array(Schema.Any),
  nextPendingCommandId: Schema.Number,
  pendingCommands: Schema.Array(
    Schema.Struct({
      id: Schema.Number,
      name: Schema.String,
      command: Schema.Any,
      sourceModel: Schema.Any,
      sourceMessage: Schema.Any,
    }),
  ),
  rightPanelWidthPx: Schema.Number,
  isResizingRightPanel: Schema.Boolean,
});
type Model = typeof Model.Type;

const SelectedPreview = m("SelectedPreview", {
  moduleIndex: Schema.Number,
  previewIndex: Schema.Number,
});
const ToggledTheme = m("ToggledTheme");
const ToggledThemeTokenPanel = m("ToggledThemeTokenPanel");
const ChangedThemeToken = m("ChangedThemeToken", {
  key: Schema.String,
  value: Schema.String,
});
const ResetThemeToken = m("ResetThemeToken", {
  key: Schema.String,
});
const ResetThemeTokens = m("ResetThemeTokens");
const ToggledSidebar = m("ToggledSidebar");
const ToggledModule = m("ToggledModule", {
  moduleIndex: Schema.Number,
});
const ToggledFolder = m("ToggledFolder", {
  key: Schema.String,
});
const ChangedTreeSearch = m("ChangedTreeSearch", {
  value: Schema.String,
});
const SelectedRightPanelTab = m("SelectedRightPanelTab", {
  tab: Schema.Literals(["controls", "history", "scenarios", "commands", "model"]),
});
const ChangedControl = m("ChangedControl", {
  key: Schema.String,
  value: Schema.Union([Schema.String, Schema.Boolean, Schema.Number]),
});
const StartedReplay = m("StartedReplay");
const AdvancedReplay = m("AdvancedReplay");
const StoppedReplay = m("StoppedReplay");
const ResetPreview = m("ResetPreview");
const SelectedScenario = m("SelectedScenario", {
  scenarioIndex: Schema.Number,
});
const ChangedReplayDelay = m("ChangedReplayDelay", {
  delayMs: Schema.Number,
});
const ScrubbedReplay = m("ScrubbedReplay", {
  stepIndex: Schema.Number,
});
const ScrubbedHistory = m("ScrubbedHistory", {
  stepIndex: Schema.Number,
});
const GotHistoryMessageListMessage = m("GotHistoryMessageListMessage", {
  message: Ui.VirtualList.Message,
});
const GotScenarioMessageListMessage = m("GotScenarioMessageListMessage", {
  message: Ui.VirtualList.Message,
});
const ResolvedCommand = m("ResolvedCommand", {
  id: Schema.Number,
  resolutionIndex: Schema.Number,
});
const DiscardedCommand = m("DiscardedCommand", {
  id: Schema.Number,
});
const ClearedCommands = m("ClearedCommands");
const StartedRightPanelResize = m("StartedRightPanelResize");
const MovedRightPanelResize = m("MovedRightPanelResize", {
  clientX: Schema.Number,
});
const StoppedRightPanelResize = m("StoppedRightPanelResize");
const IgnoredUrlRequest = m("IgnoredUrlRequest");

const ShellMessage = Schema.Union([
  SelectedPreview,
  ToggledTheme,
  ToggledThemeTokenPanel,
  ChangedThemeToken,
  ResetThemeToken,
  ResetThemeTokens,
  ToggledSidebar,
  ToggledModule,
  ToggledFolder,
  ChangedTreeSearch,
  SelectedRightPanelTab,
  ChangedControl,
  StartedReplay,
  AdvancedReplay,
  StoppedReplay,
  ResetPreview,
  SelectedScenario,
  ChangedReplayDelay,
  ScrubbedReplay,
  ScrubbedHistory,
  GotHistoryMessageListMessage,
  GotScenarioMessageListMessage,
  ResolvedCommand,
  DiscardedCommand,
  ClearedCommands,
  StartedRightPanelResize,
  MovedRightPanelResize,
  StoppedRightPanelResize,
  IgnoredUrlRequest,
]);
const Message = Schema.Any;
type Message = typeof Message.Type;

const AdvanceReplay = Command.define("AdvanceReplay", AdvancedReplay);

const MovedDragPointer = m("MovedDragPointer", {
  value: Schema.Number,
});

const ReleasedDragPointer = m("ReleasedDragPointer");

const advanceReplayAfter = (delayMs: number) =>
  AdvanceReplay(Task.delay(`${delayMs} millis`).pipe(Effect.as(AdvancedReplay())));

const SliderDragDeps = Schema.Struct({
  active: Schema.Boolean,
  id: Schema.String,
  min: Schema.Number,
  max: Schema.Number,
});

const SubscriptionDeps = Schema.Struct({
  sliderDrag: SliderDragDeps,
  rightPanelResize: Schema.Struct({ active: Schema.Boolean }),
  historyMessageListEvents: Ui.VirtualList.SubscriptionDeps.fields.containerEvents,
  scenarioMessageListEvents: Ui.VirtualList.SubscriptionDeps.fields.containerEvents,
});

const emptySliderDragDeps = {
  active: false,
  id: "",
  min: 0,
  max: 0,
};

const selectedPreviewModelValue = (model: Model): unknown =>
  model.previewModels.find((entry) => entry.key === selectedPreviewKey(model))?.value;

const sliderDragDepsFromModel = (model: Model): typeof SliderDragDeps.Type => {
  const previewModel = selectedPreviewModelValue(model);

  if (typeof previewModel !== "object" || previewModel === null || !("slider" in previewModel)) {
    return emptySliderDragDeps;
  }

  const slider = previewModel.slider;

  if (
    typeof slider !== "object" ||
    slider === null ||
    !("dragState" in slider) ||
    !("id" in slider) ||
    !("min" in slider) ||
    !("max" in slider)
  ) {
    return emptySliderDragDeps;
  }

  const dragState = slider.dragState;

  return {
    active: typeof dragState === "object" && dragState !== null && "_tag" in dragState && dragState._tag === "Dragging",
    id: String(slider.id),
    min: Number(slider.min),
    max: Number(slider.max),
  };
};

const valueFromClientX = (clientX: number, element: Element, min: number, max: number): number => {
  const rect = element.getBoundingClientRect();
  const fraction = rect.width === 0 ? 0 : Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);

  return min + fraction * (max - min);
};

const sliderTrackElement = (id: string): Element | null =>
  document.querySelector(`[data-slider-track-id="${CSS.escape(id)}"]`);

const collapsedTreeState = (
  nodes: ReadonlyArray<ModuleTreeNode>,
): Pick<Model, "collapsedFolders" | "collapsedModules"> => {
  const collapsedFolders: Array<string> = [];
  const collapsedModules: Array<number> = [];

  nodes.forEach((node) => {
    if (node.moduleIndex !== undefined) {
      collapsedModules.push(node.moduleIndex);
      return;
    }

    collapsedFolders.push(node.key);
    const childState = collapsedTreeState(node.children);
    collapsedFolders.push(...childState.collapsedFolders);
    collapsedModules.push(...childState.collapsedModules);
  });

  return { collapsedFolders, collapsedModules };
};

const selectedPreviewFromLocation = (
  modules: ReadonlyArray<LoadedPreviewModule>,
): Readonly<{ moduleIndex: number; previewIndex: number }> => {
  const params = new URLSearchParams(window.location.search);
  const moduleTitle = params.get("module");
  const previewName = params.get("preview");
  const moduleIndex = moduleTitle ? modules.findIndex((module) => module.title === moduleTitle) : -1;
  const module = moduleIndex >= 0 ? modules[moduleIndex] : modules[0];
  const previewIndex =
    module && previewName ? module.previews.findIndex((preview) => preview.name === previewName) : -1;

  return {
    moduleIndex: moduleIndex >= 0 ? moduleIndex : 0,
    previewIndex: previewIndex >= 0 ? previewIndex : 0,
  };
};

const pinSelectedPreviewToLocation = (module: LoadedPreviewModule | undefined, preview: Preview | undefined): void => {
  if (!module || !preview) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set("module", module.title);
  url.searchParams.set("preview", preview.name);
  window.history.replaceState(window.history.state, "", url);
};

const createInit = (
  moduleTree: ReadonlyArray<ModuleTreeNode>,
  modules: ReadonlyArray<LoadedPreviewModule>,
): Runtime.ProgramInit<Model, Message> => {
  const { collapsedFolders, collapsedModules } = collapsedTreeState(moduleTree);

  return (_url?: unknown) => {
    const selectedPreview = selectedPreviewFromLocation(modules);

    return [
      {
        selectedModuleIndex: selectedPreview.moduleIndex,
        selectedPreviewIndex: selectedPreview.previewIndex,
        theme: "light",
        isThemeTokenPanelOpen: false,
        themeAccentColor: "blue",
        themeGrayColor: "slate",
        themeRadius: "medium",
        themeScale: "100%",
        themeSpacing: "Comfortable",
        themePanelBackground: "solid",
        rightPanelTab: "controls",
        isSidebarCollapsed: false,
        treeSearch: "",
        collapsedModules,
        collapsedFolders,
        controlValues: [],
        previewModels: [],
        replay: { isPlaying: false, scenarioIndex: 0, stepIndex: 0, delayMs: 300 },
        historyMessageList: Ui.VirtualList.init({ id: "preview-history-messages", rowHeightPx: 88 }),
        scenarioMessageList: Ui.VirtualList.init({ id: "preview-scenario-messages", rowHeightPx: 72 }),
        historyReplayIndex: 0,
        messageLog: [],
        nextPendingCommandId: 1,
        pendingCommands: [],
        rightPanelWidthPx: inspectorWidthDefaultPx,
        isResizingRightPanel: false,
      },
      [],
    ];
  };
};

const toggleNumber = (values: ReadonlyArray<number>, value: number): ReadonlyArray<number> =>
  values.includes(value) ? values.filter((current) => current !== value) : [...values, value];

const themeScaleMultiplier = (scale: string): number => Number(scale.replace("%", "")) / 100 || 1;

const themeSpacingMultiplier = (spacing: string): number => {
  switch (spacing) {
    case "Compact":
      return 0.75;
    case "Cozy":
      return 0.9;
    case "Loose":
      return 1.15;
    case "Spacious":
      return 1.35;
    default:
      return 1;
  }
};

const themeRadiusValue = (radius: string): string =>
  radiusThemeOptions.find((option) => option.value === radius)?.radius ?? "0.625rem";

const themePlaygroundStyle = (model: Model): Record<string, string> => {
  const accent = model.themeAccentColor;
  const gray = model.themeGrayColor;
  const scale = themeScaleMultiplier(model.themeScale);
  const spacing = themeSpacingMultiplier(model.themeSpacing);
  const translucent = model.themePanelBackground === "translucent";

  return {
    "--background": translucent ? `color-mix(in srgb, var(--${gray}-2) 82%, transparent)` : `var(--${gray}-2)`,
    "--foreground": `var(--${gray}-12)`,
    "--card": translucent ? `color-mix(in srgb, var(--${gray}-1) 84%, transparent)` : `var(--${gray}-1)`,
    "--card-foreground": `var(--${gray}-12)`,
    "--popover": translucent ? `color-mix(in srgb, var(--${gray}-1) 86%, transparent)` : `var(--${gray}-1)`,
    "--popover-foreground": `var(--${gray}-12)`,
    "--surface": `var(--${gray}-3)`,
    "--surface-foreground": `var(--${gray}-12)`,
    "--surface-hover": `var(--${gray}-4)`,
    "--surface-active": `var(--${accent}-4)`,
    "--secondary": `var(--${gray}-3)`,
    "--secondary-foreground": `var(--${gray}-12)`,
    "--accent": `var(--${accent}-4)`,
    "--accent-foreground": `var(--${accent}-12)`,
    "--muted": `var(--${gray}-3)`,
    "--muted-foreground": `var(--${gray}-11)`,
    "--border": `var(--${gray}-6)`,
    "--border-hover": `var(--${gray}-8)`,
    "--ring": `var(--${accent}-8)`,
    "--focus-ring": `var(--${accent}-8)`,
    "--primary": `var(--${accent}-9)`,
    "--primary-hover": `var(--${accent}-10)`,
    "--primary-active": `var(--${accent}-9)`,
    "--primary-foreground": "white",
    "--input": `var(--${gray}-7)`,
    "--input-hover": `var(--${gray}-8)`,
    "--input-active": `var(--${accent}-8)`,
    "--input-disabled": `var(--${gray}-4)`,
    "--sidebar": translucent ? `color-mix(in srgb, var(--${gray}-1) 84%, transparent)` : `var(--${gray}-1)`,
    "--sidebar-foreground": `var(--${gray}-12)`,
    "--sidebar-accent": `var(--${accent}-4)`,
    "--sidebar-accent-foreground": `var(--${accent}-12)`,
    "--sidebar-border": `var(--${gray}-6)`,
    "--sidebar-ring": `var(--${accent}-8)`,
    "--radius": themeRadiusValue(model.themeRadius),
    "--space-1": `${0.25 * spacing}rem`,
    "--space-2": `${0.5 * spacing}rem`,
    "--space-3": `${0.75 * spacing}rem`,
    "--space-4": `${1 * spacing}rem`,
    "--space-5": `${1.25 * spacing}rem`,
    "--space-6": `${1.5 * spacing}rem`,
    "--space-control-x": `${0.75 * spacing}rem`,
    "--space-control-y": `${0.375 * spacing}rem`,
    "--space-card": `${0.75 * spacing}rem`,
    "--space-panel": `${0.75 * spacing}rem`,
    "--space-shell": `${0.75 * spacing}rem`,
    "--space-list-item-x": `${0.5 * spacing}rem`,
    "--space-list-item-y": `${0.25 * spacing}rem`,
    "--size-control-md": `${2 * scale}rem`,
  };
};

const toggleString = (values: ReadonlyArray<string>, value: string): ReadonlyArray<string> =>
  values.includes(value) ? values.filter((current) => current !== value) : [...values, value];

const titleSegments = (title: string): ReadonlyArray<string> =>
  title
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const moduleFolders = (path: string, title: string): ReadonlyArray<string> => {
  const segments = titleSegments(title);

  if (segments.length > 1) {
    return segments.slice(0, -1);
  }

  const normalized = path.replaceAll("\\", "/");
  const srcIndex = normalized.lastIndexOf("/src/");
  const relative = srcIndex >= 0 ? normalized.slice(srcIndex + 5) : normalized;
  const pathSegments = relative.split("/").filter(Boolean);
  const folders = pathSegments.slice(0, Math.max(0, pathSegments.length - 2));
  const lastFolder = folders.at(-1);

  return lastFolder?.toLowerCase() === title.toLowerCase() ? folders.slice(0, -1) : folders;
};

const buildModuleTree = (modules: ReadonlyArray<LoadedPreviewModule>): ReadonlyArray<ModuleTreeNode> => {
  const roots: Array<MutableModuleTreeNode> = [];

  modules.forEach((module, moduleIndex) => {
    let children = roots;
    let key = "";
    const titleParts = titleSegments(module.title);
    const moduleName = titleParts.at(-1) ?? module.title;
    const folders = moduleFolders(module.path, module.title);

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
      name: moduleName,
      key: key ? `${key}/${moduleName}` : moduleName,
      moduleIndex,
      children: [],
    });
  });

  return roots;
};

const matchesSearch = (value: string, search: string): boolean => value.toLowerCase().includes(search);

const filterModuleTree = (
  nodes: ReadonlyArray<ModuleTreeNode>,
  modules: ReadonlyArray<LoadedPreviewModule>,
  search: string,
): ReadonlyArray<ModuleTreeNode> => {
  if (!search) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    if (node.moduleIndex !== undefined) {
      const module = modules[node.moduleIndex];
      const matchesModule = matchesSearch(node.name, search) || (module ? matchesSearch(module.title, search) : false);
      const matchesPreview = module?.previews.some((preview) => matchesSearch(preview.name, search)) ?? false;

      return matchesModule || matchesPreview ? [node] : [];
    }

    const children = filterModuleTree(node.children, modules, search);
    const matchesFolder = matchesSearch(node.name, search);

    return matchesFolder || children.length > 0
      ? [{ ...node, children: matchesFolder ? node.children : children }]
      : [];
  });
};

const controlKey = (moduleIndex: number, previewIndex: number, name: string): string =>
  `${moduleIndex}:${previewIndex}:${name}`;

const setControlValue = (
  values: Model["controlValues"],
  key: string,
  value: PreviewControlValue,
): Model["controlValues"] => [...values.filter((entry) => entry.key !== key), { key, value }];

const getStoredControlValue = (values: Model["controlValues"], key: string): PreviewControlValue | undefined =>
  values.find((entry) => entry.key === key)?.value;

const selectedPreviewKey = (model: Pick<Model, "selectedModuleIndex" | "selectedPreviewIndex">): string =>
  `${model.selectedModuleIndex}:${model.selectedPreviewIndex}`;

const getPreviewModel = (model: Model, preview: Preview, controls: PreviewControlValues): unknown =>
  model.previewModels.find((entry) => entry.key === selectedPreviewKey(model))?.value ?? preview.init?.(controls);

const setPreviewModel = (model: Model, value: unknown): Model => {
  const key = selectedPreviewKey(model);

  return {
    ...model,
    previewModels: [...model.previewModels.filter((entry) => entry.key !== key), { key, value }],
  };
};

const resetPreviewModel = (model: Model): Model => ({
  ...model,
  previewModels: model.previewModels.filter((entry) => entry.key !== selectedPreviewKey(model)),
  replay: { isPlaying: false, scenarioIndex: model.replay.scenarioIndex, stepIndex: 0, delayMs: model.replay.delayMs },
  historyReplayIndex: 0,
  messageLog: [],
  pendingCommands: [],
});

const isShellMessage = (message: unknown): message is typeof ShellMessage.Type =>
  typeof message === "object" &&
  message !== null &&
  "_tag" in message &&
  [
    "SelectedPreview",
    "ToggledTheme",
    "ToggledThemeTokenPanel",
    "ChangedThemeToken",
    "ResetThemeToken",
    "ResetThemeTokens",
    "ToggledSidebar",
    "ToggledModule",
    "ToggledFolder",
    "ChangedTreeSearch",
    "SelectedRightPanelTab",
    "ChangedControl",
    "StartedReplay",
    "AdvancedReplay",
    "StoppedReplay",
    "ResetPreview",
    "SelectedScenario",
    "ChangedReplayDelay",
    "ScrubbedReplay",
    "ScrubbedHistory",
    "GotHistoryMessageListMessage",
    "GotScenarioMessageListMessage",
    "ResolvedCommand",
    "DiscardedCommand",
    "ClearedCommands",
    "StartedRightPanelResize",
    "MovedRightPanelResize",
    "StoppedRightPanelResize",
    "IgnoredUrlRequest",
  ].includes(String(message._tag));

const safeSnapshot = (value: unknown, seen = new WeakSet<object>(), depth = 0): unknown => {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "undefined") {
    return undefined;
  }

  if (typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return `[${typeof value}]`;
  }

  if (typeof value !== "object") {
    return String(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth > 8) {
    return "[MaxDepth]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => safeSnapshot(entry, seen, depth + 1));
  }

  const record = value as Record<string, unknown>;

  if (record._id === "Effect") {
    return { _id: "Effect", op: record.op ?? "Effect" };
  }

  return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, safeSnapshot(entry, seen, depth + 1)]));
};

const safeStringify = (value: unknown): string => JSON.stringify(safeSnapshot(value), null, 2) ?? "undefined";

const controlValuesForPreview = (model: Model, preview: Preview): PreviewControlValues =>
  Object.fromEntries(
    Object.entries(preview.controls ?? {}).map(([name, control]) => {
      const key = controlKey(model.selectedModuleIndex, model.selectedPreviewIndex, name);

      return [name, getStoredControlValue(model.controlValues, key) ?? control.defaultValue];
    }),
  );

const commandName = (command: unknown): string => {
  if (typeof command === "object" && command !== null && "name" in command && typeof command.name === "string") {
    return command.name;
  }

  return "Command";
};

const applyPreviewMessage = (
  model: Model,
  preview: Preview | undefined,
  message: unknown,
  options?: Readonly<{ recordHistory?: boolean; recordCommands?: boolean }>,
): Model => {
  if (!preview?.update) {
    return model;
  }

  const controls = controlValuesForPreview(model, preview);
  const currentPreviewModel = getPreviewModel(model, preview, controls);
  const result = preview.update(currentPreviewModel, message);
  const nextPreviewModel = Array.isArray(result) ? result[0] : result;
  const commands: ReadonlyArray<unknown> = Array.isArray(result) ? result[1] : [];

  const nextModel = setPreviewModel(model, nextPreviewModel);
  const modelWithCommands =
    options?.recordCommands === false || commands.length === 0
      ? nextModel
      : {
          ...nextModel,
          nextPendingCommandId: model.nextPendingCommandId + commands.length,
          pendingCommands: [
            ...model.pendingCommands,
            ...commands.map((command, index) => ({
              id: model.nextPendingCommandId + index,
              name: commandName(command),
              command: safeSnapshot(command),
              sourceModel: safeSnapshot(currentPreviewModel),
              sourceMessage: safeSnapshot(message),
            })),
          ].slice(-25),
        };

  if (options?.recordHistory === false) {
    return modelWithCommands;
  }

  const messageLog = [...model.messageLog.slice(0, model.historyReplayIndex), message].slice(-50);

  return {
    ...modelWithCommands,
    historyReplayIndex: messageLog.length,
    messageLog,
  };
};

const isPreviewReplayStep = (entry: PreviewReplayEntry): entry is PreviewReplayStep =>
  typeof entry === "object" && entry !== null && "type" in entry && entry.type === "message" && "message" in entry;

const normalizeReplayStep = <Message>(entry: PreviewReplayEntry<Message>): PreviewReplayStep<Message> =>
  isPreviewReplayStep(entry) ? entry : { type: "message", message: entry };

const selectedScenario = (preview: Preview | undefined, scenarioIndex: number): PreviewScenario | undefined =>
  preview?.scenarios?.[Math.max(0, Math.min(scenarioIndex, (preview.scenarios.length || 1) - 1))];

const availableRightPanelTabs = (
  preview: Preview | undefined,
  pendingCommands: ReadonlyArray<unknown> = [],
): ReadonlyArray<RightPanelTab> => [
  ...(preview?.controls && Object.keys(preview.controls).length > 0 ? ["controls" as const] : []),
  ...(preview?.update ? ["history" as const] : []),
  ...(preview?.scenarios?.length ? ["scenarios" as const] : []),
  ...(pendingCommands.length > 0 || (preview?.commandResolutions && Object.keys(preview.commandResolutions).length > 0)
    ? ["commands" as const]
    : []),
  ...(preview?.init || preview?.update ? ["model" as const] : []),
];

const firstAvailableRightPanelTab = (
  preview: Preview | undefined,
  pendingCommands: ReadonlyArray<unknown> = [],
): RightPanelTab => availableRightPanelTabs(preview, pendingCommands)[0] ?? "history";

const normalizeRightPanelTab = (
  preview: Preview | undefined,
  tab: RightPanelTab,
  pendingCommands: ReadonlyArray<unknown> = [],
): RightPanelTab =>
  availableRightPanelTabs(preview, pendingCommands).includes(tab)
    ? tab
    : firstAvailableRightPanelTab(preview, pendingCommands);

const applyReplaySteps = (model: Model, preview: Preview | undefined, stepCount: number): Model => {
  const scenario = selectedScenario(preview, model.replay.scenarioIndex);

  if (!scenario?.steps.length) {
    return resetPreviewModel(model);
  }

  const resetModel = resetPreviewModel(model);
  const boundedStepCount = Math.max(0, Math.min(stepCount, scenario.steps.length));

  return scenario.steps.slice(0, boundedStepCount).reduce<Model>((currentModel, entry) => {
    const step = normalizeReplayStep(entry);

    return applyPreviewMessage(currentModel, preview, step.message, { recordHistory: false, recordCommands: false });
  }, resetModel);
};

const createUpdate =
  (config: PreviewAppConfig) =>
  (model: Model, message: Message): readonly [Model, ReadonlyArray<Command.Command<Message>>] => {
    const selectedModule = config.modules[model.selectedModuleIndex] ?? config.modules[0];
    const selectedPreview = selectedModule?.previews[model.selectedPreviewIndex] ?? selectedModule?.previews[0];
    const scenario = selectedScenario(selectedPreview, model.replay.scenarioIndex);

    if (!isShellMessage(message)) {
      return [applyPreviewMessage(model, selectedPreview, message), []];
    }

    switch (message._tag) {
      case "SelectedPreview":
        const nextModule = config.modules[message.moduleIndex] ?? config.modules[0];
        const nextPreview = nextModule?.previews[message.previewIndex] ?? nextModule?.previews[0];
        pinSelectedPreviewToLocation(nextModule, nextPreview);

        return [
          {
            ...model,
            selectedModuleIndex: message.moduleIndex,
            selectedPreviewIndex: message.previewIndex,
            replay: { ...model.replay, isPlaying: false, scenarioIndex: 0, stepIndex: 0 },
            rightPanelTab: firstAvailableRightPanelTab(nextPreview),
            historyReplayIndex: 0,
            messageLog: [],
            pendingCommands: [],
          },
          [],
        ];
      case "ToggledTheme":
        return [{ ...model, theme: model.theme === "light" ? "dark" : "light" }, []];
      case "ToggledThemeTokenPanel":
        return [{ ...model, isThemeTokenPanelOpen: !model.isThemeTokenPanelOpen }, []];
      case "ChangedThemeToken":
        switch (message.key) {
          case "accent":
            return [{ ...model, themeAccentColor: message.value }, []];
          case "gray":
            return [{ ...model, themeGrayColor: message.value }, []];
          case "radius":
            return [{ ...model, themeRadius: message.value }, []];
          case "scale":
            return [{ ...model, themeScale: message.value }, []];
          case "spacing":
            return [{ ...model, themeSpacing: message.value }, []];
          case "appearance":
            return [{ ...model, theme: message.value === "dark" ? "dark" : "light" }, []];
          case "panelBackground":
            return [{ ...model, themePanelBackground: message.value === "translucent" ? "translucent" : "solid" }, []];
          default:
            return [model, []];
        }
      case "ResetThemeToken":
        return [model, []];
      case "ResetThemeTokens":
        return [
          {
            ...model,
            themeAccentColor: "blue",
            themeGrayColor: "slate",
            themeRadius: "medium",
            themeScale: "100%",
            themeSpacing: "Comfortable",
            themePanelBackground: "solid",
          },
          [],
        ];
      case "ToggledSidebar":
        return [{ ...model, isSidebarCollapsed: !model.isSidebarCollapsed }, []];
      case "ToggledModule":
        return [{ ...model, collapsedModules: toggleNumber(model.collapsedModules, message.moduleIndex) }, []];
      case "ToggledFolder":
        return [{ ...model, collapsedFolders: toggleString(model.collapsedFolders, message.key) }, []];
      case "ChangedTreeSearch":
        return [{ ...model, treeSearch: message.value }, []];
      case "SelectedRightPanelTab":
        return [
          { ...model, rightPanelTab: normalizeRightPanelTab(selectedPreview, message.tab, model.pendingCommands) },
          [],
        ];
      case "ChangedControl":
        return [{ ...model, controlValues: setControlValue(model.controlValues, message.key, message.value) }, []];
      case "StartedReplay":
        if (!scenario?.steps.length) {
          return [model, []];
        }

        return [
          { ...model, replay: { ...model.replay, isPlaying: true, stepIndex: 0 } },
          [advanceReplayAfter(model.replay.delayMs)],
        ];
      case "AdvancedReplay": {
        if (!model.replay.isPlaying) {
          return [model, []];
        }

        const entry = scenario?.steps[model.replay.stepIndex];

        if (!selectedPreview || !scenario || !entry) {
          return [{ ...model, replay: { ...model.replay, isPlaying: false, stepIndex: 0 } }, []];
        }

        const step = normalizeReplayStep(entry);
        const modelAfterStep = applyPreviewMessage(model, selectedPreview, step.message, {
          recordHistory: false,
          recordCommands: false,
        });
        const nextStepIndex = model.replay.stepIndex + 1;
        const nextEntry = scenario.steps[nextStepIndex];
        const nextStep = nextEntry ? normalizeReplayStep(nextEntry) : undefined;

        return [
          {
            ...modelAfterStep,
            replay: { ...model.replay, isPlaying: Boolean(nextStep), stepIndex: nextStepIndex },
          },
          nextStep ? [advanceReplayAfter(model.replay.delayMs)] : [],
        ];
      }
      case "StoppedReplay":
        return [{ ...model, replay: { ...model.replay, isPlaying: false } }, []];
      case "ResetPreview":
        return [resetPreviewModel(model), []];
      case "SelectedScenario":
        return [
          {
            ...resetPreviewModel(model),
            replay: {
              ...model.replay,
              isPlaying: false,
              scenarioIndex: Math.max(
                0,
                Math.min(message.scenarioIndex, (selectedPreview?.scenarios?.length ?? 1) - 1),
              ),
              stepIndex: 0,
            },
            rightPanelTab: "scenarios",
          },
          [],
        ];
      case "ChangedReplayDelay":
        return [{ ...model, replay: { ...model.replay, delayMs: Math.max(0, message.delayMs) } }, []];
      case "ScrubbedReplay": {
        const stepIndex = Math.max(0, Math.min(message.stepIndex, scenario?.steps.length ?? 0));
        const scrubbedModel = applyReplaySteps(model, selectedPreview, stepIndex);

        return [
          {
            ...scrubbedModel,
            rightPanelTab: "scenarios",
            replay: { ...model.replay, isPlaying: false, stepIndex },
            historyReplayIndex: model.historyReplayIndex,
            messageLog: model.messageLog,
          },
          [],
        ];
      }
      case "ScrubbedHistory": {
        const stepIndex = Math.max(0, Math.min(message.stepIndex, model.messageLog.length));
        const historyMessages = model.messageLog;
        const scrubbedModel = historyMessages.slice(0, stepIndex).reduce<Model>(
          (currentModel, historyMessage) =>
            applyPreviewMessage(currentModel, selectedPreview, historyMessage, {
              recordHistory: false,
              recordCommands: false,
            }),
          resetPreviewModel(model),
        );

        return [
          {
            ...scrubbedModel,
            rightPanelTab: "history",
            historyReplayIndex: stepIndex,
            messageLog: historyMessages,
          },
          [],
        ];
      }
      case "GotHistoryMessageListMessage": {
        const [historyMessageList, commands] = Ui.VirtualList.update(model.historyMessageList, message.message);

        return [
          { ...model, historyMessageList },
          commands.map(Command.mapEffect(Effect.map((message) => GotHistoryMessageListMessage({ message })))),
        ];
      }
      case "GotScenarioMessageListMessage": {
        const [scenarioMessageList, commands] = Ui.VirtualList.update(model.scenarioMessageList, message.message);

        return [
          { ...model, scenarioMessageList },
          commands.map(Command.mapEffect(Effect.map((message) => GotScenarioMessageListMessage({ message })))),
        ];
      }
      case "ResolvedCommand": {
        const pendingCommand = model.pendingCommands.find((command) => command.id === message.id);
        const resolution = pendingCommand
          ? selectedPreview?.commandResolutions?.[pendingCommand.name]?.[message.resolutionIndex]
          : undefined;

        if (!selectedPreview || !pendingCommand || !resolution) {
          return [model, []];
        }

        const modelWithoutCommand = {
          ...model,
          pendingCommands: model.pendingCommands.filter((command) => command.id !== pendingCommand.id),
        };
        const resolutionMessage = resolution.message({
          model: getPreviewModel(model, selectedPreview, controlValuesForPreview(model, selectedPreview)),
          sourceModel: pendingCommand.sourceModel,
          sourceMessage: pendingCommand.sourceMessage,
          command: pendingCommand.command,
        });

        return [applyPreviewMessage(modelWithoutCommand, selectedPreview, resolutionMessage), []];
      }
      case "DiscardedCommand":
        return [
          { ...model, pendingCommands: model.pendingCommands.filter((command) => command.id !== message.id) },
          [],
        ];
      case "ClearedCommands":
        return [{ ...model, pendingCommands: [] }, []];
      case "StartedRightPanelResize":
        return [{ ...model, isResizingRightPanel: true }, []];
      case "MovedRightPanelResize":
        return [{ ...model, rightPanelWidthPx: inspectorWidthFromClientX(message.clientX) }, []];
      case "StoppedRightPanelResize":
        return [{ ...model, isResizingRightPanel: false }, []];
      case "IgnoredUrlRequest":
        return [model, []];
    }

    return [model, []];
  };

const previewId = (moduleIndex: number, previewIndex: number): string => `preview-${moduleIndex}-${previewIndex}`;

const formatReplayValue = (value: unknown): string => {
  if (typeof value === "object" && value !== null && "_tag" in value) {
    return String(value._tag);
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  return safeStringify(value);
};

const formatReplayMessage = (message: unknown): string => {
  if (typeof message === "object" && message !== null && "_tag" in message) {
    const entries = Object.entries(message).filter(([key]) => key !== "_tag");
    const details = entries.map(([key, value]) => `${key}=${formatReplayValue(value)}`).join(" · ");

    return details ? `${String(message._tag)} · ${details}` : String(message._tag);
  }

  if (typeof message === "string") {
    return message;
  }

  return safeStringify(message);
};

export const runPreviewApp = (config: PreviewAppConfig): void => {
  const {
    aside,
    button,
    div,
    h1,
    h2,
    h3,
    header,
    input,
    main,
    nav,
    option,
    p,
    section,
    select,
    span,
    Class,
    Disabled,
    Id,
    Max,
    Min,
    OnChange,
    OnClick,
    OnInput,
    OnPointerDown,
    Step,
    Style,
    Type,
    Value,
  } = html<Message>();
  const moduleTree = buildModuleTree(config.modules);
  const init = createInit(moduleTree, config.modules);
  const update = createUpdate(config);
  let activePreview: Preview | undefined;
  const subscriptions = Subscription.makeSubscriptions(SubscriptionDeps)<Model, Message>({
    sliderDrag: {
      modelToDependencies: sliderDragDepsFromModel,
      dependenciesToStream: ({ active, id, min, max }) => {
        if (!active) {
          return Stream.empty;
        }

        const pointerMoves = Stream.fromEventListener(document, "pointermove").pipe(
          Stream.map((event) => {
            const element = sliderTrackElement(id);

            return element
              ? MovedDragPointer({ value: valueFromClientX((event as PointerEvent).clientX, element, min, max) })
              : undefined;
          }),
          Stream.filter((message): message is ReturnType<typeof MovedDragPointer> => message !== undefined),
        );
        const pointerUps = Stream.fromEventListener(document, "pointerup").pipe(
          Stream.map(() => ReleasedDragPointer()),
        );

        return Stream.merge(pointerMoves, pointerUps);
      },
    },
    rightPanelResize: {
      modelToDependencies: (model) => ({ active: model.isResizingRightPanel }),
      dependenciesToStream: ({ active }) => {
        if (!active) {
          return Stream.empty;
        }

        const pointerMoves = Stream.fromEventListener(document, "pointermove").pipe(
          Stream.map((event) => MovedRightPanelResize({ clientX: (event as PointerEvent).clientX })),
        );
        const pointerUps = Stream.fromEventListener(document, "pointerup").pipe(
          Stream.map(() => StoppedRightPanelResize()),
        );

        return Stream.merge(pointerMoves, pointerUps);
      },
    },
    historyMessageListEvents: {
      modelToDependencies: (model) =>
        Ui.VirtualList.subscriptions.containerEvents.modelToDependencies(model.historyMessageList),
      dependenciesToStream: (dependencies, readDependencies) =>
        Ui.VirtualList.subscriptions.containerEvents
          .dependenciesToStream(dependencies, readDependencies)
          .pipe(Stream.map((message) => GotHistoryMessageListMessage({ message }))),
    },
    scenarioMessageListEvents: {
      modelToDependencies: (model) =>
        Ui.VirtualList.subscriptions.containerEvents.modelToDependencies(model.scenarioMessageList),
      dependenciesToStream: (dependencies, readDependencies) =>
        Ui.VirtualList.subscriptions.containerEvents
          .dependenciesToStream(dependencies, readDependencies)
          .pipe(Stream.map((message) => GotScenarioMessageListMessage({ message }))),
    },
  });

  const view = (model: Model): Document => {
    const selectedModule = config.modules[model.selectedModuleIndex] ?? config.modules[0];
    const selectedPreview = selectedModule?.previews[model.selectedPreviewIndex] ?? selectedModule?.previews[0];
    activePreview = selectedPreview;
    const selectedControls = selectedPreview?.controls ?? {};
    const controlEntries = Object.entries(selectedControls);
    const controlValues = selectedPreview ? controlValuesForPreview(model, selectedPreview) : {};
    const selectedPreviewModel = selectedPreview ? getPreviewModel(model, selectedPreview, controlValues) : undefined;
    const scenarios = selectedPreview?.scenarios ?? [];
    const currentScenario = selectedScenario(selectedPreview, model.replay.scenarioIndex);
    const replayStepCount = currentScenario?.steps.length ?? 0;
    const historyMessages = model.messageLog;
    const scenarioMessages = currentScenario?.steps.map((entry) => normalizeReplayStep(entry).message) ?? [];
    const rightPanelTabs = availableRightPanelTabs(selectedPreview, model.pendingCommands);
    const isDark = model.theme === "dark";
    const theme = model.theme;
    const treeSearch = model.treeSearch.trim().toLowerCase();
    const visibleModuleTree = filterModuleTree(moduleTree, config.modules, treeSearch);
    const themeScopeClass = isDark ? "dark dark-theme" : "light light-theme";
    const dividerClass = isDark ? "border-neutral-800" : "border-neutral-200";
    const mutedClass = isDark ? "text-neutral-400" : "text-neutral-500";
    const canvasClass = isDark
      ? "grid min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgb(64_64_64)_1px,transparent_0)] bg-[length:20px_20px] p-8"
      : "grid min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgb(212_212_212)_1px,transparent_0)] bg-[length:20px_20px] p-8";
    const contentGridClass =
      rightPanelTabs.length > 0
        ? "grid min-h-0 min-w-0 gap-3 p-3 lg:h-[calc(100vh-3rem)] lg:grid-cols-[minmax(0,1fr)_var(--preview-inspector-width)] lg:p-4"
        : "grid min-h-0 min-w-0 gap-3 p-3 lg:h-[calc(100vh-3rem)] lg:p-4";

    const messageItemClass = isDark
      ? "min-w-0 max-w-full overflow-hidden whitespace-normal break-all rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-left font-mono text-[11px] leading-4 text-neutral-100 [overflow-wrap:anywhere]"
      : "min-w-0 max-w-full overflow-hidden whitespace-normal break-all rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-left font-mono text-[11px] leading-4 text-neutral-900 [overflow-wrap:anywhere]";
    const inactiveMessageItemClass = isDark
      ? "min-w-0 max-w-full overflow-hidden whitespace-normal break-all rounded-md border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-left font-mono text-[11px] leading-4 text-neutral-500 [overflow-wrap:anywhere]"
      : "min-w-0 max-w-full overflow-hidden whitespace-normal break-all rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-left font-mono text-[11px] leading-4 text-neutral-500 [overflow-wrap:anywhere]";
    const clickableMessageClass = isDark
      ? "cursor-pointer hover:border-neutral-600"
      : "cursor-pointer hover:border-neutral-400";

    const renderTreeNodes = (nodes: ReadonlyArray<ModuleTreeNode>, depth: number): ReadonlyArray<Html> =>
      nodes.flatMap((node) => {
        if (node.moduleIndex !== undefined) {
          const module = config.modules[node.moduleIndex];

          if (!module) {
            return [];
          }

          const isModuleCollapsed = treeSearch ? false : model.collapsedModules.includes(node.moduleIndex);
          const isModuleSelected = selectedModule === module;
          const isModuleMatch = treeSearch
            ? matchesSearch(node.name, treeSearch) || matchesSearch(module.title, treeSearch)
            : true;
          const moduleRow = button(
            [
              OnClick(ToggledModule({ moduleIndex: node.moduleIndex })),
              Class(navModuleButtonClass({ theme, selected: isModuleSelected })),
            ],
            [
              span([Class("w-3 text-neutral-400")], [isModuleCollapsed ? "›" : "⌄"]),
              span([Class("truncate")], [node.name]),
            ],
          );
          const previews = isModuleCollapsed
            ? []
            : module.previews.flatMap((preview, previewIndex) => {
                if (treeSearch && !isModuleMatch && !matchesSearch(preview.name, treeSearch)) {
                  return [];
                }

                const isSelected = selectedModule === module && selectedPreview === preview;

                return [
                  button(
                    [
                      OnClick(SelectedPreview({ moduleIndex: node.moduleIndex!, previewIndex })),
                      Class(navPreviewButtonClass({ theme, selected: isSelected })),
                    ],
                    [preview.name],
                  ),
                ];
              });

          return [div([Class("grid gap-px")], [moduleRow, ...previews])];
        }

        const isCollapsed = treeSearch ? false : model.collapsedFolders.includes(node.key);

        return [
          div(
            [Class("grid gap-px")],
            [
              button(
                [
                  OnClick(ToggledFolder({ key: node.key })),
                  Class(
                    `flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px] ${isDark ? "text-neutral-100 hover:bg-neutral-900" : "text-neutral-950 hover:bg-neutral-100"}`,
                  ),
                ],
                [
                  span([Class("w-3 text-neutral-400")], [isCollapsed ? "›" : "⌄"]),
                  span([Class("truncate")], [node.name]),
                ],
              ),
              ...(isCollapsed
                ? []
                : renderTreeNodes(node.children, depth + 1).map((child) =>
                    div([Class(depth > 0 ? "ml-4" : "ml-3")], [child]),
                  )),
            ],
          ),
        ];
      });

    const inputClass = isDark
      ? "h-8 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 text-[13px] text-neutral-50 outline-none ring-offset-neutral-950 focus:ring-2 focus:ring-neutral-700"
      : "h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-950 outline-none ring-offset-white focus:ring-2 focus:ring-neutral-300";
    const themeTokenPanelClass = isDark
      ? "absolute right-0 top-9 z-50 grid w-[min(28rem,calc(100vw-2rem))] gap-4 rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-50 shadow-2xl"
      : "absolute right-0 top-9 z-50 grid w-[min(28rem,calc(100vw-2rem))] gap-4 rounded-xl border border-neutral-200 bg-white p-4 text-neutral-950 shadow-2xl";
    const optionButtonClass = (selected: boolean): string =>
      `rounded-md border px-3 py-2 text-sm font-medium ${selected ? "border-current ring-2 ring-current" : isDark ? "border-neutral-800 bg-neutral-950 text-neutral-300" : "border-neutral-200 bg-white text-neutral-700"}`;
    const swatchClass = (selected: boolean): string =>
      `size-7 rounded-full border ${selected ? "border-current ring-2 ring-current ring-offset-2" : "border-transparent"} ${isDark ? "ring-offset-neutral-950" : "ring-offset-white"}`;
    const radiusCardClass = (selected: boolean): string =>
      `grid gap-1.5 rounded-md border p-2 text-center text-xs ${selected ? "border-current ring-2 ring-current" : isDark ? "border-neutral-800 text-neutral-400" : "border-neutral-200 text-neutral-500"}`;
    const themeTokenOverrideCount = [
      model.themeAccentColor !== "blue",
      model.themeGrayColor !== "slate",
      model.themeRadius !== "medium",
      model.themeScale !== "100%",
      model.themeSpacing !== "Comfortable",
      model.themePanelBackground !== "solid",
    ].filter(Boolean).length;
    const themeTokenOverrideStyles = themePlaygroundStyle(model);
    const themeTokenPanel = model.isThemeTokenPanelOpen
      ? div(
          [Class(themeTokenPanelClass)],
          [
            div(
              [Class("flex items-start justify-between gap-3")],
              [
                div(
                  [Class("grid gap-0.5")],
                  [
                    h3([Class("text-2xl font-semibold tracking-tight")], ["Theme"]),
                    p(
                      [Class(`m-0 text-sm ${mutedClass}`)],
                      ["Radix-powered overrides apply only to the preview canvas."],
                    ),
                  ],
                ),
                button(
                  [OnClick(ResetThemeTokens()), Class(`${toolbarButtonClass({ theme })} size-9 px-0 text-base`)],
                  ["T"],
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Accent color"]),
                div(
                  [Class("flex flex-wrap gap-2.5")],
                  accentThemeOptions.map((color) =>
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "accent", value: color })),
                        Style({ background: `var(--${color}-9)` }),
                        Class(swatchClass(model.themeAccentColor === color)),
                      ],
                      [],
                    ),
                  ),
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Gray color"]),
                div(
                  [Class("flex flex-wrap gap-2.5")],
                  grayThemeOptions.map((color) =>
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "gray", value: color })),
                        Style({ background: `var(--${color}-9)` }),
                        Class(swatchClass(model.themeGrayColor === color)),
                      ],
                      [],
                    ),
                  ),
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Appearance"]),
                div(
                  [Class("grid grid-cols-2 gap-2.5")],
                  [
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "appearance", value: "light" })),
                        Class(optionButtonClass(!isDark)),
                      ],
                      ["☼  Light"],
                    ),
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "appearance", value: "dark" })),
                        Class(optionButtonClass(isDark)),
                      ],
                      ["☾  Dark"],
                    ),
                  ],
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Radius"]),
                div(
                  [Class("grid grid-cols-5 gap-2.5")],
                  radiusThemeOptions.map((option) =>
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "radius", value: option.value })),
                        Class(radiusCardClass(model.themeRadius === option.value)),
                      ],
                      [
                        div(
                          [Class("grid h-12 place-items-center rounded bg-primary/20")],
                          [
                            div(
                              [
                                Class("size-7 border-l-4 border-t-4 border-primary"),
                                Style({ borderTopLeftRadius: option.radius }),
                              ],
                              [],
                            ),
                          ],
                        ),
                        option.label,
                      ],
                    ),
                  ),
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Scaling"]),
                div(
                  [Class("grid grid-cols-5 gap-2.5")],
                  scaleThemeOptions.map((scale) =>
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "scale", value: scale })),
                        Class(optionButtonClass(model.themeScale === scale)),
                      ],
                      [scale],
                    ),
                  ),
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Spacing"]),
                div(
                  [Class("grid grid-cols-5 gap-2.5")],
                  spacingThemeOptions.map((spacing) =>
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "spacing", value: spacing })),
                        Class(optionButtonClass(model.themeSpacing === spacing)),
                      ],
                      [spacing],
                    ),
                  ),
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                h3([Class("text-base font-medium")], ["Panel background"]),
                div(
                  [Class("grid grid-cols-2 gap-2.5")],
                  [
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "panelBackground", value: "solid" })),
                        Class(optionButtonClass(model.themePanelBackground === "solid")),
                      ],
                      ["○  Solid"],
                    ),
                    button(
                      [
                        OnClick(ChangedThemeToken({ key: "panelBackground", value: "translucent" })),
                        Class(optionButtonClass(model.themePanelBackground === "translucent")),
                      ],
                      ["◐  Translucent"],
                    ),
                  ],
                ),
              ],
            ),
            button(
              [
                OnClick(ResetThemeTokens()),
                Class("rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"),
              ],
              ["Reset Theme"],
            ),
          ],
        )
      : div([], []);
    const inspectorSectionClass = isDark
      ? "grid min-w-0 gap-3 rounded-md border border-neutral-800 bg-neutral-950 p-3"
      : "grid min-w-0 gap-3 rounded-md border border-neutral-200 bg-white p-3";
    const controlsSection =
      controlEntries.length === 0
        ? []
        : [
            div(
              [Class(inspectorSectionClass)],
              [
                h2([Class("truncate text-[13px] font-semibold")], ["Controls"]),
                ...controlEntries.map(([name, control]) => {
                  const key = controlKey(model.selectedModuleIndex, model.selectedPreviewIndex, name);
                  const value = getStoredControlValue(model.controlValues, key) ?? control.defaultValue;
                  const label = name.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());

                  return div(
                    [Class("grid gap-1")],
                    [
                      div([Class(`text-xs font-medium ${mutedClass}`)], [label]),
                      control.type === "boolean"
                        ? button(
                            [
                              OnClick(ChangedControl({ key, value: !Boolean(value) })),
                              Class(booleanControlButtonClass({ theme, checked: Boolean(value) })),
                            ],
                            [
                              span([], [Boolean(value) ? "True" : "False"]),
                              span(
                                [Class(Boolean(value) ? "text-emerald-500" : mutedClass)],
                                [Boolean(value) ? "●" : "○"],
                              ),
                            ],
                          )
                        : control.type === "select"
                          ? select(
                              [
                                Value(String(value)),
                                OnChange((nextValue) => ChangedControl({ key, value: nextValue })),
                                Class(inputClass),
                              ],
                              control.options.map((choice) => option([Value(choice)], [choice])),
                            )
                          : input([
                              Type(control.type === "number" ? "number" : "text"),
                              Value(String(value)),
                              OnInput((nextValue) =>
                                ChangedControl({
                                  key,
                                  value: control.type === "number" ? Number(nextValue) : nextValue,
                                }),
                              ),
                              Class(inputClass),
                            ]),
                    ],
                  );
                }),
              ],
            ),
          ];
    const replaySection =
      scenarios.length === 0
        ? []
        : [
            div(
              [Class(inspectorSectionClass)],
              [
                h2([Class("truncate text-[13px] font-semibold")], ["Replay"]),
                ...(scenarios.length > 1
                  ? [
                      select(
                        [
                          Value(String(model.replay.scenarioIndex)),
                          OnChange((nextValue) => SelectedScenario({ scenarioIndex: Number(nextValue) })),
                          Class(inputClass),
                        ],
                        scenarios.map((scenario, scenarioIndex) =>
                          option([Value(String(scenarioIndex))], [scenario.name]),
                        ),
                      ),
                    ]
                  : []),
                div(
                  [Class("grid min-w-0 gap-2 overflow-hidden")],
                  [
                    div(
                      [Class(`flex items-center justify-between text-xs ${mutedClass}`)],
                      [span([], ["0"]), span([], [String(replayStepCount)])],
                    ),
                    input([
                      Type("range"),
                      Min("0"),
                      Max(String(replayStepCount)),
                      Step("1"),
                      Value(String(model.replay.stepIndex)),
                      OnInput((value) => ScrubbedReplay({ stepIndex: Number(value) })),
                      Class(isDark ? "h-2 min-w-0 w-full accent-neutral-50" : "h-2 min-w-0 w-full accent-neutral-950"),
                    ]),
                  ],
                ),
                div(
                  [Class("grid gap-1")],
                  [
                    div([Class(`text-xs font-medium ${mutedClass}`)], ["Delay"]),
                    input([
                      Type("number"),
                      Min("0"),
                      Step("50"),
                      Value(String(model.replay.delayMs)),
                      OnInput((value) => ChangedReplayDelay({ delayMs: Number(value) })),
                      Class(inputClass),
                    ]),
                  ],
                ),
                div(
                  [Class("grid grid-cols-2 gap-2")],
                  [
                    button(
                      [
                        OnClick(StartedReplay()),
                        Disabled(model.replay.isPlaying),
                        Class(toolbarButtonClass({ theme })),
                      ],
                      ["Play"],
                    ),
                    button(
                      [
                        OnClick(StoppedReplay()),
                        Disabled(!model.replay.isPlaying),
                        Class(toolbarButtonClass({ theme })),
                      ],
                      ["Pause"],
                    ),
                  ],
                ),
                ...(scenarioMessages.length === 0
                  ? [p([Class(`m-0 text-sm ${mutedClass}`)], ["No messages in this scenario."])]
                  : [
                      Ui.VirtualList.view({
                        model: model.scenarioMessageList,
                        items: scenarioMessages,
                        itemToKey: (_message, index) => String(index),
                        itemToView: (message, messageIndex) =>
                          button(
                            [
                              OnClick(ScrubbedReplay({ stepIndex: messageIndex + 1 })),
                              Class(
                                `${messageIndex < model.replay.stepIndex ? messageItemClass : inactiveMessageItemClass} ${clickableMessageClass}`,
                              ),
                            ],
                            [formatReplayMessage(message)],
                          ),
                        itemToRowHeightPx: (message) => (formatReplayMessage(message).length > 42 ? 64 : 40),
                        className: "h-56 min-h-0 w-full pr-1",
                      }),
                    ]),
              ],
            ),
          ];
    const historySection = selectedPreview?.update
      ? [
          div(
            [Class(inspectorSectionClass)],
            [
              h2([Class("truncate text-[13px] font-semibold")], ["History"]),
              p(
                [Class(`m-0 text-sm ${mutedClass}`)],
                [
                  historyMessages.length > 0
                    ? `History state ${model.historyReplayIndex} / ${historyMessages.length}`
                    : "Interact with the component to record history.",
                ],
              ),
              ...(historyMessages.length > 0
                ? [
                    input([
                      Type("range"),
                      Min("0"),
                      Max(String(historyMessages.length)),
                      Step("1"),
                      Value(String(model.historyReplayIndex)),
                      OnInput((value) => ScrubbedHistory({ stepIndex: Number(value) })),
                      Class(isDark ? "h-2 min-w-0 w-full accent-neutral-50" : "h-2 min-w-0 w-full accent-neutral-950"),
                    ]),
                    button([OnClick(ResetPreview()), Class(toolbarButtonClass({ theme }))], ["Clear history"]),
                    Ui.VirtualList.view({
                      model: model.historyMessageList,
                      items: historyMessages,
                      itemToKey: (_message, index) => String(index),
                      itemToView: (message, messageIndex) =>
                        button(
                          [
                            OnClick(ScrubbedHistory({ stepIndex: messageIndex + 1 })),
                            Class(`${messageItemClass} ${clickableMessageClass}`),
                          ],
                          [formatReplayMessage(message)],
                        ),
                      itemToRowHeightPx: (message) => (formatReplayMessage(message).length > 42 ? 64 : 40),
                      className: "h-56 min-h-0 w-full pr-1",
                    }),
                  ]
                : []),
            ],
          ),
        ]
      : [];
    const commandsSection =
      model.pendingCommands.length > 0 ||
      (selectedPreview?.commandResolutions && Object.keys(selectedPreview.commandResolutions).length > 0)
        ? [
            div(
              [Class(inspectorSectionClass)],
              [
                div(
                  [Class("flex items-center justify-between gap-3")],
                  [
                    h2([Class("truncate text-[13px] font-semibold")], ["Commands"]),
                    ...(model.pendingCommands.length > 0
                      ? [
                          button(
                            [OnClick(ClearedCommands()), Class(`${toolbarButtonClass({ theme })} shrink-0`)],
                            ["Clear all"],
                          ),
                        ]
                      : []),
                  ],
                ),
                p(
                  [Class(`m-0 text-sm ${mutedClass}`)],
                  [
                    model.pendingCommands.length > 0
                      ? `${model.pendingCommands.length} pending command${model.pendingCommands.length === 1 ? "" : "s"}.`
                      : "Interact with the component to create commands.",
                  ],
                ),
                ...model.pendingCommands.map((pendingCommand) => {
                  const resolutions = selectedPreview?.commandResolutions?.[pendingCommand.name] ?? [];

                  return div(
                    [
                      Class(
                        isDark
                          ? "grid gap-3 rounded-md border border-neutral-800 p-3"
                          : "grid gap-3 rounded-md border border-neutral-200 p-3",
                      ),
                    ],
                    [
                      div(
                        [Class("flex min-w-0 items-start justify-between gap-3")],
                        [
                          h3([Class("truncate text-xs font-semibold")], [pendingCommand.name]),
                          button(
                            [
                              OnClick(DiscardedCommand({ id: pendingCommand.id })),
                              Class(`${toolbarButtonClass({ theme })} shrink-0`),
                            ],
                            ["Discard"],
                          ),
                        ],
                      ),
                      p(
                        [Class(`m-0 break-all font-mono text-xs ${mutedClass}`)],
                        [formatReplayMessage(pendingCommand.sourceMessage)],
                      ),
                      ...(resolutions.length === 0
                        ? [p([Class(`m-0 text-sm ${mutedClass}`)], ["No resolutions configured for this command."])]
                        : resolutions.map((resolution, resolutionIndex) =>
                            button(
                              [
                                OnClick(ResolvedCommand({ id: pendingCommand.id, resolutionIndex })),
                                Class(toolbarButtonClass({ theme })),
                              ],
                              [resolution.label],
                            ),
                          )),
                    ],
                  );
                }),
              ],
            ),
          ]
        : [];
    const modelSection =
      selectedPreview?.init || selectedPreview?.update
        ? [
            div(
              [Class(inspectorSectionClass)],
              [
                h2([Class("truncate text-[13px] font-semibold")], ["Model"]),
                div(
                  [
                    Class(
                      isDark
                        ? "max-h-96 min-w-0 whitespace-pre-wrap overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs leading-5 text-neutral-100"
                        : "max-h-96 min-w-0 whitespace-pre-wrap overflow-auto rounded-md border border-neutral-200 bg-white p-3 font-mono text-xs leading-5 text-neutral-900",
                    ),
                  ],
                  [safeStringify(selectedPreviewModel)],
                ),
              ],
            ),
          ]
        : [];
    const controlsPanel =
      rightPanelTabs.length === 0
        ? []
        : [
            aside(
              [Class(`relative min-w-0 border-t lg:border-l lg:border-t-0 ${controlsPanelClass({ theme })}`)],
              [
                div(
                  [
                    OnPointerDown((_pointerType, _button, _screenX, _screenY, _timeStamp, _clientX, _clientY) =>
                      Option.some(StartedRightPanelResize()),
                    ),
                    Class(
                      `absolute -left-2 top-0 hidden h-full w-4 cursor-col-resize touch-none lg:block ${model.isResizingRightPanel ? "bg-neutral-400/20" : ""}`,
                    ),
                  ],
                  [],
                ),
                div(
                  [Class(`flex h-12 items-center justify-between border-b px-3 ${dividerClass}`)],
                  [
                    h2([Class("truncate text-sm font-semibold")], ["Inspector"]),
                    span([Class(`text-xs ${mutedClass}`)], [`${Math.round(model.rightPanelWidthPx)}px`]),
                  ],
                ),
                div(
                  [Class("grid max-h-[calc(100vh-7rem)] min-w-0 gap-3 overflow-auto p-3")],
                  [...controlsSection, ...replaySection, ...historySection, ...commandsSection, ...modelSection],
                ),
              ],
            ),
          ];

    return {
      title: config.title,
      body: main(
        [Class("min-h-screen bg-neutral-950 text-neutral-950")],
        [
          div(
            [
              Class(
                `${themeScopeClass} ${shellClass({ theme, sidebar: model.isSidebarCollapsed ? "collapsed" : "expanded" })}`,
              ),
            ],
            [
              aside(
                [Class(sidebarClass({ theme }))],
                [
                  div(
                    [Class(`flex h-12 items-center gap-2 border-b px-2.5 ${dividerClass}`)],
                    [
                      div(
                        [
                          Class(
                            isDark
                              ? "grid size-7 shrink-0 place-items-center rounded-md bg-white text-xs font-semibold text-neutral-950"
                              : "grid size-7 shrink-0 place-items-center rounded-md bg-neutral-950 text-xs font-semibold text-white",
                          ),
                        ],
                        ["F"],
                      ),
                      div(
                        [Class(model.isSidebarCollapsed ? "hidden" : "min-w-0")],
                        [h1([Class("truncate text-sm font-semibold tracking-tight")], [config.title])],
                      ),
                      button(
                        [OnClick(ToggledSidebar()), Class(`ml-auto shrink-0 ${compactButtonClass({ theme })}`)],
                        [model.isSidebarCollapsed ? "›" : "‹"],
                      ),
                    ],
                  ),
                  ...(model.isSidebarCollapsed
                    ? []
                    : [
                        div(
                          [Class(`border-b p-2 ${dividerClass}`)],
                          [
                            input([
                              Type("search"),
                              Value(model.treeSearch),
                              OnInput((value) => ChangedTreeSearch({ value })),
                              Class(
                                `h-8 w-full rounded-md border px-2.5 text-[13px] outline-none ${isDark ? "border-neutral-800 bg-neutral-900 text-neutral-50 ring-offset-neutral-950 focus:ring-2 focus:ring-neutral-700" : "border-neutral-200 bg-white text-neutral-950 ring-offset-white focus:ring-2 focus:ring-neutral-300"}`,
                              ),
                            ]),
                          ],
                        ),
                      ]),
                  nav(
                    [
                      Class(
                        model.isSidebarCollapsed
                          ? "grid max-h-[40vh] gap-1 overflow-auto p-2 lg:max-h-[calc(100vh-3rem)]"
                          : "grid max-h-[40vh] gap-px overflow-auto p-2 lg:max-h-[calc(100vh-3rem)]",
                      ),
                    ],
                    model.isSidebarCollapsed
                      ? config.modules.map((module, moduleIndex) => {
                          const isModuleSelected = selectedModule === module;

                          return button(
                            [
                              OnClick(SelectedPreview({ moduleIndex, previewIndex: 0 })),
                              Class(collapsedModuleButtonClass({ theme, selected: isModuleSelected })),
                            ],
                            [module.title.slice(0, 1)],
                          );
                        })
                      : renderTreeNodes(visibleModuleTree, 0),
                  ),
                ],
              ),
              section(
                [Class("grid min-w-0 grid-rows-[auto_1fr]")],
                [
                  header(
                    [
                      Class(
                        `sticky top-0 z-10 flex h-12 items-center justify-between border-b px-3 backdrop-blur ${dividerClass} ${isDark ? "bg-neutral-950/90" : "bg-white/90"}`,
                      ),
                    ],
                    [
                      div(
                        [Class("min-w-0")],
                        [h2([Class("truncate text-sm font-semibold")], [selectedModule?.title ?? "No previews"])],
                      ),
                      div(
                        [Class("relative flex items-center gap-2")],
                        [
                          button(
                            [OnClick(ToggledThemeTokenPanel()), Class(toolbarButtonClass({ theme }))],
                            [`Tokens${themeTokenOverrideCount > 0 ? ` (${themeTokenOverrideCount})` : ""}`],
                          ),
                          themeTokenPanel,
                        ],
                      ),
                    ],
                  ),
                  div(
                    [Class(contentGridClass), Style({ "--preview-inspector-width": `${model.rightPanelWidthPx}px` })],
                    [
                      section(
                        [Class(`${panelClass({ theme })} flex min-h-0 flex-col`)],
                        [
                          div(
                            [Class(`flex h-12 items-center justify-between border-b px-3 ${dividerClass}`)],
                            [
                              div(
                                [Class("grid gap-0.5")],
                                [
                                  h3([Class("text-sm font-medium")], [selectedPreview?.name ?? "No preview selected"]),
                                  p(
                                    [Class(`m-0 text-xs ${mutedClass}`)],
                                    [
                                      scenarios.length > 0
                                        ? `${scenarios.length} scenario${scenarios.length === 1 ? "" : "s"} available`
                                        : "Isolated canvas",
                                    ],
                                  ),
                                ],
                              ),
                            ],
                          ),
                          div(
                            [
                              Id(previewId(model.selectedModuleIndex, model.selectedPreviewIndex)),
                              Style(themeTokenOverrideStyles),
                              Class(`${themeScopeClass} ${canvasClass}`),
                            ],
                            [
                              div(
                                [
                                  Style(themeTokenOverrideStyles),
                                  Class(`${themeScopeClass} ${cardClass({ theme })} m-auto overflow-visible`),
                                ],
                                [
                                  selectedPreview
                                    ? selectedPreview.init
                                      ? (
                                          selectedPreview.view as (
                                            previewModel: unknown,
                                            controls: PreviewControlValues,
                                          ) => Html
                                        )(selectedPreviewModel, controlValues)
                                      : (selectedPreview.view as (controls: PreviewControlValues) => Html)(
                                          controlValues,
                                        )
                                    : div([], []),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                      ...controlsPanel,
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    };
  };

  const program = Runtime.makeProgram({
    Model,
    init,
    update,
    view,
    subscriptions,
    container: config.root ?? document.getElementById("root")!,
    routing: {
      onUrlRequest: (request: typeof Runtime.UrlRequest.Type) =>
        activePreview?.routing?.onUrlRequest?.(request) ?? IgnoredUrlRequest(),
      onUrlChange: () => IgnoredUrlRequest(),
    },
    devTools: { Message, banner: config.title },
  });

  Runtime.run(program);
};
