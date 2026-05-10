import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";
import * as Icon from "../icon/icon.view";

export type SelectOption = Readonly<{
  label: string;
  value: string;
  isDisabled?: boolean;
}>;

export type SelectProps<Message> = Readonly<{
  id: string;
  value: string;
  options: ReadonlyArray<SelectOption>;
  onChange: (value: string) => Message;
  label?: string;
  description?: string;
  name?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  isAutofocus?: boolean;
  attributes?: ReadonlyArray<Attribute<Message>>;
  selectClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}>;

const defaultSelectClassName =
  "flex h-[var(--size-control-md)] w-full appearance-none rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-list-item-y)] text-base text-foreground shadow-[var(--shadow-control)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-disabled:opacity-50 data-invalid:border-destructive data-invalid:ring-destructive md:text-sm";

export const Select = <Message>(props: SelectProps<Message>): Html => {
  const { div, label, option, p, select, span, Class, Disabled, Value } = html<Message>();

  return Ui.Select.view({
    id: props.id,
    value: props.value,
    onChange: props.onChange,
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
          div(
            [Class("relative")],
            [
              select(
                [...attributes.select, Class(props.selectClassName ?? defaultSelectClassName)],
                props.options.map((item) =>
                  option([Value(item.value), ...(item.isDisabled ? [Disabled(true)] : [])], [item.label]),
                ),
              ),
              span(
                [Class("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground")],
                [Icon.chevronDown("size-4")],
              ),
            ],
          ),
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
