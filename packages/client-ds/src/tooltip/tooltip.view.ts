import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type TooltipProps<Message> = Readonly<{
  model: Ui.Tooltip.Model;
  toParentMessage: (
    message:
      | Ui.Tooltip.EnteredTrigger
      | Ui.Tooltip.LeftTrigger
      | Ui.Tooltip.FocusedTrigger
      | Ui.Tooltip.BlurredTrigger
      | Ui.Tooltip.PressedEscape
      | Ui.Tooltip.PressedPointerOnTrigger
      | typeof Ui.Tooltip.CompletedAnchorMount.Type,
  ) => Message;
  triggerContent: Html | string;
  content: Html | string;
  isDisabled?: boolean;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  triggerAttributes?: ReadonlyArray<Attribute<Message>>;
  panelAttributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultTriggerClassName =
  "inline-flex h-[var(--size-control-md)] items-center justify-center rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm font-medium shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultPanelClassName =
  "z-50 max-w-64 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium leading-5 text-background shadow-md";

export const Tooltip = <Message>(props: TooltipProps<Message>): Html => {
  const { span } = html<Message>();

  return Ui.Tooltip.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    anchor: { placement: "top", gap: 6, padding: 8, portal: true },
    triggerContent: typeof props.triggerContent === "string" ? span([], [props.triggerContent]) : props.triggerContent,
    content: typeof props.content === "string" ? span([], [props.content]) : props.content,
    isDisabled: props.isDisabled,
    className: props.className,
    triggerClassName: props.triggerClassName ?? defaultTriggerClassName,
    panelClassName: props.panelClassName ?? defaultPanelClassName,
    attributes: props.attributes,
    triggerAttributes: props.triggerAttributes,
    panelAttributes: props.panelAttributes,
  });
};

export const initTooltip = Ui.Tooltip.init;
export const updateTooltip = Ui.Tooltip.update;
export const TooltipModel = Ui.Tooltip.Model;
export const TooltipMessage = Ui.Tooltip.Message;
