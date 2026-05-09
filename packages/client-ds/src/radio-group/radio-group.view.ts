import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type RadioGroupOption = Readonly<{
  label: string;
  value: string;
  description?: string;
  isDisabled?: boolean;
}>;

export type RadioGroupProps<Message> = Readonly<{
  model: Ui.RadioGroup.Model;
  toParentMessage: (message: Ui.RadioGroup.Message) => Message;
  options: ReadonlyArray<RadioGroupOption>;
  ariaLabel: string;
  orientation?: "Vertical" | "Horizontal";
  isDisabled?: boolean;
  name?: string;
  className?: string;
  optionClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultOptionClassName =
  "group flex cursor-pointer items-start gap-[var(--space-2)] rounded-lg border border-input bg-card p-[var(--space-panel)] text-card-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-active:border-input-hover data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const RadioGroup = <Message>(props: RadioGroupProps<Message>): Html => {
  const { div, p, span, Class } = html<Message>();
  const options = props.options.map((option) => option.value);
  const optionByValue = new Map(props.options.map((option) => [option.value, option]));

  return Ui.RadioGroup.view<Message, string>({
    model: props.model,
    toParentMessage: props.toParentMessage,
    options,
    ariaLabel: props.ariaLabel,
    orientation: props.orientation,
    isDisabled: props.isDisabled,
    name: props.name,
    isOptionDisabled: (value) => optionByValue.get(value)?.isDisabled ?? false,
    className:
      props.className ??
      (props.orientation === "Horizontal" ? "grid gap-[var(--space-3)] sm:grid-cols-3" : "grid gap-[var(--space-3)]"),
    attributes: props.attributes,
    optionToConfig: (value) => {
      const option = optionByValue.get(value) ?? { label: value, value };

      return {
        value,
        content: (attributes) =>
          div(
            [...attributes.option, Class(props.optionClassName ?? defaultOptionClassName)],
            [
              span(
                [Class("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border border-current")],
                [span([Class("size-2 rounded-full bg-current opacity-0 group-data-checked:opacity-100")], [])],
              ),
              div(
                [Class("grid gap-1")],
                [
                  span([...attributes.label, Class("text-sm font-medium leading-none")], [option.label]),
                  option.description
                    ? p(
                        [
                          ...attributes.description,
                          Class(
                            "m-0 text-sm leading-5 text-muted-foreground group-data-checked:text-primary-foreground/80",
                          ),
                        ],
                        [option.description],
                      )
                    : span(attributes.description, []),
                ],
              ),
            ],
          ),
      };
    },
  });
};

export const initRadioGroup = Ui.RadioGroup.init;
export const updateRadioGroup = Ui.RadioGroup.update;
export const RadioGroupModel = Ui.RadioGroup.Model;
export const RadioGroupMessage = Ui.RadioGroup.Message;
