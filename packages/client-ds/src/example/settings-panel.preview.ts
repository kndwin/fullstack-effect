import { Schema } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Alert, AlertDescription, AlertTitle } from "../alert/alert.view";
import { Button } from "../button/button.view";
import { RadioGroup } from "../radio-group/radio-group.view";
import { Select } from "../select/select.view";
import { Separator } from "../separator/separator.view";
import { Slider } from "../slider/slider.view";
import { Switch } from "../switch/switch.view";
import { Tabs } from "../tabs/tabs.view";

const GotSettingsTabsMessage = m("GotSettingsTabsMessage", { message: Ui.Tabs.Message });
const GotEmailSwitchMessage = m("GotEmailSwitchMessage", { message: Ui.Switch.Message });
const GotDigestSwitchMessage = m("GotDigestSwitchMessage", { message: Ui.Switch.Message });
const GotDensityMessage = m("GotDensityMessage", { message: Ui.RadioGroup.Message });
const GotRetentionMessage = m("GotRetentionMessage", { message: Ui.Slider.Message });
const ChangedTheme = m("ChangedTheme", { value: Schema.String });
const SavedSettings = m("SavedSettings");
const PressedRetentionPointer = m("PressedPointer", { value: Schema.Number });

const Message = Schema.Union([
  GotSettingsTabsMessage,
  GotEmailSwitchMessage,
  GotDigestSwitchMessage,
  GotDensityMessage,
  GotRetentionMessage,
  ChangedTheme,
  SavedSettings,
  PressedRetentionPointer,
]);
type Message = typeof Message.Type;

const Model = Schema.Struct({
  tabs: Ui.Tabs.Model,
  email: Ui.Switch.Model,
  digest: Ui.Switch.Model,
  density: Ui.RadioGroup.Model,
  retention: Ui.Slider.Model,
  theme: Schema.String,
  isSaved: Schema.Boolean,
});
type Model = typeof Model.Type;

const init = (): Model => ({
  tabs: Ui.Tabs.init({ id: "example-settings-tabs" }),
  email: Ui.Switch.init({ id: "example-settings-email", isChecked: true }),
  digest: Ui.Switch.init({ id: "example-settings-digest", isChecked: false }),
  density: Ui.RadioGroup.init({ id: "example-settings-density", selectedValue: "comfortable" }),
  retention: Ui.Slider.init({ id: "example-settings-retention", min: 7, max: 90, step: 1, initialValue: 30 }),
  theme: "system",
  isSaved: false,
});

const update = (model: Model, message: Message): Model => {
  switch (message._tag) {
    case "GotSettingsTabsMessage":
      return { ...model, tabs: Ui.Tabs.update(model.tabs, message.message)[0], isSaved: false };
    case "GotEmailSwitchMessage":
      return { ...model, email: Ui.Switch.update(model.email, message.message)[0], isSaved: false };
    case "GotDigestSwitchMessage":
      return { ...model, digest: Ui.Switch.update(model.digest, message.message)[0], isSaved: false };
    case "GotDensityMessage":
      return { ...model, density: Ui.RadioGroup.update(model.density, message.message)[0], isSaved: false };
    case "GotRetentionMessage":
      return { ...model, retention: Ui.Slider.update(model.retention, message.message)[0], isSaved: false };
    case "PressedPointer":
      return { ...model, retention: Ui.Slider.update(model.retention, message)[0], isSaved: false };
    case "ChangedTheme":
      return { ...model, theme: message.value, isSaved: false };
    case "SavedSettings":
      return { ...model, isSaved: true };
  }
};

const panel = (model: Model) => {
  const { div, p, span, Class } = html<Message>();

  return div(
    [Class("grid gap-5")],
    [
      div(
        [Class("grid gap-4")],
        [
          Select({
            id: "example-settings-theme",
            label: "Theme",
            value: model.theme,
            options: [
              { label: "System", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ],
            onChange: (value) => ChangedTheme({ value }),
          }),
          RadioGroup({
            model: model.density,
            toParentMessage: (message) => GotDensityMessage({ message }),
            ariaLabel: "Interface density",
            orientation: "Horizontal",
            options: [
              { label: "Compact", value: "compact", description: "More rows" },
              { label: "Comfort", value: "comfortable", description: "Balanced" },
              { label: "Spacious", value: "spacious", description: "More air" },
            ],
          }),
        ],
      ),
      Separator({}),
      div(
        [Class("grid gap-4")],
        [
          Switch({
            model: model.email,
            toParentMessage: (message) => GotEmailSwitchMessage({ message }),
            label: "Email notifications",
            description: "Send important workspace updates by email.",
          }),
          Switch({
            model: model.digest,
            toParentMessage: (message) => GotDigestSwitchMessage({ message }),
            label: "Weekly digest",
            description: "Summarize activity every Monday morning.",
          }),
        ],
      ),
      Separator({}),
      Slider({
        model: model.retention,
        toParentMessage: (message) => GotRetentionMessage({ message }),
        label: "Audit retention",
        description: "How long activity logs remain visible in the workspace.",
        formatValue: (value) => `${value} days`,
      }),
      div(
        [Class("flex items-center justify-between gap-3")],
        [
          span([Class("text-sm text-muted-foreground")], [model.isSaved ? "Saved" : "Unsaved changes"]),
          Button({ onClick: SavedSettings(), children: ["Save settings"] }),
        ],
      ),
      model.isSaved
        ? Alert({
            children: [
              AlertTitle({ children: ["Settings saved"] }),
              AlertDescription({ children: ["Preferences updated."] }),
            ],
          })
        : p([Class("m-0 text-sm text-muted-foreground")], ["Use replay to walk through several controls at once."]),
    ],
  );
};

export const SettingsPanelPreview = Preview.module({
  title: "Example/Settings Panel",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view: (model: Model) => {
        const { div, h2, p, Class } = html<Message>();
        return div(
          [Class("w-[min(46rem,calc(100vw-4rem))] rounded-xl border border-border bg-card p-5 shadow-sm")],
          [
            div(
              [Class("mb-4 grid gap-1")],
              [
                h2([Class("m-0 text-2xl font-semibold")], ["Workspace settings"]),
                p([Class("m-0 text-sm text-muted-foreground")], ["A dense preferences surface using semantic tokens."]),
              ],
            ),
            Tabs({
              model: model.tabs,
              toParentMessage: (message) => GotSettingsTabsMessage({ message }),
              tabListAriaLabel: "Settings sections",
              tabs: [
                { label: "General", value: "general", content: panel(model) },
                { label: "Access", value: "access", content: "Access settings placeholder" },
                { label: "Billing", value: "billing", content: "Billing settings placeholder", isDisabled: true },
              ],
            }),
          ],
        );
      },
      scenarios: [
        Preview.scenario("Tune settings", [
          ChangedTheme({ value: "dark" }),
          GotEmailSwitchMessage({ message: Ui.Switch.Message() }),
          GotDigestSwitchMessage({ message: Ui.Switch.Message() }),
          GotDensityMessage({ message: Ui.RadioGroup.SelectedOption({ value: "compact", index: 0 }) }),
          PressedRetentionPointer({ value: 45 }),
        ]),
        Preview.scenario("Save settings", [ChangedTheme({ value: "light" }), SavedSettings()]),
      ],
    }),
  ],
});

export { Message };
