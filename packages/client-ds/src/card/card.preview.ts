import { Schema } from "effect";
import { Preview } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Button } from "../button/button.view";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card.view";

const ClickedCardAction = m("ClickedCardAction");

export const CardPreview = Preview.module({
  title: "Ui/Card",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, p, Class } = html<typeof ClickedCardAction.Type>();

        return div(
          [Class("w-[min(28rem,calc(100vw-4rem))]")],
          [
            Card({
              children: [
                CardHeader({
                  children: [
                    CardTitle({ children: ["Project health"] }),
                    CardDescription({ children: ["A compact surface for grouped content and actions."] }),
                  ],
                }),
                CardContent({
                  children: [
                    p(
                      [Class("m-0 text-sm leading-6 text-muted-foreground")],
                      [
                        "Radix color tokens drive the background, borders, focus rings, and muted foregrounds while Foldkit owns the behavior.",
                      ],
                    ),
                  ],
                }),
                CardFooter({
                  className: "flex justify-end gap-2 p-6 pt-0",
                  children: [
                    Button({ onClick: ClickedCardAction(), variant: "outline", children: ["Cancel"] }),
                    Button({ onClick: ClickedCardAction(), children: ["Save"] }),
                  ],
                }),
              ],
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      view: () => {
        const { div, p, Class } = html<typeof ClickedCardAction.Type>();

        return div(
          [Class("w-[min(28rem,calc(100vw-4rem))]")],
          [
            Card({
              children: [
                CardHeader({
                  children: [
                    CardTitle({ children: ["Replay card"] }),
                    CardDescription({ children: ["Use scenarios to emit card action messages."] }),
                  ],
                }),
                CardContent({
                  children: [
                    p(
                      [Class("m-0 text-sm leading-6 text-muted-foreground")],
                      ["Cards are visual primitives, but this preview includes buttons so replay can exercise events."],
                    ),
                  ],
                }),
                CardFooter({
                  className: "flex justify-end gap-2 p-6 pt-0",
                  children: [
                    Button({ onClick: ClickedCardAction(), variant: "outline", children: ["Cancel"] }),
                    Button({ onClick: ClickedCardAction(), children: ["Save"] }),
                  ],
                }),
              ],
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Click save", [ClickedCardAction()]),
        Preview.scenario("Click twice", [ClickedCardAction(), ClickedCardAction()]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ClickedCardAction]);
