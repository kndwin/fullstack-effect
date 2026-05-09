import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type BadgeProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const baseClassName =
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors";

const variantClassName = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
};

export const Badge = <Message>(props: BadgeProps<Message>): Html => {
  const { span, Class } = html<Message>();
  const className = props.className ?? `${baseClassName} ${variantClassName[props.variant ?? "default"]}`;

  return span([...(props.attributes ?? []), Class(className)], props.children);
};
