import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type MenuItem = Readonly<{
  label: string;
  value: string;
  description?: string;
  isDisabled?: boolean;
  group?: string;
}>;

export type MenuProps<Message> = Readonly<{
  model: Ui.Menu.Model;
  toParentMessage: (message: Ui.Menu.Message) => Message;
  items: ReadonlyArray<MenuItem>;
  onSelectedItem: (value: string) => Message;
  buttonContent: Html | string;
  isDisabled?: boolean;
  className?: string;
  buttonClassName?: string;
  itemsClassName?: string;
  itemClassName?: string;
  backdropClassName?: string;
  attributes?: ReadonlyArray<Attribute<Message>>;
}>;

const defaultButtonClassName =
  "inline-flex h-[var(--size-control-md)] items-center justify-center rounded-md border border-input bg-background px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm font-medium shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-open:bg-accent data-disabled:pointer-events-none data-disabled:opacity-50";
const defaultItemsClassName =
  "z-50 min-w-44 overflow-hidden rounded-md border border-border bg-popover p-[var(--space-1)] text-popover-foreground shadow-[var(--shadow-popover)] outline-none transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0";
const defaultItemClassName =
  "relative grid cursor-default gap-0.5 rounded-sm px-[var(--space-list-item-x)] py-[var(--space-list-item-y)] text-sm outline-none data-active:bg-accent data-active:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50";

export const Menu = <Message>(props: MenuProps<Message>): Html => {
  const { div, p, span, Class } = html<Message>();
  const itemByValue = new Map(props.items.map((item) => [item.value, item]));
  const values = props.items.map((item) => item.value);

  return Ui.Menu.view<Message, string>({
    model: props.model,
    toParentMessage: props.toParentMessage,
    items: values,
    onSelectedItem: (index) => props.onSelectedItem(values[index] ?? ""),
    itemToSearchText: (value) => itemByValue.get(value)?.label ?? value,
    isButtonDisabled: props.isDisabled,
    isItemDisabled: (value) => itemByValue.get(value)?.isDisabled ?? false,
    className: props.className,
    attributes: props.attributes,
    anchor: { placement: "bottom-start", gap: 6, padding: 8, portal: true },
    buttonClassName: props.buttonClassName ?? defaultButtonClassName,
    buttonContent: typeof props.buttonContent === "string" ? span([], [props.buttonContent]) : props.buttonContent,
    itemsClassName: props.itemsClassName ?? defaultItemsClassName,
    backdropClassName: props.backdropClassName ?? "fixed inset-0 z-40 bg-transparent",
    itemGroupKey: (value) => itemByValue.get(value)?.group ?? "",
    groupToHeading: (group) =>
      group
        ? { className: "px-2 py-1.5 text-xs font-medium text-muted-foreground", content: span([], [group]) }
        : undefined,
    itemToConfig: (value) => {
      const item = itemByValue.get(value) ?? { label: value, value };

      return {
        className: props.itemClassName ?? defaultItemClassName,
        content: div(
          [Class("grid gap-0.5")],
          [
            span([Class("font-medium")], [item.label]),
            item.description ? p([Class("m-0 text-xs text-muted-foreground")], [item.description]) : span([], []),
          ],
        ),
      };
    },
  });
};

export const initMenu = Ui.Menu.init;
export const updateMenu = Ui.Menu.update;
export const openMenu = Ui.Menu.open;
export const closeMenu = Ui.Menu.close;
export const selectMenuItem = Ui.Menu.selectItem;
export const MenuModel = Ui.Menu.Model;
export const MenuMessage = Ui.Menu.Message;
