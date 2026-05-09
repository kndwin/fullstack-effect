import { Option, Schema } from "effect";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Alert, AlertDescription, AlertTitle } from "../alert/alert.view";
import {
  AppShell,
  AppShellAside,
  AppShellHeader,
  AppShellMain,
  AppShellRail,
  AppShellSidebar,
  AppShellTrigger,
} from "../app-shell/app-shell.view";
import { Badge } from "../badge/badge.view";
import { Button } from "../button/button.view";
import { Card, CardContent, CardHeader, CardTitle } from "../card/card.view";
import { Input } from "../input/input.view";
import { Menu } from "../menu/menu.view";
import { Ui } from "foldkit";

const ToggledWorkspaceSidebar = m("ToggledWorkspaceSidebar");
const ToggledWorkspaceAside = m("ToggledWorkspaceAside");
const ChangedWorkspaceSearch = m("ChangedWorkspaceSearch", { value: Schema.String });
const GotWorkspaceMenuMessage = m("GotWorkspaceMenuMessage", { message: Ui.Menu.Message });
const SelectedWorkspaceAction = m("SelectedWorkspaceAction", { value: Schema.String });

const Message = Schema.Union([
  ToggledWorkspaceSidebar,
  ToggledWorkspaceAside,
  ChangedWorkspaceSearch,
  GotWorkspaceMenuMessage,
  SelectedWorkspaceAction,
]);
type Message = typeof Message.Type;

const Model = Schema.Struct({
  isSidebarCollapsed: Schema.Boolean,
  isAsideCollapsed: Schema.Boolean,
  search: Schema.String,
  menu: Ui.Menu.Model,
  lastAction: Schema.Option(Schema.String),
});
type Model = typeof Model.Type;

const init = (): Model => ({
  isSidebarCollapsed: false,
  isAsideCollapsed: false,
  search: "",
  menu: Ui.Menu.init({ id: "example-workspace-menu" }),
  lastAction: Option.none(),
});

const update = (model: Model, message: Message): Model => {
  switch (message._tag) {
    case "ToggledWorkspaceSidebar":
      return { ...model, isSidebarCollapsed: !model.isSidebarCollapsed };
    case "ToggledWorkspaceAside":
      return { ...model, isAsideCollapsed: !model.isAsideCollapsed };
    case "ChangedWorkspaceSearch":
      return { ...model, search: message.value };
    case "GotWorkspaceMenuMessage":
      return { ...model, menu: Ui.Menu.update(model.menu, message.message)[0] };
    case "SelectedWorkspaceAction":
      return { ...model, menu: Ui.Menu.selectItem(model.menu, 0)[0], lastAction: Option.some(message.value) };
  }
};

const gridStyle = (model: Model) => ({
  gridTemplateColumns: model.isSidebarCollapsed
    ? `48px minmax(0,1fr) ${model.isAsideCollapsed ? "0px" : "240px"}`
    : `48px 220px minmax(0,1fr) ${model.isAsideCollapsed ? "0px" : "240px"}`,
  gridTemplateRows: "48px minmax(0,1fr)",
});

