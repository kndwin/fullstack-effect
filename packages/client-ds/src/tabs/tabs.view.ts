import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type TabItem = Readonly<{
  label: string;
  value: string;
  content: Html | string;
  isDisabled?: boolean;
}>;

export type TabsProps<Message> = Readonly<{
  model: Ui.Tabs.Model;
  toParentMessage: (message: Ui.Tabs.Message) => Message;
  tabs: ReadonlyArray<TabItem>;
  tabListAriaLabel: string;
  orientation?: "Horizontal" | "Vertical";
  persistPanels?: boolean;
  className?: string;
  tabListClassName?: string;
  buttonClassName?: string;
  panelClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  tabListAttributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultButtonClassName =
  "inline-flex h-[var(--size-control-md)] items-center justify-center whitespace-nowrap rounded-md px-[var(--space-control-x)] text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-selected:bg-background data-selected:text-foreground data-selected:shadow-[var(--shadow-control)] data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultPanelClassName =
  "mt-[var(--space-3)] rounded-lg border border-border bg-card p-[var(--space-card)] text-sm leading-6 text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const Tabs = <Message>(props: TabsProps<Message>): Html => {
  const { span, Class } = html<Message>();
  const isVertical = props.orientation === "Vertical";
  const tabs = props.tabs.map((tab) => tab.value);
  const tabByValue = new Map(props.tabs.map((tab) => [tab.value, tab]));

  return Ui.Tabs.view<Message, string>({
    model: props.model,
    toParentMessage: props.toParentMessage,
    tabs,
    tabListAriaLabel: props.tabListAriaLabel,
    orientation: props.orientation,
    persistPanels: props.persistPanels,
    isTabDisabled: (value) => tabByValue.get(value)?.isDisabled ?? false,
    className: props.className ?? (isVertical ? "flex gap-[var(--space-card)]" : "grid gap-[var(--space-3)]"),
    attributes: props.attributes,
    tabListClassName:
      props.tabListClassName ??
      (isVertical
        ? "grid min-w-32 gap-1 rounded-lg bg-muted p-1"
        : "inline-flex w-fit items-center rounded-lg bg-muted p-1"),
    tabListAttributes: props.tabListAttributes,
    tabToConfig: (value) => {
      const tab = tabByValue.get(value) ?? { label: value, value, content: value };

      return {
        buttonClassName: props.buttonClassName ?? defaultButtonClassName,
        buttonContent: span([], [tab.label]),
        panelClassName:
          props.panelClassName ??
          (isVertical ? defaultPanelClassName.replace("mt-3 ", "flex-1 ") : defaultPanelClassName),
        panelContent: typeof tab.content === "string" ? span([], [tab.content]) : tab.content,
      };
    },
  });
};

export const initTabs = Ui.Tabs.init;
export const updateTabs = Ui.Tabs.update;
export const TabsModel = Ui.Tabs.Model;
export const TabsMessage = Ui.Tabs.Message;
