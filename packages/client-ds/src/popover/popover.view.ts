import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type PopoverProps<Message> = Readonly<{
  model: Ui.Popover.Model;
  toParentMessage: (
    message:
      | Ui.Popover.Opened
      | Ui.Popover.Closed
      | Ui.Popover.BlurredPanel
      | Ui.Popover.PressedPointerOnButton
      | Ui.Popover.IgnoredMouseClick
      | Ui.Popover.SuppressedSpaceScroll
      | typeof Ui.Popover.CompletedAnchorMount.Type,
  ) => Message;
  buttonContent: Html | string;
  panelContent: Html | string;
  isDisabled?: boolean;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  backdropClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  buttonAttributes?: ReadonlyArray<Attribute<Message>>;
  panelAttributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultButtonClassName =
  "inline-flex h-[var(--size-control-md)] items-center justify-center rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm font-medium shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-open:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultPanelClassName =
  "z-50 w-72 rounded-lg border border-border bg-popover p-[var(--space-card)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none";

export const Popover = <Message>(props: PopoverProps<Message>): Html => {
  const { span } = html<Message>();

  return Ui.Popover.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    anchor: { placement: "bottom-start", gap: 8, padding: 8, portal: true },
    buttonContent: typeof props.buttonContent === "string" ? span([], [props.buttonContent]) : props.buttonContent,
    panelContent: typeof props.panelContent === "string" ? span([], [props.panelContent]) : props.panelContent,
    isDisabled: props.isDisabled,
    className: props.className,
    buttonClassName: props.buttonClassName ?? defaultButtonClassName,
    panelClassName: props.panelClassName ?? defaultPanelClassName,
    backdropClassName: props.backdropClassName ?? "fixed inset-0 z-40 bg-background/20",
    attributes: props.attributes,
    buttonAttributes: props.buttonAttributes,
    panelAttributes: props.panelAttributes,
  });
};

export const initPopover = Ui.Popover.init;
export const updatePopover = Ui.Popover.update;
export const PopoverModel = Ui.Popover.Model;
export const PopoverMessage = Ui.Popover.Message;
