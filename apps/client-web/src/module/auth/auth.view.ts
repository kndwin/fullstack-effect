import { Button } from "@qaveai/client-ds/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qaveai/client-ds/card";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import { backendUrl } from "../../backend-origin";
import type { AuthModel } from "./auth.model";
import { AuthLogoutClicked, type AuthMessage } from "./auth.message";

export const authGateView = <Message>(model: AuthModel, wrap: (message: AuthMessage) => Message): Html => {
  const { a, div, p, Class, Href } = html<Message>();

  if (model.loading) return p([Class("text-muted-foreground")], ["Checking your session..."]);

  if (model.session) {
    return div(
      [
        Class(
          "mb-5 flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-sm text-card-foreground shadow-sm",
        ),
      ],
      [
        p([Class("m-0 text-muted-foreground")], [`Signed in as ${model.session.user.email}`]),
        Button<Message>({ onClick: wrap(AuthLogoutClicked()), variant: "secondary", size: "sm", children: ["Logout"] }),
      ],
    );
  }

  return Card<Message>({
    children: [
      CardHeader<Message>({
        children: [
          CardTitle<Message>({ children: ["Sign in"] }),
          CardDescription<Message>({
            children: [
              "Use Google OAuth locally through emulate.dev. The provider boundary is ready for more OAuth providers later.",
            ],
          }),
        ],
      }),
      CardContent<Message>({
        className: "grid gap-4 p-6 pt-0",
        children: [
          model.error ? p([Class("text-sm text-destructive")], [model.error]) : div([], []),
          a(
            [
              Href(backendUrl("/auth/google/start")),
              Class(
                "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary-hover",
              ),
            ],
            ["Sign in with Google"],
          ),
        ],
      }),
    ],
  });
};
