import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type FieldsetProps<Message> = Readonly<{
  id: string;
  legend: string;
  children: ReadonlyArray<Html | string>;
  description?: string;
  isDisabled?: boolean;
  attributes?: ReadonlyArray<Attribute<Message>>;
  fieldsetClassName?: string;
  legendClassName?: string;
  descriptionClassName?: string;
}>;

const defaultFieldsetClassName =
  "grid gap-[var(--space-3)] rounded-xl border border-border bg-card p-[var(--space-card)] text-card-foreground shadow-[var(--shadow-panel)] data-disabled:opacity-60";

export const Fieldset = <Message>(props: FieldsetProps<Message>): Html => {
  const { div, fieldset, legend, p, Class } = html<Message>();

  return Ui.Fieldset.view<Message>({
    id: props.id,
    isDisabled: props.isDisabled,
    toView: (attributes) =>
      fieldset(
        [
          ...(props.attributes ?? []),
          ...attributes.fieldset,
          Class(props.fieldsetClassName ?? defaultFieldsetClassName),
        ],
        [
          legend(
            [...attributes.legend, Class(props.legendClassName ?? "px-1 text-sm font-semibold text-foreground")],
            [props.legend],
          ),
          props.description
            ? p(
                [...attributes.description, Class(props.descriptionClassName ?? "m-0 text-sm text-muted-foreground")],
                [props.description],
              )
            : div(attributes.description, []),
          ...props.children,
        ],
      ),
  });
};
