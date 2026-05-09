import { Schema } from "effect";
import { Ui } from "foldkit";
import { html } from "foldkit/html";
import { m } from "foldkit/message";
import { Preview } from "@qaveai/foldkit-preview";
import { Alert, AlertDescription, AlertTitle } from "../alert/alert.view";
import { Button } from "../button/button.view";
import { Checkbox } from "../checkbox/checkbox.view";
import { Fieldset } from "../fieldset/fieldset.view";
import { Input } from "../input/input.view";
import { Select } from "../select/select.view";
import { Textarea } from "../textarea/textarea.view";

const NotSubmitted = m("NotSubmitted");
const SubmitSuccess = m("SubmitSuccess");
const SubmitError = m("SubmitError");

const ChangedFormName = m("ChangedFormName", { value: Schema.String });
const ChangedFormEmail = m("ChangedFormEmail", { value: Schema.String });
const ChangedFormPlan = m("ChangedFormPlan", { value: Schema.String });
const ChangedFormMessage = m("ChangedFormMessage", { value: Schema.String });
const GotFormTermsMessage = m("GotFormTermsMessage", { message: Ui.Checkbox.Message });
const SubmittedExampleForm = m("SubmittedExampleForm");
const ResolvedExampleForm = m("ResolvedExampleForm", { outcome: Schema.Literals(["success", "error"]) });

const Submission = Schema.Union([NotSubmitted, SubmitSuccess, SubmitError]);

const Model = Schema.Struct({
  name: Schema.String,
  email: Schema.String,
  plan: Schema.String,
  message: Schema.String,
  terms: Ui.Checkbox.Model,
  hasSubmitted: Schema.Boolean,
  submission: Submission,
});

type Model = typeof Model.Type;
type Message = typeof Message.Type;

const Message = Schema.Union([
  ChangedFormName,
  ChangedFormEmail,
  ChangedFormPlan,
  ChangedFormMessage,
  GotFormTermsMessage,
  SubmittedExampleForm,
  ResolvedExampleForm,
]);

const init = (): Model => ({
  name: "",
  email: "",
  plan: "starter",
  message: "",
  terms: Ui.Checkbox.init({ id: "example-form-terms", isChecked: false }),
  hasSubmitted: false,
  submission: NotSubmitted(),
});

const isEmailValid = (value: string): boolean => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const isFormValid = (model: Model): boolean =>
  model.name.trim().length >= 2 && isEmailValid(model.email) && model.terms.isChecked;

const showErrors = (model: Model): boolean => model.hasSubmitted || model.submission._tag !== "NotSubmitted";

const update = (model: Model, message: Message): Model => {
  switch (message._tag) {
    case "ChangedFormName":
      return { ...model, name: message.value, submission: NotSubmitted() };
    case "ChangedFormEmail":
      return { ...model, email: message.value, submission: NotSubmitted() };
    case "ChangedFormPlan":
      return { ...model, plan: message.value, submission: NotSubmitted() };
    case "ChangedFormMessage":
      return { ...model, message: message.value, submission: NotSubmitted() };
    case "GotFormTermsMessage":
      return { ...model, terms: Ui.Checkbox.update(model.terms, message.message)[0], submission: NotSubmitted() };
    case "SubmittedExampleForm":
      return isFormValid(model)
        ? { ...model, hasSubmitted: true, submission: SubmitSuccess() }
        : { ...model, hasSubmitted: true };
    case "ResolvedExampleForm":
      return {
        ...model,
        hasSubmitted: true,
        submission: message.outcome === "success" ? SubmitSuccess() : SubmitError(),
      };
  }
};

const nameDescription = (model: Model): string => {
  if (!showErrors(model) || model.name.trim().length >= 2) return "Use at least 2 characters.";
  return "Name must be at least 2 characters.";
};

const emailDescription = (model: Model): string => {
  if (!showErrors(model) || isEmailValid(model.email)) return "We'll only use this for the response.";
  return "Enter a valid email address.";
};

const termsDescription = (model: Model): string => {
  if (!showErrors(model) || model.terms.isChecked) return "Required before submitting the form.";
  return "Accept the terms to continue.";
};

