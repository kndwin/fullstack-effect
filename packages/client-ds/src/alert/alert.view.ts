import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type AlertProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  variant?: "default" | "destructive";
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

export type AlertTextProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const alertClassName = {
  default: "relative w-full rounded-lg border border-border bg-card p-[var(--space-card)] text-card-foreground shadow-[var(--shadow-panel)]",
  destructive:
    "relative w-full rounded-lg border border-danger-border bg-danger-surface p-[var(--space-card)] text-danger shadow-[var(--shadow-panel)]",
};

export const Alert = <Message>(props: AlertProps<Message>): Html => {
  const { div, Class } = html<Message>();

  return div(
    [...(props.attributes ?? []), Class(props.className ?? alertClassName[props.variant ?? "default"])],
    props.children,
  );
};

export const AlertTitle = <Message>(props: AlertTextProps<Message>): Html => {
  const { h2, Class } = html<Message>();

  return h2(
    [...(props.attributes ?? []), Class(props.className ?? "m-0 mb-1 font-medium leading-none tracking-tight")],
    props.children,
  );
};

export const AlertDescription = <Message>(props: AlertTextProps<Message>): Html => {
  const { p, Class } = html<Message>();

  return p(
    [...(props.attributes ?? []), Class(props.className ?? "m-0 text-sm leading-6 text-muted-foreground")],
    props.children,
  );
};
