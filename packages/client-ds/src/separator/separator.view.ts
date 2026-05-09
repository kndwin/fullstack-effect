import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type SeparatorProps<Message> = Readonly<{
  orientation?: "horizontal" | "vertical";
  className?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

export const Separator = <Message>(props: SeparatorProps<Message>): Html => {
  const { div, Class, Role } = html<Message>();
  const orientation = props.orientation ?? "horizontal";
  const defaultClassName = orientation === "horizontal" ? "h-px w-full bg-border" : "h-full w-px bg-border";

  return div([...(props.attributes ?? []), Role("separator"), Class(props.className ?? defaultClassName)], []);
};
