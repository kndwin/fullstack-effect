import { Schema } from "effect";
import { Preview } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import * as Icon from "./icon.view";

const icons = [
  { label: "Chevron down", view: Icon.chevronDown },
  { label: "Chevron left", view: Icon.chevronLeft },
  { label: "Chevron right", view: Icon.chevronRight },
  { label: "Check", view: Icon.check },
  { label: "Pencil", view: Icon.pencil },
  { label: "Document duplicate", view: Icon.documentDuplicate },
  { label: "Archive box", view: Icon.archiveBox },
  { label: "Arrow right", view: Icon.arrowRight },
  { label: "Trash", view: Icon.trash },
  { label: "Menu", view: Icon.menu },
  { label: "X mark", view: Icon.xMark },
] as const;

export const IconPreview = Preview.module({
  title: "Ui/Icon",
  previews: [
    Preview.preview({
      name: "Set",
      view: () => {
        const { div, span, Class } = html<never>();

        return div(
          [Class("grid w-[min(42rem,calc(100vw-4rem))] gap-3")],
          icons.map((item) =>
            div(
              [
                Class(
                  "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground shadow-sm",
                ),
              ],
              [
                span(
                  [Class("flex size-9 items-center justify-center rounded-md bg-muted text-foreground")],
                  [item.view("size-5")],
                ),
                span([Class("text-sm font-medium")], [item.label]),
              ],
            ),
          ),
        );
      },
    }),
  ],
});

export const Message = Schema.Never;
