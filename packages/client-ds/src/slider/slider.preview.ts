import { Option, Schema } from "effect";
import { Preview, type PreviewControlValues } from "@qaveai/foldkit-preview";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Slider } from "./slider.view";

type SliderPreviewModel = Readonly<{
  slider: Ui.Slider.Model;
  messages: ReadonlyArray<string>;
}>;

type SliderStatesModel = Readonly<{
  low: Ui.Slider.Model;
  mid: Ui.Slider.Model;
  high: Ui.Slider.Model;
  disabled: Ui.Slider.Model;
}>;

const messageText = (message: Ui.Slider.Message): string => {
  switch (message._tag) {
    case "PressedKeyboardNavigation":
      return `${message._tag}(${message.direction})`;
    case "PressedPointer":
    case "MovedDragPointer":
      return `${message._tag}(${message.value})`;
    case "PressedThumb":
    case "ReleasedDragPointer":
    case "CancelledDrag":
      return message._tag;
  }
};

const initSliderPreview = (): SliderPreviewModel => ({
  slider: Ui.Slider.init({
    id: "preview-volume-slider",
    min: 0,
    max: 100,
    step: 5,
    initialValue: 35,
  }),
  messages: ["Ready"],
});

const updateSliderPreview = (model: SliderPreviewModel, message: Ui.Slider.Message): SliderPreviewModel => {
  const [slider, _commands, outMessage] = Ui.Slider.update(model.slider, message);
  const nextMessages = [messageText(message)];

  if (Option.isSome(outMessage)) {
    nextMessages.push(`Out:${outMessage.value._tag}(${outMessage.value.value})`);
  }

  return {
    slider,
    messages: [...nextMessages, ...model.messages].slice(0, 8),
  };
};

const PressedPointer = m("PressedPointer", {
  value: Schema.Number,
});

const MovedDragPointer = m("MovedDragPointer", {
  value: Schema.Number,
});

const ReleasedDragPointer = m("ReleasedDragPointer");

const PressedKeyboardNavigation = m("PressedKeyboardNavigation", {
  direction: Schema.Literal("StepIncrement"),
});

const GotPreviewSliderStateMessage = m("GotPreviewSliderStateMessage", {
  slider: Schema.Literals(["low", "mid", "high", "disabled"]),
  message: Ui.Slider.Message,
});

const initSliderStates = (): SliderStatesModel => ({
  low: Ui.Slider.init({ id: "preview-slider-low", min: 0, max: 100, step: 5, initialValue: 20 }),
  mid: Ui.Slider.init({ id: "preview-slider-mid", min: 0, max: 100, step: 5, initialValue: 50 }),
  high: Ui.Slider.init({ id: "preview-slider-high", min: 0, max: 100, step: 5, initialValue: 80 }),
  disabled: Ui.Slider.init({ id: "preview-slider-disabled", min: 0, max: 100, step: 5, initialValue: 60 }),
});

const updateSliderStates = (
  model: SliderStatesModel,
  message: typeof GotPreviewSliderStateMessage.Type,
): SliderStatesModel => ({
  ...model,
  [message.slider]: Ui.Slider.update(model[message.slider], message.message)[0],
});

const viewSliderPreview = (model: SliderPreviewModel, controls: PreviewControlValues) => {
  const { div, Class } = html<Ui.Slider.Message>();
  const isDisabled = Boolean(controls.isDisabled);

  return div(
    [Class("w-[min(28rem,calc(100vw-4rem))]")],
    [
      Slider({
        model: model.slider,
        toParentMessage: (message) => message,
        label: String(controls.label),
        isDisabled,
        formatValue: (value) => `${value}%`,
        name: "preview-volume",
        labelClassName: "text-sm font-bold tracking-wide",
        valueClassName: "font-mono text-2xl font-black text-primary",
        description: "Replay drags the slider and streams messages in the right panel.",
      }),
    ],
  );
};

export const SliderPreview = Preview.module({
  title: "Ui/Slider",
  previews: [
    Preview.preview({
      name: "States",
      init: initSliderStates,
      update: updateSliderStates,
      view: (model: SliderStatesModel) => {
        const { div, Class } = html<typeof GotPreviewSliderStateMessage.Type>();
        const slider = (key: keyof SliderStatesModel, labelText: string, isDisabled = false) =>
          Slider({
            model: model[key],
            toParentMessage: (message) => GotPreviewSliderStateMessage({ slider: key, message }),
            label: labelText,
            isDisabled,
            formatValue: (value) => `${value}%`,
          });

        return div(
          [Class("grid w-[min(28rem,calc(100vw-4rem))] gap-5")],
          [slider("low", "Low"), slider("mid", "Medium"), slider("high", "High"), slider("disabled", "Disabled", true)],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        label: Preview.text("Volume"),
        isDisabled: Preview.boolean(false),
      },
      init: initSliderPreview,
      update: updateSliderPreview,
      view: viewSliderPreview,
      scenarios: [
        Preview.scenario("Drag then keyboard", [
          PressedPointer({ value: 45 }),
          MovedDragPointer({ value: 70 }),
          MovedDragPointer({ value: 90 }),
          ReleasedDragPointer(),
          PressedKeyboardNavigation({ direction: "StepIncrement" }),
        ]),
        Preview.scenario("Short drag", [
          PressedPointer({ value: 45 }),
          MovedDragPointer({ value: 55 }),
          ReleasedDragPointer(),
        ]),
        Preview.scenario("Long drag", [
          PressedPointer({ value: 20 }),
          MovedDragPointer({ value: 40 }),
          MovedDragPointer({ value: 65 }),
          MovedDragPointer({ value: 95 }),
          ReleasedDragPointer(),
        ]),
        Preview.scenario("Keyboard twice", [
          PressedKeyboardNavigation({ direction: "StepIncrement" }),
          PressedKeyboardNavigation({ direction: "StepIncrement" }),
        ]),
      ],
    }),
  ],
});
