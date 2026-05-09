import { Schema } from "effect";
import { Preview } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { Badge } from "./badge.view";

export const BadgePreview = Preview.module({
  title: "Ui/Badge",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, Class } = html<never>();

        return div(
          [Class("flex flex-wrap items-center gap-3")],
          [
            Badge({ children: ["Default"] }),
            Badge({ variant: "secondary", children: ["Secondary"] }),
            Badge({ variant: "outline", children: ["Outline"] }),
            Badge({ variant: "destructive", children: ["Destructive"] }),
          ],
        );
      },
    }),
  ],
});

export const Message = Schema.Never;
