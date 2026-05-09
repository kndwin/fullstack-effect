import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Button } from "./button.view";

const ClickedPreviewButton = m("ClickedPreviewButton");

const buttonStates = (isDisabled = false) => {
  const { div, Class } = html<typeof ClickedPreviewButton.Type>();

  return div(
    [Class("flex flex-wrap items-center gap-3")],
    [
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "default", children: ["Default"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "secondary", children: ["Secondary"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "outline", children: ["Outline"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "ghost", children: ["Ghost"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "destructive", children: ["Destructive"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, variant: "link", children: ["Link"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, size: "sm", children: ["Small"] }),
      Button({ onClick: ClickedPreviewButton(), isDisabled, size: "lg", children: ["Large"] }),
    ],
  );
};

export const ButtonPreview = Preview.module({
  title: "Ui/Button",
  previews: [
    Preview.preview({
      name: "States",
      view: () => buttonStates(),
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        isDisabled: Preview.boolean(false),
      },
      view: (controls: PreviewControlValues) => buttonStates(Boolean(controls.isDisabled)),
      scenarios: [
        Preview.scenario("Click default", [ClickedPreviewButton()]),
        Preview.scenario("Click three times", [ClickedPreviewButton(), ClickedPreviewButton(), ClickedPreviewButton()]),
      ],
    }),
  ],
});

export const Message = Schema.Union([ClickedPreviewButton]);
