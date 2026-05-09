import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type DisclosureProps<Message> = Readonly<{
  model: Ui.Disclosure.Model;
  toParentMessage: (message: Ui.Disclosure.Message) => Message;
  buttonContent: Html | string;
  panelContent: Html | string;
  isDisabled?: boolean;
  persistPanel?: boolean;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  buttonAttributes?: ReadonlyArray<Attribute<Message>>;
  panelAttributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultClassName = "w-full rounded-lg border border-border bg-card text-card-foreground";
const defaultButtonClassName =
  "flex w-full items-center justify-between gap-[var(--space-3)] rounded-lg px-[var(--space-card)] py-[var(--space-panel)] text-left text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-open:rounded-b-none data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultPanelClassName =
  "border-t border-border px-[var(--space-card)] py-[var(--space-panel)] text-sm leading-6 text-muted-foreground data-open:animate-in";

export const Disclosure = <Message>(props: DisclosureProps<Message>): Html =>
  Ui.Disclosure.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    buttonContent:
      typeof props.buttonContent === "string" ? html<Message>().span([], [props.buttonContent]) : props.buttonContent,
    panelContent:
      typeof props.panelContent === "string" ? html<Message>().span([], [props.panelContent]) : props.panelContent,
    isDisabled: props.isDisabled,
    persistPanel: props.persistPanel,
    className: props.className ?? defaultClassName,
    buttonClassName: props.buttonClassName ?? defaultButtonClassName,
    panelClassName: props.panelClassName ?? defaultPanelClassName,
    attributes: props.attributes,
    buttonAttributes: props.buttonAttributes,
    panelAttributes: props.panelAttributes,
  });

export const initDisclosure = Ui.Disclosure.init;
export const updateDisclosure = Ui.Disclosure.update;
export const DisclosureModel = Ui.Disclosure.Model;
export const DisclosureMessage = Ui.Disclosure.Message;
