import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

type AppShellProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

export type AppShellRootProps<Message> = AppShellProps<Message>;
export type AppShellSidebarProps<Message> = AppShellProps<Message> &
  Readonly<{
    isCollapsed?: boolean;
  }>;
export type AppShellTriggerProps<Message> = Readonly<{
  onClick: Message;
  className?: string;
  label?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const classNames = {
  root: "relative grid min-h-screen overflow-hidden rounded-xl border border-border bg-background text-foreground",
  rail: "min-h-0 border-r border-border bg-muted/40",
  sidebar: "relative min-h-0 shrink-0 border-r border-border bg-muted/20",
  sidebarCollapsed: "hidden",
  header: "min-w-0 border-b border-border bg-background",
  main: "min-w-0 overflow-auto bg-background",
  aside: "min-h-0 min-w-0 border-l border-border bg-muted/20",
  trigger:
    "absolute z-40 inline-flex size-[var(--size-control-sm)] items-center justify-center rounded-md border border-border bg-background text-sm font-medium shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
};

const mergeClassName = (defaultClassName: string, className?: string): string =>
  className ? `${defaultClassName} ${className}` : defaultClassName;

const view = <Message>(tag: "aside" | "div" | "header" | "main", defaultClassName: string, props: AppShellProps<Message>): Html => {
  const { aside, div, header, main, Class } = html<Message>();
  const attributes = [...(props.attributes ?? []), Class(mergeClassName(defaultClassName, props.className))];

  switch (tag) {
    case "aside":
      return aside(attributes, props.children);
    case "header":
      return header(attributes, props.children);
    case "main":
      return main(attributes, props.children);
    case "div":
      return div(attributes, props.children);
  }
};

export const AppShell = <Message>(props: AppShellRootProps<Message>): Html => view("div", classNames.root, props);
export const AppShellRail = <Message>(props: AppShellProps<Message>): Html => view("aside", classNames.rail, props);
export const AppShellSidebar = <Message>(props: AppShellSidebarProps<Message>): Html =>
  view("aside", `${classNames.sidebar} ${props.isCollapsed ? classNames.sidebarCollapsed : ""}`, props);
export const AppShellHeader = <Message>(props: AppShellProps<Message>): Html => view("header", classNames.header, props);
export const AppShellMain = <Message>(props: AppShellProps<Message>): Html => view("main", classNames.main, props);
export const AppShellAside = <Message>(props: AppShellProps<Message>): Html => view("aside", classNames.aside, props);

export const AppShellTrigger = <Message>(props: AppShellTriggerProps<Message>): Html => {
  const { button, span, Class, OnClick } = html<Message>();

  return button(
    [...(props.attributes ?? []), OnClick(props.onClick), Class(mergeClassName(classNames.trigger, props.className))],
    [span([], [props.label ?? "‹"])],
  );
};
