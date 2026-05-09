import { Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Tabs } from "./tabs.view";

const GotPreviewTabsMessage = m("GotPreviewTabsMessage", {
  tabs: Schema.Literals(["horizontal", "vertical"]),
  message: Ui.Tabs.Message,
});

const Model = Schema.Struct({
  horizontal: Ui.Tabs.Model,
  vertical: Ui.Tabs.Model,
});

type Model = typeof Model.Type;

const init = (): Model => ({
  horizontal: Ui.Tabs.init({ id: "preview-tabs-horizontal" }),
  vertical: Ui.Tabs.init({ id: "preview-tabs-vertical", activeIndex: 1 }),
});

const update = (model: Model, message: typeof GotPreviewTabsMessage.Type): Model => ({
  ...model,
  [message.tabs]: Ui.Tabs.update(model[message.tabs], message.message)[0],
});

const tabItems = () => {
  const { p, Class } = html<Ui.Tabs.Message>();

  return [
    {
      label: "Foldkit",
      value: "foldkit",
      content: p(
        [Class("m-0 text-muted-foreground")],
        ["Model-View-Update with Effect, typed messages, and explicit commands."],
      ),
    },
    {
      label: "React",
      value: "react",
      content: p(
        [Class("m-0 text-muted-foreground")],
        ["Component-local state and hooks with rendering driven by function components."],
      ),
    },
    {
      label: "Elm",
      value: "elm",
      content: p(
        [Class("m-0 text-muted-foreground")],
        ["The original MVU architecture with pure update functions and managed effects."],
      ),
    },
  ] as const;
};

export const TabsPreview = Preview.module({
  title: "Ui/Tabs",
  previews: [
    Preview.preview({
      name: "States",
      init,
      update,
      view: (model: Model) => {
        const { div, Class } = html<typeof GotPreviewTabsMessage.Type>();

        return div(
          [Class("grid w-[min(40rem,calc(100vw-4rem))] gap-6")],
          [
            Tabs({
              model: model.horizontal,
              toParentMessage: (message) => GotPreviewTabsMessage({ tabs: "horizontal", message }),
              tabs: tabItems(),
              tabListAriaLabel: "Framework comparison",
            }),
            Tabs({
              model: model.vertical,
              toParentMessage: (message) => GotPreviewTabsMessage({ tabs: "vertical", message }),
              tabs: tabItems(),
              tabListAriaLabel: "Vertical framework comparison",
              orientation: "Vertical",
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        orientation: Preview.select("Horizontal", ["Horizontal", "Vertical"]),
        persistPanels: Preview.boolean(false),
      },
      init: () => Ui.Tabs.init({ id: "preview-tabs-replay" }),
      update: Ui.Tabs.update,
      view: (model: Ui.Tabs.Model, controls: PreviewControlValues) =>
        Tabs({
          model,
          toParentMessage: (message) => message,
          tabs: tabItems(),
          tabListAriaLabel: "Replay framework comparison",
          orientation: controls.orientation === "Vertical" ? "Vertical" : "Horizontal",
          persistPanels: Boolean(controls.persistPanels),
        }),
      scenarios: [
        Preview.scenario("Select React", [Ui.Tabs.TabSelected({ index: 1 })]),
        Preview.scenario("Select Elm", [Ui.Tabs.TabSelected({ index: 2 })]),
        Preview.scenario("Walk tabs", [
          Ui.Tabs.TabSelected({ index: 1 }),
          Ui.Tabs.TabSelected({ index: 2 }),
          Ui.Tabs.TabSelected({ index: 0 }),
        ]),
      ],
    }),
  ],
});

export const Message = Schema.Union([GotPreviewTabsMessage]);
