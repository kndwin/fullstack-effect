import { Schema } from "effect";
import { Preview } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { Alert, AlertDescription, AlertTitle } from "./alert.view";

export const AlertPreview = Preview.module({
  title: "Ui/Alert",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, Class } = html<never>();

        return div(
          [Class("grid w-[min(34rem,calc(100vw-4rem))] gap-4")],
          [
            Alert({
              children: [
                AlertTitle({ children: ["Heads up"] }),
                AlertDescription({
                  children: ["This surface uses Radix-backed semantic tokens and can hold any Foldkit view."],
                }),
              ],
            }),
            Alert({
              variant: "destructive",
              children: [
                AlertTitle({ children: ["Something went wrong"] }),
                AlertDescription({
                  children: ["Destructive styling uses the red Radix scale through semantic tokens."],
                }),
              ],
            }),
          ],
        );
      },
    }),
  ],
});

export const Message = Schema.Never;
