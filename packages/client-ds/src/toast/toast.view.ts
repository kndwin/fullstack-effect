import { Schema } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export const ToastPayload = Schema.Struct({
  title: Schema.String,
  description: Schema.optional(Schema.String),
  actionLabel: Schema.optional(Schema.String),
});

export const Toast = Ui.Toast.make(ToastPayload);

export type ToastPayload = typeof ToastPayload.Type;

export type ToastProps<Message> = Readonly<{
  model: typeof Toast.Model.Type;
  toParentMessage: (message: typeof Toast.Message.Type) => Message;
  position?: "TopLeft" | "TopCenter" | "TopRight" | "BottomLeft" | "BottomCenter" | "BottomRight";
  className?: string;
  entryClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultClassName = "z-50 gap-[var(--space-2)] p-[var(--space-card)]";
const defaultEntryClassName =
  "w-[min(24rem,calc(100vw-2rem))] transition-all duration-200 data-closed:translate-y-2 data-closed:opacity-0";

const entryClassName = (variant: string): string => {
  const tone =
    variant === "Error"
      ? "border-danger-border bg-danger-surface text-danger"
      : variant === "Warning"
        ? "border-warning-border bg-warning-surface text-warning"
        : variant === "Success"
          ? "border-success-border bg-success-surface text-success"
          : "border-border bg-card text-card-foreground";

  return `flex items-start gap-[var(--space-3)] rounded-lg border p-[var(--space-card)] shadow-[var(--shadow-popover)] ${tone}`;
};

export const ToastViewport = <Message>(props: ToastProps<Message>): Html => {
  const { button, div, p, span, Class, OnClick } = html<Message>();

  return Toast.view({
    model: props.model,
    position: props.position ?? "BottomRight",
    toParentMessage: props.toParentMessage,
    className: props.className ?? defaultClassName,
    entryClassName: props.entryClassName ?? defaultEntryClassName,
    renderEntry: (entry, handlers) =>
      div(
        [Class(entryClassName(entry.variant))],
        [
          div(
            [Class("min-w-0 flex-1")],
            [
              p([Class("m-0 text-sm font-semibold leading-none")], [entry.payload.title]),
              entry.payload.description
                ? p([Class("m-0 mt-1 text-sm opacity-85")], [entry.payload.description])
                : span([], []),
              entry.payload.actionLabel
                ? p([Class("m-0 mt-2 text-xs font-medium underline underline-offset-4")], [entry.payload.actionLabel])
                : span([], []),
            ],
          ),
          button(
            [
              OnClick(handlers.dismiss),
              Class(
                "rounded-sm px-1 text-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              ),
            ],
            ["Close"],
          ),
        ],
      ),
  });
};

export const initToast = Toast.init;
export const updateToast = Toast.update;
export const showToast = Toast.show;
export const dismissToast = Toast.dismiss;
export const dismissAllToasts = Toast.dismissAll;
export const ToastModel = Toast.Model;
export const ToastMessage = Toast.Message;
