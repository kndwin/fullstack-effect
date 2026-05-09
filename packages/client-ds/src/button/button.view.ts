import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type ButtonProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  className?: string;
  isDisabled?: boolean;
  onClick?: Message;
  type?: "button" | "submit" | "reset";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const baseClassName =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:pointer-events-none data-disabled:opacity-50";

const variantClassName = {
  default: "bg-primary text-primary-foreground shadow-[var(--shadow-control)] hover:bg-primary-hover",
  secondary: "bg-secondary text-secondary-foreground shadow-[var(--shadow-control)] hover:bg-surface-active",
  outline:
    "border border-input bg-background shadow-[var(--shadow-control)] hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground shadow-[var(--shadow-control)] hover:bg-danger-hover",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClassName = {
  default: "h-[var(--size-control-md)] px-[var(--space-control-x)] py-[var(--space-control-y)]",
  sm: "h-[var(--size-control-sm)] rounded-md px-[var(--space-2)] text-xs",
  lg: "h-[var(--size-control-lg)] rounded-md px-[var(--space-5)]",
  icon: "size-[var(--size-control-md)]",
};

const buttonClassName = (props: ButtonProps<unknown>): string =>
  props.className ??
  `${baseClassName} ${variantClassName[props.variant ?? "default"]} ${sizeClassName[props.size ?? "default"]}`;

export const Button = <Message>(props: ButtonProps<Message>): Html => {
  const { button, Class } = html<Message>();

  return Ui.Button.view({
    isDisabled: props.isDisabled,
    onClick: props.onClick,
    type: props.type,
    toView: (attributes) =>
      button([...attributes.button, ...(props.attributes ?? []), Class(buttonClassName(props))], props.children),
  });
};
