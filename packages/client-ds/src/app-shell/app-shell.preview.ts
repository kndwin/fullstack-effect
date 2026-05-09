import { Effect, Option, Schema } from "effect";
import { Command } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Popover, PopoverMessage, PopoverModel, initPopover, updatePopover } from "../popover/popover.view";
import {
  AppShell,
  AppShellAside,
  AppShellHeader,
  AppShellMain,
  AppShellRail,
  AppShellSidebar,
  AppShellTrigger,
} from "./app-shell.view";

const ToggledAppShellSidebar = m("ToggledAppShellSidebar");
const ToggledAppShellAside = m("ToggledAppShellAside");
const StartedAppShellSidebarResize = m("StartedAppShellSidebarResize", {
  screenX: Schema.Number,
});
const MovedAppShellSidebarResize = m("MovedAppShellSidebarResize", {
  screenX: Schema.Number,
});
const StoppedAppShellSidebarResize = m("StoppedAppShellSidebarResize");
const GotUserPopoverMessage = m("GotUserPopoverMessage", { message: PopoverMessage });

const railWidthPx = 48;
const asideWidthPx = 240;
const sidebarWidthMinPx = 176;
const sidebarWidthMaxPx = 320;
const sidebarWidthDefaultPx = 220;

const clampSidebarWidth = (widthPx: number): number =>
  Math.max(sidebarWidthMinPx, Math.min(sidebarWidthMaxPx, Math.round(widthPx)));

const AppShellPreviewModel = Schema.Struct({
  isAsideCollapsed: Schema.Boolean,
  isSidebarCollapsed: Schema.Boolean,
  isResizingSidebar: Schema.Boolean,
  resizeStartScreenX: Schema.Number,
  resizeStartWidthPx: Schema.Number,
  sidebarWidthPx: Schema.Number,
  userPopover: PopoverModel,
});
type AppShellPreviewModel = typeof AppShellPreviewModel.Type;

const AppShellPreviewMessage = Schema.Union([
  ToggledAppShellAside,
  ToggledAppShellSidebar,
  StartedAppShellSidebarResize,
  MovedAppShellSidebarResize,
  StoppedAppShellSidebarResize,
  GotUserPopoverMessage,
]);
type AppShellPreviewMessage = typeof AppShellPreviewMessage.Type;

const initialModel = (): AppShellPreviewModel => ({
  isAsideCollapsed: false,
  isSidebarCollapsed: false,
  isResizingSidebar: false,
  resizeStartScreenX: 0,
  resizeStartWidthPx: sidebarWidthDefaultPx,
  sidebarWidthPx: sidebarWidthDefaultPx,
  userPopover: initPopover({ id: "app-shell-preview-user-popover" }),
});

const update = (model: AppShellPreviewModel, message: AppShellPreviewMessage) => {
  switch (message._tag) {
    case "ToggledAppShellSidebar":
      return [{ ...model, isSidebarCollapsed: !model.isSidebarCollapsed, isResizingSidebar: false }, []] as const;
    case "ToggledAppShellAside":
      return [{ ...model, isAsideCollapsed: !model.isAsideCollapsed }, []] as const;
    case "StartedAppShellSidebarResize":
      return [
        {
          ...model,
          isResizingSidebar: true,
          resizeStartScreenX: message.screenX,
          resizeStartWidthPx: model.sidebarWidthPx,
        },
        [],
      ] as const;
    case "MovedAppShellSidebarResize":
      return [
        model.isResizingSidebar
          ? {
              ...model,
              sidebarWidthPx: clampSidebarWidth(model.resizeStartWidthPx + message.screenX - model.resizeStartScreenX),
            }
          : model,
        [],
      ] as const;
    case "StoppedAppShellSidebarResize":
      return [{ ...model, isResizingSidebar: false }, []] as const;
    case "GotUserPopoverMessage": {
      const [userPopover, commands] = updatePopover(model.userPopover, message.message);
      return [
        { ...model, userPopover },
        commands.map(Command.mapEffect(Effect.map((message) => GotUserPopoverMessage({ message })))),
      ] as const;
    }
  }
};

const shellGridStyle = (model: AppShellPreviewModel) => ({
  gridTemplateColumns: model.isSidebarCollapsed
    ? `${railWidthPx}px minmax(0,1fr) ${model.isAsideCollapsed ? "0px" : `${asideWidthPx}px`}`
    : `${railWidthPx}px ${model.sidebarWidthPx}px minmax(0,1fr) ${model.isAsideCollapsed ? "0px" : `${asideWidthPx}px`}`,
  gridTemplateRows: "48px minmax(0,1fr)",
});

