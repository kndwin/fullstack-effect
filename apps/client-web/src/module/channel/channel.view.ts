import { Button } from "@qaveai/client-ds/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qaveai/client-ds/card";
import { Input } from "@qaveai/client-ds/input";
import { html } from "foldkit/html";
import type { ChannelModel } from "./channel.model";
import { ChannelCreateClicked, ChannelDraftChanged, type ChannelMessage } from "./channel.message";

export type ChannelViewContext<ParentMessage = ChannelMessage> = {
  readonly tenantId: string;
  readonly userId: string;
  readonly toParentMessage?: (message: ChannelMessage) => ParentMessage;
};

export const channelListView = <ParentMessage = ChannelMessage>(
  model: ChannelModel,
  ctx: ChannelViewContext<ParentMessage>,
) => {
  const { div, form, li, p, ul, Class, OnSubmit } = html<ParentMessage>();
  const toParentMessage = ctx.toParentMessage ?? ((message: ChannelMessage) => message as ParentMessage);

  return Card<ParentMessage>({
    className: "rounded-[var(--radius)]",
    children: [
      CardHeader<ParentMessage>({
        children: [
          CardTitle<ParentMessage>({ children: ["Channels"] }),
          CardDescription<ParentMessage>({ children: ["A home for synced conversations."] }),
        ],
      }),
      CardContent<ParentMessage>({
        className: "grid gap-[var(--space-card)] p-[var(--space-card)] pt-[0]",
        children: [
          form(
            [
              Class("grid grid-cols-[1fr_auto] items-start gap-[var(--space-2)]"),
              OnSubmit(toParentMessage(ChannelCreateClicked(ctx))),
            ],
            [
              Input<ParentMessage>({
                id: `channel-name-${model.tenantId}`,
                value: model.draft,
                onInput: (value) => toParentMessage(ChannelDraftChanged({ value })),
                placeholder: "Create a channel...",
                inputClassName:
                  "flex h-[var(--size-control-md)] w-full rounded-[var(--radius)] border border-input bg-transparent px-[var(--space-control-x)] py-[var(--space-list-item-y)] text-base text-foreground shadow-[var(--shadow-control)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm",
              }),
              Button<ParentMessage>({
                type: "submit",
                className:
                  "inline-flex h-[var(--size-control-md)] items-center justify-center rounded-[var(--radius)] bg-primary px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm font-medium text-primary-foreground shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                children: ["Create"],
              }),
            ],
          ),
          model.error ? div([Class("text-sm text-destructive")], [model.error]) : div([], []),
          model.channels.length === 0
            ? div(
                [
                  Class(
                    "rounded-[var(--radius)] border border-dashed border-border p-[var(--space-card)] text-sm text-muted-foreground",
                  ),
                ],
                ["No channels yet."],
              )
            : ul(
                [Class("grid gap-[var(--space-2)]")],
                model.channels.map((channel) =>
                  li(
                    [Class("rounded-[var(--radius)] border border-border bg-card p-[var(--space-card)]")],
                    [
                      p([Class("m-0 text-sm font-medium leading-none")], [channel.name]),
                      p(
                        [Class("m-0 mt-[var(--space-1)] text-xs text-muted-foreground")],
                        [`Created ${channel.createdAt}`],
                      ),
                    ],
                  ),
                ),
              ),
        ],
      }),
    ],
  });
};
