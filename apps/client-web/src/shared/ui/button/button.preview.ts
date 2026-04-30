import { Schema } from "effect";
import { m } from "foldkit/message";
import type { PreviewControlValues } from "@qaveai/foldkit-preview";
import { Button } from "./button.view";

const ClickedPreviewButton = m("ClickedPreviewButton");

export const title = "Button";

export const previews = [
  {
    name: "Primary",
    controls: {
      label: { type: "text", defaultValue: "Primary" },
      isDisabled: { type: "boolean", defaultValue: false },
    },
    view: (controls: PreviewControlValues) =>
      Button({
        onClick: ClickedPreviewButton(),
        isDisabled: Boolean(controls.isDisabled),
        className: "rounded-full border-0 bg-[#72ffb6] px-[22px] py-[14px] font-extrabold text-[#092017]",
        children: [String(controls.label)],
      }),
  },
  {
    name: "Disabled",
    controls: {
      label: { type: "text", defaultValue: "Disabled" },
      isDisabled: { type: "boolean", defaultValue: true },
    },
    view: (controls: PreviewControlValues) =>
      Button({
        isDisabled: Boolean(controls.isDisabled),
        className: "rounded-full border-0 bg-[#72ffb6] px-[22px] py-[14px] font-extrabold text-[#092017] data-disabled:opacity-50",
        children: [String(controls.label)],
      }),
  },
  {
    name: "Ghost",
    controls: {
      label: { type: "text", defaultValue: "Ghost" },
      isDisabled: { type: "boolean", defaultValue: false },
    },
    view: (controls: PreviewControlValues) =>
      Button({
        onClick: ClickedPreviewButton(),
        isDisabled: Boolean(controls.isDisabled),
        className: "rounded-full border-0 bg-transparent px-3 py-2 text-[#a9bed0]",
        children: [String(controls.label)],
      }),
  },
] as const;

export const Message = Schema.Union(ClickedPreviewButton);