const mainColumnStart = (model: AppShellPreviewModel): string =>
  model.isSidebarCollapsed ? "col-start-2" : "col-start-3";
const asideColumnStart = (model: AppShellPreviewModel): string =>
  model.isSidebarCollapsed ? "col-start-3" : "col-start-4";

const signedOutPanel = () => {
  const { div, p, Class } = html<AppShellPreviewMessage>();

  return div(
    [Class("grid gap-[var(--space-3)]")],
    [
      div(
        [Class("grid gap-[var(--space-1)]")],
        [
          p([Class("m-0 text-sm font-semibold leading-none")], ["Signed out"]),
          p(
            [Class("m-0 text-sm leading-5 text-muted-foreground")],
            ["Authentication is mocked in this app shell example."],
          ),
        ],
      ),
      div(
        [Class("rounded-md border border-border bg-muted/50 p-[var(--space-3)]")],
        [
          p([Class("m-0 text-xs font-medium uppercase tracking-wide text-muted-foreground")], ["Mock user"]),
          p([Class("m-0 mt-1 text-sm font-medium")], ["No active session"]),
        ],
      ),
      div(
        [
          Class(
            "inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-muted-foreground shadow-[var(--shadow-control)]",
          ),
        ],
        ["Sign in unavailable"],
      ),
    ],
  );
};

const userPopover = (model: AppShellPreviewModel, isCollapsed: boolean) => {
  const { span, Class } = html<AppShellPreviewMessage>();

  return Popover<AppShellPreviewMessage>({
    model: model.userPopover,
    toParentMessage: (message) => GotUserPopoverMessage({ message }),
    buttonContent: span(
      [Class("inline-flex items-center gap-[var(--space-2)]")],
      [
        span(
          [
            Class(
              "inline-flex size-6 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background",
            ),
          ],
          ["D"],
        ),
        ...(isCollapsed ? [] : [span([Class("text-left")], ["Dev"])]),
      ],
    ),
    panelContent: signedOutPanel(),
    className: isCollapsed ? "mx-auto" : "w-full",
    buttonClassName: `inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-2 text-sm font-medium shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring ${isCollapsed ? "w-9" : "w-full justify-start"}`,
    panelClassName:
      "z-50 w-72 rounded-lg border border-border bg-popover p-[var(--space-card)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none",
  });
};