export const AppWorkspacePreview = Preview.module({
  title: "Example/App Workspace",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view: (model: Model) => {
        const { div, p, span, Class, Style } = html<Message>();
        const mainColumn = model.isSidebarCollapsed ? "col-start-2" : "col-start-3";

        return div(
          [Class("w-[min(76rem,calc(100vw-4rem))]")],
          [
            AppShell<Message>({
              className: "h-[42rem] shadow-sm",
              attributes: [Style(gridStyle(model))],
              children: [
                AppShellRail<Message>({
                  className: "row-span-2 flex flex-col items-center gap-[var(--space-shell)] py-[var(--space-shell)]",
                  children: [
                    div(
                      [
                        Class(
                          "grid size-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground",
                        ),
                      ],
                      ["W"],
                    ),
                    span([Class("mt-auto text-xs text-muted-foreground")], ["⌘"]),
                  ],
                }),
                AppShellSidebar<Message>({
                  isCollapsed: model.isSidebarCollapsed,
                  className: "row-span-2 grid grid-rows-[48px_minmax(0,1fr)]",
                  children: [
                    div(
                      [
                        Class(
                          "flex items-center justify-between border-b border-border px-[var(--space-shell)] text-sm font-semibold",
                        ),
                      ],
                      [
                        "Workspace",
                        AppShellTrigger({
                          onClick: ToggledWorkspaceSidebar(),
                          label: "‹",
                          className: "static size-7 shadow-none",
                        }),
                      ],
                    ),
                    div(
                      [Class("grid content-start gap-[var(--space-1)] p-[var(--space-list-item-x)]")],
                      ["Inbox", "Projects", "Reports", "Settings"].map((item, index) =>
                        div(
                          [
                            Class(
                              `rounded-md px-[var(--space-list-item-x)] py-[var(--space-control-y)] text-sm ${index === 0 ? "bg-muted font-medium" : "text-muted-foreground"}`,
                            ),
                          ],
                          [item],
                        ),
                      ),
                    ),
                  ],
                }),
                AppShellHeader<Message>({
                  className: mainColumn,
                  attributes: [Style({ gridColumnEnd: "span 1" })],
                  children: [
                    div(
                      [Class("flex h-full items-center justify-between gap-[var(--space-shell)] px-[var(--space-4)]")],
                      [
                        div(
                          [Class("flex items-center gap-[var(--space-2)]")],
                          [
                            model.isSidebarCollapsed
                              ? AppShellTrigger({
                                  onClick: ToggledWorkspaceSidebar(),
                                  label: "›",
                                  className: "static size-7 shadow-none",
                                })
                              : span([], []),
                            div(
                              [Class("w-72")],
                              [
                                Input({
                                  id: "example-workspace-search",
                                  value: model.search,
                                  placeholder: "Search workspace",
                                  onInput: (value) => ChangedWorkspaceSearch({ value }),
                                }),
                              ],
                            ),
                          ],
                        ),
                        Menu({
                          model: model.menu,
                          toParentMessage: (message) => GotWorkspaceMenuMessage({ message }) as Message,
                          onSelectedItem: (value) => SelectedWorkspaceAction({ value }) as Message,
                          buttonContent: "Actions",
                          items: [
                            { label: "Create project", value: "create" },
                            { label: "Invite teammate", value: "invite" },
                            { label: "Export report", value: "export" },
                          ],
                        }),
                      ],
                    ),
                  ],
                }),
                AppShellMain<Message>({
                  className: `${mainColumn} row-start-2 overflow-auto p-[var(--space-4)]`,
                  children: [
                    div(
                      [Class("grid gap-[var(--space-4)]")],
                      [
                        Option.isSome(model.lastAction)
                          ? Alert({
                              children: [
                                AlertTitle({ children: ["Action selected"] }),
                                AlertDescription({ children: [model.lastAction.value] }),
                              ],
                            })
                          : div([], []),
                        div(
                          [Class("grid gap-[var(--space-4)] md:grid-cols-3")],
                          ["Open", "Pending", "Closed"].map((label, index) =>
                            Card({
                              children: [
                                CardHeader({ children: [CardTitle({ children: [label] })] }),
                                CardContent({
                                  children: [
                                    Badge({
                                      variant: index === 0 ? "default" : "secondary",
                                      children: [`${12 - index * 3} items`],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ),
                        ),
                        Card({
                          children: [
                            CardHeader({ children: [CardTitle({ children: ["Workspace activity"] })] }),
                            CardContent({
                              children: [
                                p(
                                  [Class("m-0 text-sm leading-6 text-muted-foreground")],
                                  [
                                    "A full-shell integration preview combining navigation, search, menu, cards, badges, alerts, and aside controls.",
                                  ],
                                ),
                              ],
                            }),
                          ],
                        }),
                      ],
                    ),
                  ],
                }),
                AppShellAside<Message>({
                  className: `col-start-4 row-span-2 overflow-hidden ${model.isAsideCollapsed ? "border-l-0" : ""}`,
                  children: model.isAsideCollapsed
                    ? []
                    : [
                        div(
                          [
                            Class(
                              "flex h-12 items-center justify-between border-b border-border px-[var(--space-shell)] text-sm font-semibold",
                            ),
                          ],
                          [
                            "Inspector",
                            AppShellTrigger({
                              onClick: ToggledWorkspaceAside(),
                              label: "›",
                              className: "static size-7 shadow-none",
                            }),
                          ],
                        ),
                        div(
                          [Class("grid gap-[var(--space-shell)] p-[var(--space-shell)] text-sm text-muted-foreground")],
                          [
                            "Search",
                            Badge({ variant: "outline", children: [model.search || "empty"] }),
                            Button({
                              variant: "outline",
                              onClick: ToggledWorkspaceAside(),
                              children: ["Collapse aside"],
                            }),
                          ],
                        ),
                      ],
                }),
                model.isAsideCollapsed
                  ? AppShellTrigger({
                      onClick: ToggledWorkspaceAside(),
                      label: "‹",
                      className: "static col-start-4 row-start-1 m-2 size-7 justify-self-start shadow-none",
                    })
                  : div([], []),
              ],
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Search", [ChangedWorkspaceSearch({ value: "billing" })]),
        Preview.scenario("Collapse regions", [ToggledWorkspaceSidebar(), ToggledWorkspaceAside()]),
        Preview.scenario("Select action", [SelectedWorkspaceAction({ value: "create" })]),
      ],
    }),
  ],
});

export { Message };
