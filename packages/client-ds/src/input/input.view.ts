import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type InputProps<Message> = Readonly<{
  id: string;
  value: string;
  onInput: (value: string) => Message;
  label?: string;
  description?: string;
  placeholder?: string;
  type?: string;
  name?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isAutofocus?: boolean;
  attributes?: ReadonlyArray<Attribute<Message>>;
  inputClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}>;

const defaultInputClassName =
  "flex h-[var(--size-control-md)] w-full rounded-md border border-input bg-transparent px-[var(--space-control-x)] py-[var(--space-list-item-y)] text-base text-foreground shadow-[var(--shadow-control)] outline-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-destructive data-invalid:ring-destructive md:text-sm";

export const Input = <Message>(props: InputProps<Message>): Html => {
  const { div, input, label, p, Class } = html<Message>();

  return Ui.Input.view({
    id: props.id,
    value: props.value,
    onInput: props.onInput,
    placeholder: props.placeholder,
    type: props.type,
    name: props.name,
    isDisabled: props.isDisabled,
    isInvalid: props.isInvalid,
    isAutofocus: props.isAutofocus,
    toView: (attributes) =>
      div(
        [...(props.attributes ?? []), Class("grid gap-[var(--space-list-item-y)]")],
        [
          props.label
            ? label(
                [
                  ...attributes.label,
                  Class(props.labelClassName ?? "text-sm font-medium leading-none text-foreground"),
                ],
                [props.label],
              )
            : div(attributes.label, []),
          input([...attributes.input, Class(props.inputClassName ?? defaultInputClassName)]),
          props.description
            ? p(
                [...attributes.description, Class(props.descriptionClassName ?? "m-0 text-sm text-muted-foreground")],
                [props.description],
              )
            : div(attributes.description, []),
        ],
      ),
  });
};
