import { Preview } from "@qaveai/foldkit-preview";
import type { PreviewControlValues } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import { AuthFailed, AuthLoaded, AuthLoggedOut, AuthLogoutClicked, AuthStarted, AuthMessage } from "./auth.message";
import type { AuthModel } from "./auth.model";
import { update } from "./auth.update";
import { authGateView } from "./auth.view";

const previewSession = {
  user: {
    id: "user_preview_123",
    email: "ada@example.com",
    name: "Ada Lovelace",
    avatarUrl: null,
  },
};

type AuthPreviewModel = Readonly<{
  auth: AuthModel;
}>;

const wrap = (message: typeof AuthMessage.Type) => message;

const sessionFromControls = (controls: PreviewControlValues) => ({
  user: {
    id: "user_preview_123",
    email: String(controls.email),
    name: String(controls.name),
    avatarUrl: null,
  },
});

const modelFromControls = (controls: PreviewControlValues): AuthModel => {
  const initialState = String(controls.initialState);

  if (initialState === "signedIn") return { session: sessionFromControls(controls), loading: false, error: null };
  if (initialState === "signedOut") return { session: null, loading: false, error: null };
  if (initialState === "error") return { session: null, loading: false, error: String(controls.errorMessage) };

  return { session: null, loading: true, error: null };
};

const authFrame = (children: Html) => {
  const { main, div, Class } = html<typeof AuthMessage.Type>();

  return main(
    [Class("min-h-screen bg-background p-6 text-foreground sm:p-10")],
    [div([Class("mx-auto grid w-full max-w-md gap-5")], [children])],
  );
};

const authStates = () => {
  const { div, h2, Class } = html<typeof AuthMessage.Type>();

  const example = (label: string, model: AuthModel) =>
    div(
      [Class("grid gap-3")],
      [h2([Class("text-sm font-medium text-muted-foreground")], [label]), authGateView(model, wrap)],
    );

  return authFrame(
    div(
      [Class("grid gap-8")],
      [
        example("Loading", { session: null, loading: true, error: null }),
        example("Signed out", { session: null, loading: false, error: null }),
        example("Error", { session: null, loading: false, error: "Google sign-in failed." }),
        example("Signed in", { session: previewSession, loading: false, error: null }),
      ],
    ),
  );
};

const initReplay = (controls: PreviewControlValues): AuthPreviewModel => ({
  auth: modelFromControls(controls),
});

const updateReplay = (model: AuthPreviewModel, message: typeof AuthMessage.Type) => {
  const [auth, commands] = update(model.auth, message);

  return [{ auth }, commands] as const;
};

const replayView = (model: AuthPreviewModel, controls: PreviewControlValues) => {
  void controls;

  return authFrame(authGateView(model.auth, wrap));
};

export const AuthPreview = Preview.module({
  title: "Module/Auth",
  previews: [
    Preview.preview({
      name: "States",
      view: authStates,
    }),
    Preview.preview({
      name: "Replay",
      controls: {
        initialState: Preview.select("signedOut", ["loading", "signedOut", "signedIn", "error"]),
        email: Preview.text("ada@example.com"),
        name: Preview.text("Ada Lovelace"),
        errorMessage: Preview.text("Google sign-in failed."),
      },
      init: initReplay,
      update: updateReplay,
      view: replayView,
      scenarios: [
        Preview.scenario("Initial load signed out", [
          AuthStarted(),
          Preview.step(AuthLoaded({ session: null }), { delayMs: 500 }),
        ]),
        Preview.scenario("Mock Google sign in", [
          AuthLoaded({ session: null }),
          AuthStarted(),
          Preview.step(AuthLoaded({ session: previewSession }), { delayMs: 700 }),
        ]),
        Preview.scenario("Failed sign in then retry", [
          AuthLoaded({ session: null }),
          AuthStarted(),
          Preview.step(AuthFailed({ message: "Google sign-in failed." }), { delayMs: 700 }),
          AuthStarted(),
          Preview.step(AuthLoaded({ session: previewSession }), { delayMs: 700 }),
        ]),
        Preview.scenario("Sign in then logout", [
          AuthLoaded({ session: null }),
          AuthStarted(),
          Preview.step(AuthLoaded({ session: previewSession }), { delayMs: 700 }),
          AuthLogoutClicked(),
          Preview.step(AuthLoggedOut(), { delayMs: 500 }),
        ]),
        Preview.scenario("Logout failure", [
          AuthLoaded({ session: previewSession }),
          AuthLogoutClicked(),
          Preview.step(AuthFailed({ message: "Mocked logout failed." }), { delayMs: 500 }),
        ]),
        Preview.scenario("Kitchen sink", [
          AuthStarted(),
          Preview.step(AuthLoaded({ session: null }), { delayMs: 400 }),
          AuthStarted(),
          Preview.step(AuthFailed({ message: "Popup was closed before approval." }), { delayMs: 600 }),
          AuthStarted(),
          Preview.step(AuthLoaded({ session: previewSession }), { delayMs: 700 }),
          AuthLogoutClicked(),
          Preview.step(AuthFailed({ message: "Session revoke timed out." }), { delayMs: 500 }),
          AuthLogoutClicked(),
          Preview.step(AuthLoggedOut(), { delayMs: 500 }),
        ]),
      ],
      commandResolutions: {
        AuthCommandMe: [
          {
            label: "Resolve signed in",
            message: () => AuthLoaded({ session: previewSession }),
          },
          { label: "Resolve signed out", message: () => AuthLoaded({ session: null }) },
          { label: "Resolve failed", message: () => AuthFailed({ message: "Mocked auth load failed." }) },
        ],
        AuthCommandLogout: [
          { label: "Resolve logged out", message: () => AuthLoggedOut() },
          { label: "Resolve failed", message: () => AuthFailed({ message: "Mocked logout failed." }) },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([AuthMessage]);
