import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type SwitchProps<Message> = Readonly<{
  model: Ui.Switch.Model;
  toParentMessage: (message: Ui.Switch.Message) => Message;
  label: string;
  description?: string;
  isDisabled?: boolean;
  name?: string;
  value?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  buttonClassName?: string;
  thumbClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}>;

const defaultButtonClassName =
  "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input shadow-[var(--shadow-control)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50 [&[data-checked]_.switch-thumb]:translate-x-4";

const defaultThumbClassName =
  "switch-thumb pointer-events-none block size-4 translate-x-0 rounded-full bg-background shadow-[var(--shadow-popover)] ring-0 transition-transform";

export const Switch = <Message>(props: SwitchProps<Message>): Html => {
  const { button, div, input, label, p, span, Class } = html<Message>();

  return Ui.Switch.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    isDisabled: props.isDisabled,
    name: props.name,
    value: props.value,
    toView: (attributes) =>
      div(
        [...(props.attributes ?? []), Class("flex items-center gap-[var(--space-2)]")],
        [
          button(
            [...attributes.button, Class(props.buttonClassName ?? defaultButtonClassName)],
            [span([Class(props.thumbClassName ?? defaultThumbClassName)], [])],
          ),
          div(
            [Class("grid gap-1")],
            [
              label(
                [
                  ...attributes.label,
                  Class(props.labelClassName ?? "text-sm font-medium leading-none text-foreground"),
                ],
                [props.label],
              ),
              props.description
                ? p(
                    [
                      ...attributes.description,
                      Class(props.descriptionClassName ?? "m-0 text-sm text-muted-foreground"),
                    ],
                    [props.description],
                  )
                : div(attributes.description, []),
            ],
          ),
          props.name ? input(attributes.hiddenInput) : div([], []),
        ],
      ),
  });
};

export const initSwitch = Ui.Switch.init;
export const updateSwitch = Ui.Switch.update;
export const SwitchModel = Ui.Switch.Model;
export const SwitchMessage = Ui.Switch.Message;
