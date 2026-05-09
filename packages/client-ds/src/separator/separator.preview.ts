import { Schema } from "effect";
import { Preview } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { Separator } from "./separator.view";

export const SeparatorPreview = Preview.module({
  title: "Ui/Separator",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, p, Class } = html<never>();

        return div(
          [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-4")],
          [
            p([Class("m-0 text-sm font-medium")], ["Account"]),
            Separator({}),
            p(
              [Class("m-0 text-sm text-muted-foreground")],
              ["Manage billing, team access, and notification settings."],
            ),
            div(
              [Class("flex h-8 items-center gap-4 text-sm")],
              [
                p([Class("m-0")], ["Profile"]),
                Separator({ orientation: "vertical" }),
                p([Class("m-0")], ["Billing"]),
                Separator({ orientation: "vertical" }),
                p([Class("m-0")], ["Team"]),
              ],
            ),
          ],
        );
      },
    }),
  ],
});

export const Message = Schema.Never;
