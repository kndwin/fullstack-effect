import { Option } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type ListboxItem = Readonly<{
  label: string;
  value: string;
  description?: string;
  isDisabled?: boolean;
}>;

export type ListboxProps<Message> = Readonly<{
  model: Ui.Listbox.Model;
  toParentMessage: (
    message:
      | Ui.Listbox.Opened
      | Ui.Listbox.Closed
      | Ui.Listbox.BlurredItems
      | Ui.Listbox.ActivatedItem
      | Ui.Listbox.DeactivatedItem
      | Ui.Listbox.SelectedItem
      | Ui.Listbox.MovedPointerOverItem
      | Ui.Listbox.RequestedItemClick
      | Ui.Listbox.Searched
      | Ui.Listbox.PressedPointerOnButton
      | Ui.Listbox.IgnoredMouseClick
      | Ui.Listbox.SuppressedSpaceScroll
      | typeof Ui.Listbox.CompletedAnchorMount.Type
      | typeof Ui.Listbox.CompletedFocusItemsOnMount.Type,
  ) => Message;
  items: ReadonlyArray<ListboxItem>;
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  name?: string;
  className?: string;
  buttonClassName?: string;
  itemsClassName?: string;
  itemClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultButtonClassName =
  "flex h-[var(--size-control-md)] w-full items-center justify-between rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-open:ring-2 data-open:ring-ring data-invalid:border-destructive data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultItemsClassName =
  "z-50 max-h-72 min-w-56 overflow-hidden rounded-md border border-border bg-popover p-[var(--space-1)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none";
const defaultItemClassName =
  "relative grid cursor-default gap-0.5 rounded-sm px-[var(--space-list-item-x)] py-[var(--space-list-item-y)] text-sm outline-none data-active:bg-accent data-active:text-accent-foreground data-selected:bg-accent data-selected:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const Listbox = <Message>(props: ListboxProps<Message>): Html => {
  const { div, p, span, Class } = html<Message>();
  const selected = Option.match(props.model.maybeSelectedItem, {
    onNone: () => undefined,
    onSome: (value) => props.items.find((item) => item.value === value),
  });

  return Ui.Listbox.view<Message, ListboxItem>({
    model: props.model,
    toParentMessage: props.toParentMessage,
    items: props.items,
    itemToValue: (item) => item.value,
    itemToSearchText: (item) => item.label,
    isItemDisabled: (item) => item.isDisabled ?? false,
    isButtonDisabled: props.isDisabled,
    isDisabled: props.isDisabled,
    isInvalid: props.isInvalid,
    name: props.name,
    className: props.className ?? "w-full",
    attributes: props.attributes,
    anchor: { placement: "bottom-start", gap: 6, padding: 8, portal: true },
    buttonClassName: props.buttonClassName ?? defaultButtonClassName,
    buttonContent: span(
      [Class(selected ? "text-foreground" : "text-muted-foreground")],
      [selected?.label ?? props.placeholder ?? "Select an option"],
    ),
    itemsClassName: props.itemsClassName ?? defaultItemsClassName,
    itemToConfig: (item) => ({
      className: props.itemClassName ?? defaultItemClassName,
      content: div(
        [Class("grid gap-0.5")],
        [
          span([Class("font-medium")], [item.label]),
          item.description ? p([Class("m-0 text-xs text-muted-foreground")], [item.description]) : span([], []),
        ],
      ),
    }),
  });
};

export const initListbox = Ui.Listbox.init;
export const updateListbox = Ui.Listbox.update;
export const ListboxModel = Ui.Listbox.Model;
export const ListboxMessage = Ui.Listbox.Message;
