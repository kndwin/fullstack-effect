import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type ButtonProps<Message> = Readonly<{
  children: ReadonlyArray<Html | string>;
  className?: string;
  isDisabled?: boolean;
  onClick?: Message;
  type?: "button" | "submit" | "reset";
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

export const Button = <Message>(props: ButtonProps<Message>): Html => {
  const { button, Class } = html<Message>();

  return Ui.Button.view({
    isDisabled: props.isDisabled,
    onClick: props.onClick,
    type: props.type,
    toView: (attributes) =>
      button(
        [
          ...attributes.button,
          ...(props.attributes ?? []),
          ...(props.className ? [Class(props.className)] : []),
        ],
        props.children,
      ),
  });
};
