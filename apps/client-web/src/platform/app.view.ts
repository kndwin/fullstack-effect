import { Match } from "effect";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellRail,
  AppShellSidebar,
  AppShellTrigger,
} from "@qaveai/client-ds/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qaveai/client-ds/card";
import { Popover } from "@qaveai/client-ds/popover";
import { html } from "foldkit/html";
import type { Document } from "foldkit/html";
import { authGateView } from "../module/auth/auth.view";
import { orgSwitcherView } from "../module/org/org.view";
import { selectedOrgId } from "../module/org/org.update";
import { projectListRouter } from "../module/project/project.route";
import { projectDetailView, projectListView, projectTodoDetailView } from "../module/project/project.view";
import { todoListRouter } from "../module/todo/todo.route";
import { todoListView } from "../module/todo/todo.view";
import type { AppModel } from "./app.model";
import {
  GotAuthMessage,
  GotOrgMessage,
  GotProjectMessage,
  GotTodoMessage,
  GotUserPopoverMessage,
  ToggledSidebarCollapsed,
  type AppMessage,
} from "./app.message";

const { a, div, nav, p, span, keyed, Class, Href, Style } = html<AppMessage>();

const isTodoRoute = (model: AppModel): boolean =>
  Match.value(model.route).pipe(
    Match.tags({ TodoList: () => true }),
    Match.orElse(() => false),
  );

const isProjectRoute = (model: AppModel): boolean =>
  Match.value(model.route).pipe(
    Match.tags({ ProjectList: () => true, ProjectDetail: () => true, ProjectTodoDetail: () => true }),
    Match.orElse(() => false),
  );

const shellGridStyle = (model: AppModel) => ({
  gridTemplateColumns: model.isSidebarCollapsed ? "48px minmax(0,1fr)" : "220px minmax(0,1fr)",
  gridTemplateRows: "minmax(0,1fr)",
});

const desktopNavItem = (href: string, isActive: boolean, collapsedLabel: string, label: string, isCollapsed: boolean) =>
  a(
    [
      Href(href),
      Class(
        `block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"} ${isCollapsed ? "text-center" : ""}`,
      ),
    ],
    [isCollapsed ? collapsedLabel : label],
  );

