import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type CardProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const classNames = {
  card: "rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-panel)]",
  header: "grid gap-[var(--space-list-item-y)] p-[var(--space-card)]",
  title: "m-0 text-2xl font-semibold leading-none tracking-tight",
  description: "m-0 text-sm text-muted-foreground",
  content: "p-[var(--space-card)] pt-0",
  footer: "flex items-center p-[var(--space-card)] pt-0",
};

const view = <Message>(tag: "div" | "h2" | "p", defaultClassName: string, props: CardProps<Message>): Html => {
  const { div, h2, p, Class } = html<Message>();
  const attrs = [...(props.attributes ?? []), Class(props.className ?? defaultClassName)];

  switch (tag) {
    case "h2":
      return h2(attrs, props.children);
    case "p":
      return p(attrs, props.children);
    case "div":
      return div(attrs, props.children);
  }
};

export const Card = <Message>(props: CardProps<Message>): Html => view("div", classNames.card, props);
export const CardHeader = <Message>(props: CardProps<Message>): Html => view("div", classNames.header, props);
export const CardTitle = <Message>(props: CardProps<Message>): Html => view("h2", classNames.title, props);
export const CardDescription = <Message>(props: CardProps<Message>): Html => view("p", classNames.description, props);
export const CardContent = <Message>(props: CardProps<Message>): Html => view("div", classNames.content, props);
export const CardFooter = <Message>(props: CardProps<Message>): Html => view("div", classNames.footer, props);
