import { Array, Option } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";
import * as Icon from "../icon/icon.view";

export type ComboboxItem = Readonly<{
  label: string;
  value: string;
  description?: string;
  isDisabled?: boolean;
}>;

export type ComboboxProps<Message> = Readonly<{
  model: Ui.Combobox.Model;
  toParentMessage: (message: Ui.Combobox.Message) => Message;
  onSelectedItem: (value: string) => Message;
  items: ReadonlyArray<ComboboxItem>;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
  inputWrapperClassName?: string;
  inputClassName?: string;
  buttonClassName?: string;
  itemsClassName?: string;
  itemClassName?: string;
  backdropClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultInputClassName =
  "h-[var(--size-control-md)] w-full rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-control-y)] pr-10 text-sm text-foreground shadow-[var(--shadow-control)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-disabled:cursor-not-allowed data-disabled:opacity-50";
const defaultInputWrapperClassName = "relative flex w-full items-stretch [--combobox-input-width:100%]";
const defaultButtonClassName =
  "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none data-open:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultItemsClassName =
  "z-50 max-h-72 w-[var(--combobox-input-width)] min-w-64 overflow-hidden rounded-md border border-border bg-popover p-[var(--space-1)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none";
const defaultItemClassName =
  "relative cursor-default rounded-sm px-[var(--space-list-item-x)] py-[var(--space-control-y)] text-sm outline-none transition-colors data-active:bg-accent data-active:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

const filterItems = (items: ReadonlyArray<ComboboxItem>, inputValue: string): ReadonlyArray<ComboboxItem> => {
  const query = inputValue.trim().toLowerCase();

  return query === ""
    ? items
    : Array.filter(items, (item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query));
};

export const Combobox = <Message>(props: ComboboxProps<Message>): Html => {
  const { div, p, span, Class } = html<Message>();
  const selected = Option.match(props.model.maybeSelectedItem, {
    onNone: () => undefined,
    onSome: (value) => props.items.find((item) => item.value === value),
  });
  const shouldFilterItems = props.model.inputValue.trim() !== "" && props.model.inputValue !== selected?.label;
  const visibleItems = shouldFilterItems ? filterItems(props.items, props.model.inputValue) : props.items;

  return div(
    [Class(props.className ?? "w-full")],
    [
      Ui.Combobox.view<Message, string>({
        model: props.model,
        toParentMessage: props.toParentMessage,
        onSelectedItem: props.onSelectedItem,
        items: visibleItems.map((item) => item.value),
        itemToValue: (value) => value,
        itemToDisplayText: (value) => props.items.find((item) => item.value === value)?.label ?? value,
        isItemDisabled: (value) => props.items.find((item) => item.value === value)?.isDisabled ?? false,
        inputWrapperClassName: props.inputWrapperClassName ?? defaultInputWrapperClassName,
        inputClassName: props.inputClassName ?? defaultInputClassName,
        inputPlaceholder: props.placeholder ?? selected?.label ?? "Search options...",
        buttonClassName: props.buttonClassName ?? defaultButtonClassName,
        buttonContent: Icon.chevronDown("size-4"),
        itemsClassName: props.itemsClassName ?? defaultItemsClassName,
        backdropClassName: props.backdropClassName ?? "fixed inset-0",
        attributes: props.attributes,
        anchor: { placement: "bottom-start", gap: 6, padding: 8, portal: false },
        itemToConfig: (value, { isSelected }) => {
          const item = props.items.find((item) => item.value === value) ?? { label: value, value };

          return {
            className: props.itemClassName ?? defaultItemClassName,
            content: div(
              [Class("flex min-w-0 items-start gap-2")],
              [
                span(
                  [
                    Class(
                      `mt-0.5 w-4 shrink-0 text-center text-xs ${isSelected ? "text-primary" : "text-transparent"}`,
                    ),
                  ],
                  ["●"],
                ),
                div(
                  [Class("grid min-w-0 gap-0.5")],
                  [
                    span([Class("truncate font-medium")], [item.label]),
                    item.description
                      ? p([Class("m-0 line-clamp-2 text-xs text-muted-foreground")], [item.description])
                      : span([], []),
                  ],
                ),
              ],
            ),
          };
        },
      }),
    ],
  );
};

export const initCombobox = Ui.Combobox.init;
export const updateCombobox = Ui.Combobox.update;
export const selectComboboxItem = Ui.Combobox.selectItem;
export const ComboboxModel = Ui.Combobox.Model;
export const ComboboxMessage = Ui.Combobox.Message;