const signedOutPanel = () =>
  div(
    [Class("grid gap-3")],
    [
      div(
        [Class("grid gap-1")],
        [
          p([Class("m-0 text-sm font-semibold leading-none")], ["Signed out"]),
          p(
            [Class("m-0 text-sm leading-5 text-muted-foreground")],
            ["Authentication is mocked in this shell preview."],
          ),
        ],
      ),
      div(
        [Class("rounded-md border border-border bg-muted/50 p-3")],
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

const userPopover = (model: AppModel, isCollapsed: boolean) =>
  Popover<AppMessage>({
    model: model.userPopover,
    toParentMessage: (message) => GotUserPopoverMessage({ message }),
    buttonContent: span(
      [Class("inline-flex items-center gap-2")],
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
      "z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-popover)] outline-none",
  });

const sidebarView = (model: AppModel) =>
  model.isSidebarCollapsed
    ? AppShellRail<AppMessage>({
        className: "hidden row-span-1 content-start gap-3 p-2 md:grid",
        children: [
          AppShellTrigger<AppMessage>({
            onClick: ToggledSidebarCollapsed(),
            label: "›",
            className: "static mx-auto size-7 shadow-none",
          }),
          desktopNavItem(todoListRouter(), isTodoRoute(model), "T", "Todos", true),
          desktopNavItem(projectListRouter(), isProjectRoute(model), "P", "Projects", true),
          div([Class("mt-auto")], [userPopover(model, true)]),
        ],
      })
    : AppShellSidebar<AppMessage>({
        className: "hidden grid-rows-[auto_minmax(0,1fr)_auto] md:grid",
        children: [
          div(
            [Class("flex items-center justify-between gap-3 border-b border-border p-3")],
            [
              div(
                [Class("grid gap-0.5")],
                [
                  p([Class("m-0 text-sm font-semibold leading-none")], ["Todo RPC"]),
                  p([Class("m-0 text-xs text-muted-foreground")], ["Playground"]),
                ],
              ),
              AppShellTrigger<AppMessage>({
                onClick: ToggledSidebarCollapsed(),
                label: "‹",
                className: "static size-7 shadow-none",
              }),
            ],
          ),
          nav(
            [Class("grid content-start gap-1 p-3")],
            [
              p(
                [Class("m-0 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground")],
                ["Application"],
              ),
              desktopNavItem(todoListRouter(), isTodoRoute(model), "T", "Todos", false),
              desktopNavItem(projectListRouter(), isProjectRoute(model), "P", "Projects", false),
            ],
          ),
          div([Class("border-t border-border p-3")], [userPopover(model, false)]),
        ],
      });

export const view = (model: AppModel): Document => ({
  title: `${model.route._tag} - Todo RPC Playground`,
  body: AppShell<AppMessage>({
    className: "min-h-screen rounded-none border-0",
    attributes: [Style(shellGridStyle(model))],
    children: [
      sidebarView(model),
      AppShellMain<AppMessage>({
        className: "col-start-1 md:col-start-2",
        children: [
          div(
            [Class("border-b border-border bg-background/95 px-4 py-3 md:hidden")],
            [
              div(
                [Class("mb-3 grid gap-0.5")],
                [
                  p([Class("m-0 text-sm font-semibold leading-none")], ["Todo RPC Playground"]),
                  p([Class("m-0 text-xs text-muted-foreground")], ["Foldkit client shell"]),
                ],
              ),
              nav(
                [Class("flex rounded-lg border border-border bg-muted p-1 text-sm")],
                [
                  a(
                    [
                      Href(todoListRouter()),
                      Class(
                        `rounded-md px-3 py-1.5 font-medium text-foreground hover:bg-background ${isTodoRoute(model) ? "bg-background shadow-sm" : ""}`,
                      ),
                    ],
                    ["Todos"],
                  ),
                  a(
                    [
                      Href(projectListRouter()),
                      Class(
                        `rounded-md px-3 py-1.5 font-medium text-foreground hover:bg-background ${isProjectRoute(model) ? "bg-background shadow-sm" : ""}`,
                      ),
                    ],
                    ["Projects"],
                  ),
                ],
              ),
            ],
          ),
          div(
            [Class("mx-auto grid w-full max-w-4xl gap-6 px-4 py-6 sm:px-6 lg:px-8")],
            [
              Card<AppMessage>({
                children: [
                  CardHeader<AppMessage>({
                    className: "grid gap-2 p-6 sm:p-8",
                    children: [
                      CardTitle<AppMessage>({
                        className: "m-0 text-3xl font-semibold tracking-tight sm:text-4xl",
                        children: ["Todo RPC Playground"],
                      }),
                      CardDescription<AppMessage>({
                        className: "m-0 max-w-2xl text-sm leading-6 text-muted-foreground",
                        children: [
                          "Foldkit drives state. Effect RPC crosses the wire. Drizzle models the SQL on the server.",
                        ],
                      }),
                    ],
                  }),
                  CardContent<AppMessage>({
                    className: "p-6 pt-0 sm:p-8 sm:pt-0",
                    children: [
                      authGateView(model.auth, (message) => GotAuthMessage({ message })),
                      model.auth.session
                        ? div(
                            [Class("mt-5")],
                            [
                              orgSwitcherView(model.org, (message) => GotOrgMessage({ message })),
                              keyed("div")(
                                `${model.route._tag}:${selectedOrgId(model.org) ?? "no-org"}`,
                                [],
                                [
                                  Match.value(model.route).pipe(
                                    Match.tagsExhaustive({
                                      TodoList: () =>
                                        todoListView(model.todo, (message) => GotTodoMessage({ message })),
                                      ProjectList: () => {
                                        const orgId = selectedOrgId(model.org);
                                        return orgId
                                          ? projectListView(model.project, orgId, (message) =>
                                              GotProjectMessage({ message }),
                                            )
                                          : p(
                                              [Class("text-sm text-destructive")],
                                              ["Create an org before creating projects."],
                                            );
                                      },
                                      ProjectDetail: ({ projectId }) =>
                                        projectDetailView(model.project, model.todo, projectId, (message) =>
                                          GotTodoMessage({ message }),
                                        ),
                                      ProjectTodoDetail: ({ projectId, todoId }) =>
                                        projectTodoDetailView(model.project, model.todo, projectId, todoId, (message) =>
                                          GotTodoMessage({ message }),
                                        ),
                                      NotFound: ({ path }) =>
                                        p([Class("text-sm text-destructive")], [`No route matches ${path}.`]),
                                    }),
                                  ),
                                ],
                              ),
                            ],
                          )
                        : div([], []),
                    ],
                  }),
                ],
              }),
            ],
          ),
        ],
      }),
    ],
  }),
});
