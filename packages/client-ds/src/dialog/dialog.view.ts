import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type DialogProps<Message> = Readonly<{
  model: Ui.Dialog.Model;
  toParentMessage: (message: Ui.Dialog.Message) => Message;
  panelContent: Html | string;
  className?: string;
  panelClassName?: string;
  backdropClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  panelAttributes?: ReadonlyArray<Attribute<Message>>;
  backdropAttributes?: ReadonlyArray<Attribute<Message>>;
  onClosed?: () => Message;
}>;

const defaultClassName =
  "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-transparent";
const defaultBackdropClassName =
  "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity data-closed:opacity-0";
const defaultPanelClassName =
  "fixed left-1/2 top-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-[var(--space-3)] rounded-lg border border-border bg-popover p-[var(--space-card)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0";

export const Dialog = <Message>(props: DialogProps<Message>): Html => {
  const { span } = html<Message>();

  return Ui.Dialog.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    panelContent: typeof props.panelContent === "string" ? span([], [props.panelContent]) : props.panelContent,
    className: props.className ?? defaultClassName,
    panelClassName: props.panelClassName ?? defaultPanelClassName,
    backdropClassName: props.backdropClassName ?? defaultBackdropClassName,
    attributes: props.attributes,
    panelAttributes: props.panelAttributes,
    backdropAttributes: props.backdropAttributes,
    onClosed: props.onClosed,
  });
};

export const initDialog = Ui.Dialog.init;
export const updateDialog = Ui.Dialog.update;
export const openDialog = Ui.Dialog.open;
export const closeDialog = Ui.Dialog.close;
export const dialogTitleId = Ui.Dialog.titleId;
export const dialogDescriptionId = Ui.Dialog.descriptionId;
export const DialogModel = Ui.Dialog.Model;
export const DialogMessage = Ui.Dialog.Message;
