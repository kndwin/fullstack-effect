import { Schema } from "effect";
import { Ui } from "foldkit";
import { m } from "foldkit/message";
import type { PreviewControlValues } from "@qaveai/foldkit-preview";
import { Checkbox } from "./checkbox.view";

const GotPreviewCheckboxMessage = m("GotPreviewCheckboxMessage", {
  message: Ui.Checkbox.Message,
});

export const title = "Checkbox";

export const previews = [
  {
    name: "Unchecked",
    controls: {
      label: { type: "text", defaultValue: "Accept terms" },
      description: { type: "text", defaultValue: "Unchecked state with linked label and description." },
      isChecked: { type: "boolean", defaultValue: false },
      isDisabled: { type: "boolean", defaultValue: false },
      isIndeterminate: { type: "boolean", defaultValue: false },
    },
    view: (controls: PreviewControlValues) =>
      Checkbox({
        model: Ui.Checkbox.init({ id: "preview-unchecked", isChecked: Boolean(controls.isChecked) }),
        toParentMessage: (message) => GotPreviewCheckboxMessage({ message }),
        label: String(controls.label),
        description: String(controls.description),
        isDisabled: Boolean(controls.isDisabled),
        isIndeterminate: Boolean(controls.isIndeterminate),
      }),
  },
  {
    name: "Checked",
    controls: {
      label: { type: "text", defaultValue: "Email notifications" },
      description: { type: "text", defaultValue: "Checked state uses the Foldkit data-checked attribute." },
      isChecked: { type: "boolean", defaultValue: true },
      isDisabled: { type: "boolean", defaultValue: false },
      isIndeterminate: { type: "boolean", defaultValue: false },
    },
    view: (controls: PreviewControlValues) =>
      Checkbox({
        model: Ui.Checkbox.init({ id: "preview-checked", isChecked: Boolean(controls.isChecked) }),
        toParentMessage: (message) => GotPreviewCheckboxMessage({ message }),
        label: String(controls.label),
        description: String(controls.description),
        isDisabled: Boolean(controls.isDisabled),
        isIndeterminate: Boolean(controls.isIndeterminate),
      }),
  },
  {
    name: "Indeterminate",
    controls: {
      label: { type: "text", defaultValue: "All notifications" },
      description: { type: "text", defaultValue: "Mixed state uses aria-checked=\"mixed\"." },
      isChecked: { type: "boolean", defaultValue: false },
      isDisabled: { type: "boolean", defaultValue: false },
      isIndeterminate: { type: "boolean", defaultValue: true },
    },
    view: (controls: PreviewControlValues) =>
      Checkbox({
        model: Ui.Checkbox.init({ id: "preview-indeterminate", isChecked: Boolean(controls.isChecked) }),
        toParentMessage: (message) => GotPreviewCheckboxMessage({ message }),
        isIndeterminate: Boolean(controls.isIndeterminate),
        isDisabled: Boolean(controls.isDisabled),
        label: String(controls.label),
        description: String(controls.description),
      }),
  },
  {
    name: "Disabled",
    controls: {
      label: { type: "text", defaultValue: "Disabled checkbox" },
      description: { type: "text", defaultValue: "Disabled state remains accessible with aria-disabled." },
      isChecked: { type: "boolean", defaultValue: true },
      isDisabled: { type: "boolean", defaultValue: true },
      isIndeterminate: { type: "boolean", defaultValue: false },
    },
    view: (controls: PreviewControlValues) =>
      Checkbox({
        model: Ui.Checkbox.init({ id: "preview-disabled", isChecked: Boolean(controls.isChecked) }),
        toParentMessage: (message) => GotPreviewCheckboxMessage({ message }),
        isDisabled: Boolean(controls.isDisabled),
        isIndeterminate: Boolean(controls.isIndeterminate),
        label: String(controls.label),
        description: String(controls.description),
      }),
  },
] as const;

export const Message = Schema.Union(GotPreviewCheckboxMessage);
