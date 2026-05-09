import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type CheckboxProps<Message> = Readonly<{
  model: Ui.Checkbox.Model;
  toParentMessage: (message: Ui.Checkbox.Message) => Message;
  label: string;
  description?: string;
  isDisabled?: boolean;
  isIndeterminate?: boolean;
  name?: string;
  value?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  checkboxClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}>;

const mark = (isChecked: boolean, isIndeterminate: boolean): string => (isIndeterminate ? "-" : isChecked ? "✓" : "");

const defaultCheckboxClassName =
  "grid size-5 place-items-center rounded-md border border-input bg-surface text-sm font-bold text-primary transition-colors hover:border-input-hover data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const Checkbox = <Message>(props: CheckboxProps<Message>): Html => {
  const { button, div, input, label, p, Class } = html<Message>();

  return Ui.Checkbox.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    isDisabled: props.isDisabled,
    isIndeterminate: props.isIndeterminate,
    name: props.name,
    value: props.value,
    toView: (attributes) =>
      div(
        [...(props.attributes ?? []), Class("grid gap-1")],
        [
          div(
            [Class("flex items-center gap-2")],
            [
              button(
                [...attributes.checkbox, Class(props.checkboxClassName ?? defaultCheckboxClassName)],
                [mark(props.model.isChecked, props.isIndeterminate ?? false)],
              ),
              label(
                [...attributes.label, Class(props.labelClassName ?? "text-sm font-medium text-foreground")],
                [props.label],
              ),
            ],
          ),
          props.description
            ? p(
                [...attributes.description, Class(props.descriptionClassName ?? "m-0 text-sm text-muted-foreground")],
                [props.description],
              )
            : div(attributes.description, []),
          props.name ? input(attributes.hiddenInput) : div([], []),
        ],
      ),
  });
};

export const initCheckbox = Ui.Checkbox.init;
export const updateCheckbox = Ui.Checkbox.update;
export const CheckboxModel = Ui.Checkbox.Model;
export const CheckboxMessage = Ui.Checkbox.Message;
