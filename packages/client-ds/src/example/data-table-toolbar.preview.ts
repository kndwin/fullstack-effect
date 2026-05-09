import { Option, Schema } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Badge } from "../badge/badge.view";
import { Button } from "../button/button.view";
import { Checkbox } from "../checkbox/checkbox.view";
import { Combobox } from "../combobox/combobox.view";
import { Input } from "../input/input.view";
import { Select } from "../select/select.view";

const ChangedTableSearch = m("ChangedTableSearch", { value: Schema.String });
const ChangedTableStatus = m("ChangedTableStatus", { value: Schema.String });
const GotOwnerComboboxMessage = m("GotOwnerComboboxMessage", { message: Ui.Combobox.Message });
const SelectedOwner = m("SelectedOwner", { value: Schema.String });
const GotArchivedMessage = m("GotArchivedMessage", { message: Ui.Checkbox.Message });
const ClearedTableFilters = m("ClearedTableFilters");

const Message = Schema.Union([
  ChangedTableSearch,
  ChangedTableStatus,
  GotOwnerComboboxMessage,
  SelectedOwner,
  GotArchivedMessage,
  ClearedTableFilters,
]);
type Message = typeof Message.Type;

const Model = Schema.Struct({
  search: Schema.String,
  status: Schema.String,
  ownerCombobox: Ui.Combobox.Model,
  selectedOwner: Schema.Option(Schema.String),
  archived: Ui.Checkbox.Model,
});
type Model = typeof Model.Type;

const owners = [
  { label: "Ada Lovelace", value: "ada", description: "Platform" },
  { label: "Grace Hopper", value: "grace", description: "Compiler" },
  { label: "Katherine Johnson", value: "katherine", description: "Ops" },
] as const;

const init = (): Model => ({
  search: "",
  status: "open",
  ownerCombobox: Ui.Combobox.init({ id: "example-table-owner", selectInputOnFocus: true }),
  selectedOwner: Option.none(),
  archived: Ui.Checkbox.init({ id: "example-table-archived", isChecked: false }),
});

const update = (model: Model, message: Message): Model => {
  switch (message._tag) {
    case "ChangedTableSearch":
      return { ...model, search: message.value };
    case "ChangedTableStatus":
      return { ...model, status: message.value };
    case "GotOwnerComboboxMessage":
      return { ...model, ownerCombobox: Ui.Combobox.update(model.ownerCombobox, message.message)[0] };
    case "SelectedOwner": {
      const item = owners.find((item) => item.value === message.value);
      return {
        ...model,
        ownerCombobox: Ui.Combobox.selectItem(model.ownerCombobox, message.value, item?.label ?? message.value)[0],
        selectedOwner: Option.some(message.value),
      };
    }
    case "GotArchivedMessage":
      return { ...model, archived: Ui.Checkbox.update(model.archived, message.message)[0] };
    case "ClearedTableFilters":
      return init();
  }
};

const activeFilterCount = (model: Model): number =>
  (model.search ? 1 : 0) +
  (model.status !== "open" ? 1 : 0) +
  (Option.isSome(model.selectedOwner) ? 1 : 0) +
  (model.archived.isChecked ? 1 : 0);

const UpdatedInputValue = (value: string): Ui.Combobox.UpdatedInputValue => ({ _tag: "UpdatedInputValue", value });

export const DataTableToolbarPreview = Preview.module({
  title: "Example/Data Table Toolbar",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view: (model: Model) => {
        const { div, p, span, Class } = html<Message>();
        const count = activeFilterCount(model);

        return div(
          [Class("grid w-[min(58rem,calc(100vw-4rem))] gap-4 rounded-xl border border-border bg-card p-5 shadow-sm")],
          [
            div(
              [Class("flex flex-col gap-3 lg:flex-row lg:items-end")],
              [
                div(
                  [Class("min-w-0 flex-1")],
                  [
                    Input({
                      id: "example-table-search",
                      label: "Search",
                      value: model.search,
                      placeholder: "Search requests...",
                      onInput: (value) => ChangedTableSearch({ value }),
                    }),
                  ],
                ),
                div(
                  [Class("w-full lg:w-44")],
                  [
                    Select({
                      id: "example-table-status",
                      label: "Status",
                      value: model.status,
                      options: [
                        { label: "Open", value: "open" },
                        { label: "Pending", value: "pending" },
                        { label: "Closed", value: "closed" },
                      ],
                      onChange: (value) => ChangedTableStatus({ value }),
                    }),
                  ],
                ),
                div(
                  [Class("w-full lg:w-64")],
                  [
                    p([Class("m-0 mb-1.5 text-sm font-medium")], ["Owner"]),
                    Combobox({
                      model: model.ownerCombobox,
                      toParentMessage: (message) => GotOwnerComboboxMessage({ message }) as Message,
                      onSelectedItem: (value) => SelectedOwner({ value }) as Message,
                      items: owners,
                      placeholder: "Filter owner",
                    }),
                  ],
                ),
              ],
            ),
            div(
              [Class("flex flex-wrap items-center justify-between gap-3")],
              [
                Checkbox({
                  model: model.archived,
                  toParentMessage: (message) => GotArchivedMessage({ message }),
                  label: "Include archived",
                }),
                div(
                  [Class("flex items-center gap-2")],
                  [
                    Badge({ children: [`${count} active`] }),
                    Button({ variant: "outline", onClick: ClearedTableFilters(), children: ["Clear filters"] }),
                  ],
                ),
              ],
            ),
            div(
              [Class("grid gap-2")],
              [
                p([Class("m-0 text-sm font-medium")], ["Preview rows"]),
                ...["Request intake", "Billing question", "Design review"].map((row, index) =>
                  div(
                    [
                      Class(
                        "flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2",
                      ),
                    ],
                    [
                      span([Class("text-sm")], [row]),
                      Badge({
                        variant: index === 0 ? "default" : "secondary",
                        children: [index === 0 ? model.status : "open"],
                      }),
                    ],
                  ),
                ),
              ],
            ),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Search and filter", [
          ChangedTableSearch({ value: "design" }),
          ChangedTableStatus({ value: "pending" }),
          GotOwnerComboboxMessage({ message: UpdatedInputValue("ada") }),
          SelectedOwner({ value: "ada" }),
        ]),
        Preview.scenario("Include archived", [GotArchivedMessage({ message: Ui.Checkbox.Message() })]),
        Preview.scenario("Clear filters", [ChangedTableSearch({ value: "billing" }), ClearedTableFilters()]),
      ],
    }),
  ],
});

export { Message };