const view = (model: Model) => {
  const { div, form, h2, p, span, Class, OnSubmit, Role } = html<Message>();
  const errorsVisible = showErrors(model);
  const canSubmit = isFormValid(model);

  return div(
    [Class("w-[min(42rem,calc(100vw-4rem))]")],
    [
      form(
        [OnSubmit(SubmittedExampleForm()), Class("grid gap-5 rounded-xl border border-border bg-card p-6 shadow-sm")],
        [
          div(
            [Class("grid gap-1")],
            [
              h2([Class("m-0 text-2xl font-semibold tracking-tight")], ["Contact request"]),
              p(
                [Class("m-0 text-sm leading-6 text-muted-foreground")],
                ["A generic form preview for exercising field validation, grouped controls, and submit states."],
              ),
            ],
          ),
          Fieldset({
            id: "example-form-details",
            legend: "Details",
            description: "Fill out the required fields and replay changes from the inspector.",
            children: [
              Input({
                id: "example-form-name",
                label: "Name",
                value: model.name,
                placeholder: "Ada Lovelace",
                isInvalid: errorsVisible && model.name.trim().length < 2,
                description: nameDescription(model),
                onInput: (value) => ChangedFormName({ value }),
              }),
              Input({
                id: "example-form-email",
                label: "Email",
                type: "email",
                value: model.email,
                placeholder: "ada@example.com",
                isInvalid: errorsVisible && !isEmailValid(model.email),
                description: emailDescription(model),
                onInput: (value) => ChangedFormEmail({ value }),
              }),
              Select({
                id: "example-form-plan",
                label: "Plan",
                value: model.plan,
                options: [
                  { label: "Starter", value: "starter" },
                  { label: "Team", value: "team" },
                  { label: "Enterprise", value: "enterprise" },
                ],
                description: "Native select wired into the same update loop.",
                onChange: (value) => ChangedFormPlan({ value }),
              }),
              Textarea({
                id: "example-form-message",
                label: "Message",
                value: model.message,
                placeholder: "Tell us what you are building...",
                rows: 4,
                description: "Optional context for the request.",
                onInput: (value) => ChangedFormMessage({ value }),
              }),
              Checkbox({
                model: model.terms,
                toParentMessage: (message) => GotFormTermsMessage({ message }),
                label: "I agree to be contacted about this request",
                description: termsDescription(model),
                descriptionClassName: `m-0 text-sm ${errorsVisible && !model.terms.isChecked ? "text-destructive" : "text-muted-foreground"}`,
              }),
            ],
          }),
          div(
            [Class("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between")],
            [
              span(
                [Class("text-sm text-muted-foreground")],
                [canSubmit ? "Ready to submit." : "Complete required fields."],
              ),
              Button({ type: "submit", isDisabled: !canSubmit, children: ["Submit request"] }),
            ],
          ),
          model.submission._tag === "SubmitSuccess"
            ? Alert({
                attributes: [Role("status")],
                children: [
                  AlertTitle({ children: ["Request submitted"] }),
                  AlertDescription({ children: [`Thanks ${model.name.trim()}, your ${model.plan} request is ready.`] }),
                ],
              })
            : model.submission._tag === "SubmitError"
              ? Alert({
                  variant: "destructive",
                  attributes: [Role("alert")],
                  children: [
                    AlertTitle({ children: ["Submission failed"] }),
                    AlertDescription({ children: ["Try again after checking the entered details."] }),
                  ],
                })
              : div([], []),
        ],
      ),
    ],
  );
};

export const ExampleFormPreview = Preview.module({
  title: "Example/Form",
  previews: [
    Preview.preview({
      name: "Playground",
      init,
      update,
      view,
      scenarios: [
        Preview.scenario("Invalid submit", [SubmittedExampleForm()]),
        Preview.scenario("Fill valid form", [
          ChangedFormName({ value: "Ada Lovelace" }),
          ChangedFormEmail({ value: "ada@example.com" }),
          ChangedFormPlan({ value: "team" }),
          ChangedFormMessage({ value: "I am evaluating the design system for an internal tool." }),
          GotFormTermsMessage({ message: Ui.Checkbox.Message() }),
        ]),
        Preview.scenario("Submit success", [
          ChangedFormName({ value: "Ada Lovelace" }),
          ChangedFormEmail({ value: "ada@example.com" }),
          ChangedFormPlan({ value: "team" }),
          GotFormTermsMessage({ message: Ui.Checkbox.Message() }),
          SubmittedExampleForm(),
        ]),
        Preview.scenario("Submit error", [
          ChangedFormName({ value: "Grace Hopper" }),
          ChangedFormEmail({ value: "grace@example.com" }),
          ChangedFormPlan({ value: "enterprise" }),
          GotFormTermsMessage({ message: Ui.Checkbox.Message() }),
          ResolvedExampleForm({ outcome: "error" }),
        ]),
      ],
    }),
  ],
});

export { Message };
