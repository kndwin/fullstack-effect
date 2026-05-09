import { Ui } from "foldkit";
import { html } from "foldkit/html";
import type { Attribute, Html } from "foldkit/html";

export type SliderProps<Message> = Readonly<{
  model: Ui.Slider.Model;
  toParentMessage: (message: Ui.Slider.Message) => Message;
  label: string;
  isDisabled?: boolean;
  name?: string;
  description?: string;
  formatValue?: (value: number) => string;
  attributes?: ReadonlyArray<Attribute<Message>>;
  labelClassName?: string;
  valueClassName?: string;
  rootClassName?: string;
  trackClassName?: string;
  filledTrackClassName?: string;
  thumbClassName?: string;
}>;

const defaultRootClassName = "relative flex h-8 w-full items-center";
const defaultTrackClassName = "relative h-2 w-full overflow-hidden rounded-full bg-muted";
const defaultFilledTrackClassName = "h-full rounded-full bg-primary";
const defaultThumbClassName =
  "absolute grid size-6 -translate-x-1/2 place-items-center rounded-full border-2 border-primary bg-background shadow-[var(--shadow-control)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring data-dragging:scale-110 data-disabled:opacity-50";

export const Slider = <Message>(props: SliderProps<Message>): Html => {
  const { div, input, label, p, span, Class, Type } = html<Message>();
  const formatValue = props.formatValue ?? ((value) => String(value));

  return Ui.Slider.view({
    model: props.model,
    toParentMessage: props.toParentMessage,
    isDisabled: props.isDisabled,
    formatValue,
    name: props.name,
    toView: (attributes) =>
      div(
        [...(props.attributes ?? []), Class("grid gap-2")],
        [
          div(
            [Class("flex items-end justify-between gap-[var(--space-card)]")],
            [
              label([...attributes.label, Class(props.labelClassName ?? "text-sm font-medium")], [props.label]),
              span(
                [Class(props.valueClassName ?? "font-mono text-sm text-muted-foreground")],
                [formatValue(props.model.value)],
              ),
            ],
          ),
          div(
            [...attributes.root, Class(props.rootClassName ?? defaultRootClassName)],
            [
              div(
                [...attributes.track, Class(props.trackClassName ?? defaultTrackClassName)],
                [
                  div(
                    [...attributes.filledTrack, Class(props.filledTrackClassName ?? defaultFilledTrackClassName)],
                    [],
                  ),
                ],
              ),
              div([...attributes.thumb, Class(props.thumbClassName ?? defaultThumbClassName)], []),
            ],
          ),
          input([...attributes.hiddenInput, Type("hidden")]),
          props.description ? p([Class("m-0 text-xs text-muted-foreground")], [props.description]) : span([], []),
        ],
      ),
  });
};

export const initSlider = Ui.Slider.init;
export const updateSlider = Ui.Slider.update;
export const SliderModel = Ui.Slider.Model;
export const SliderMessage = Ui.Slider.Message;