const appShellFrame = (model: AppShellPreviewModel) => {
  const { div, h2, p, span, Class, OnPointerDown, OnPointerMove, OnPointerUp, Style } = html<AppShellPreviewMessage>();
  const navItems = ["public", "design", "bugs", "deployed"];

  return div(
    [Class("w-[min(74rem,calc(100vw-4rem))]")],
    [
      AppShell<AppShellPreviewMessage>({
        className: "h-[38rem] shadow-sm",
        attributes: [Style(shellGridStyle(model))],
        children: [
          AppShellRail<AppShellPreviewMessage>({
            className: "row-span-2 flex flex-col items-center gap-[var(--space-shell)] py-[var(--space-shell)]",
            children: [
              div(
                [Class("grid size-8 place-items-center rounded-md border border-border text-sm font-semibold")],
                ["#"],
              ),
              div(
                [Class("mt-auto grid gap-[var(--space-shell)] text-xs text-muted-foreground")],
                [span([], ["⌘"]), span([], ["☰"]), span([], ["◇"]), span([], ["⚙"])],
              ),
              userPopover(model, true),
            ],
          }),
          AppShellSidebar<AppShellPreviewMessage>({
            isCollapsed: model.isSidebarCollapsed,
            className: "row-span-2 grid grid-rows-[48px_minmax(0,1fr)_auto]",
            children: [
              div(
                [
                  Class(
                    "flex items-center justify-between border-b border-border px-[var(--space-shell)] text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  ),
                ],
                ["Channels", span([], ["+"])],
              ),
              div(
                [Class("min-h-0 overflow-auto p-[var(--space-list-item-x)]")],
                navItems.map((item, index) =>
                  div(
                    [
                      Class(
                        `rounded-md px-[var(--space-list-item-x)] py-[var(--space-control-y)] text-sm ${index === 0 ? "bg-muted font-medium text-foreground" : "text-muted-foreground"}`,
                      ),
                    ],
                    [`# ${item}`],
                  ),
                ),
              ),
              div([Class("border-t border-border p-[var(--space-shell)]")], [userPopover(model, false)]),
              div(
                [
                  OnPointerDown((_pointerType, _button, screenX) =>
                    Option.some(StartedAppShellSidebarResize({ screenX })),
                  ),
                  OnPointerMove((screenX) =>
                    model.isResizingSidebar ? Option.some(MovedAppShellSidebarResize({ screenX })) : Option.none(),
                  ),
                  OnPointerUp(() => Option.some(StoppedAppShellSidebarResize())),
                  Class(
                    `absolute -right-2 top-0 h-full w-4 cursor-col-resize touch-none ${model.isResizingSidebar ? "bg-muted/70" : ""}`,
                  ),
                ],
                [],
              ),
            ],
          }),
          AppShellHeader<AppShellPreviewMessage>({
            className: mainColumnStart(model),
            attributes: [Style({ gridColumnEnd: "span 1" })],
            children: [
              div(
                [Class("flex h-full items-center justify-between px-[var(--space-4)]")],
                [
                  div(
                    [Class("flex items-center gap-[var(--space-2)] text-sm font-medium")],
                    [
                      AppShellTrigger<AppShellPreviewMessage>({
                        onClick: ToggledAppShellSidebar(),
                        label: model.isSidebarCollapsed ? "›" : "‹",
                        className: "static size-7 shadow-none",
                      }),
                      span([Class("text-muted-foreground")], ["#"]),
                      "public",
                    ],
                  ),
                  div(
                    [Class("flex items-center gap-[var(--space-shell)] text-xs text-muted-foreground")],
                    [
                      "Header actions",
                      AppShellTrigger<AppShellPreviewMessage>({
                        onClick: ToggledAppShellAside(),
                        label: model.isAsideCollapsed ? "‹" : "›",
                        className: "static size-7 shadow-none",
                      }),
                    ],
                  ),
                ],
              ),
            ],
          }),
          AppShellMain<AppShellPreviewMessage>({
            className: `${mainColumnStart(model)} row-start-2 grid place-items-center p-[var(--space-4)]`,
            children: [
              div(
                [
                  Class(
                    "grid w-full max-w-2xl gap-[var(--space-card)] rounded-lg border border-border bg-card p-[var(--space-5)] shadow-sm",
                  ),
                ],
                [
                  h2([Class("m-0 text-2xl font-semibold")], ["App shell body"]),
                  p(
                    [Class("m-0 text-sm leading-6 text-muted-foreground")],
                    [
                      "Rail, sidebar, header, main body, and aside are separate regions. Drag the sidebar edge to update the model width.",
                    ],
                  ),
                ],
              ),
            ],
          }),
          AppShellAside<AppShellPreviewMessage>({
            className: `${asideColumnStart(model)} row-span-2 grid grid-rows-[48px_minmax(0,1fr)] overflow-hidden ${model.isAsideCollapsed ? "border-l-0" : ""}`,
            children: [
              model.isAsideCollapsed
                ? div([], [])
                : div(
                    [Class("flex items-center border-b border-border px-[var(--space-shell)] text-sm font-semibold")],
                    ["Aside"],
                  ),
              model.isAsideCollapsed
                ? div([], [])
                : div(
                    [
                      Class(
                        "grid content-start gap-[var(--space-2)] p-[var(--space-shell)] text-xs text-muted-foreground",
                      ),
                    ],
                    [
                      div([Class("rounded-md border border-border p-[var(--space-shell)]")], ["Context"]),
                      div([Class("rounded-md border border-border p-[var(--space-shell)]")], ["History"]),
                    ],
                  ),
            ],
          }),
          div([], []),
        ],
      }),
      model.isResizingSidebar
        ? div(
            [
              OnPointerMove((screenX) => Option.some(MovedAppShellSidebarResize({ screenX }))),
              OnPointerUp(() => Option.some(StoppedAppShellSidebarResize())),
              Class("fixed inset-0 z-50 cursor-col-resize touch-none"),
            ],
            [],
          )
        : div([], []),
    ],
  );
};

export const AppShellPreview = Preview.module({
  title: "Ui/App Shell",
  previews: [
    Preview.preview({
      name: "Layout",
      view: () => appShellFrame(initialModel()),
    }),
    Preview.preview({
      name: "Collapsed",
      view: () => appShellFrame({ ...initialModel(), isSidebarCollapsed: true }),
    }),
    Preview.preview({
      name: "Replay",
      init: initialModel,
      update,
      view: appShellFrame,
      scenarios: [
        Preview.scenario("Collapse and expand", [ToggledAppShellSidebar(), ToggledAppShellSidebar()]),
        Preview.scenario("Resize then collapse", [
          StartedAppShellSidebarResize({ screenX: 0 }),
          MovedAppShellSidebarResize({ screenX: 72 }),
          StoppedAppShellSidebarResize(),
          ToggledAppShellSidebar(),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([AppShellPreviewMessage]);
