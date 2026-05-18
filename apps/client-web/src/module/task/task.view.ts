import { Button } from "@qaveai/client-ds/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qaveai/client-ds/card";
import { Input } from "@qaveai/client-ds/input";
import type { TaskStatus } from "@qaveai/shared/module/task/task.schema";
import { html, type Html } from "foldkit/html";
import type { TaskModel } from "./task.model";
import { TaskCreateClicked, TaskDraftChanged, TaskStatusClicked, type TaskMessage } from "./task.message";

export type TaskViewModel = TaskModel & {
  readonly draft: string;
  readonly error: string | null;
};

export type TaskViewContext<ParentMessage = TaskMessage> = {
  readonly tenantId: string;
  readonly userId: string;
  readonly toParentMessage?: (message: TaskMessage) => ParentMessage;
};

const nextStatus = (status: TaskStatus): TaskStatus => (status === "done" ? "todo" : "done");

export const taskListView = <ParentMessage = TaskMessage>(
  model: TaskViewModel,
  ctx: TaskViewContext<ParentMessage>,
): Html => {
  const { div, form, li, span, ul, Class, OnSubmit } = html<ParentMessage>();
  const toParentMessage = ctx.toParentMessage ?? ((message: TaskMessage) => message as ParentMessage);

  return Card<ParentMessage>({
    className: "rounded-[var(--radius)] border border-border bg-card text-card-foreground shadow-[var(--shadow-panel)]",
    children: [
      CardHeader<ParentMessage>({
        children: [
          CardTitle<ParentMessage>({ children: ["Synced tasks"] }),
          CardDescription<ParentMessage>({
            children: [`Tenant ${model.tenantId}, last applied seq ${model.lastAppliedSeq}`],
          }),
        ],
      }),
      CardContent<ParentMessage>({
        className: "grid gap-[var(--space-card)] p-[var(--space-card)] pt-[0]",
        children: [
          form(
            [
              Class("grid grid-cols-[1fr_auto] items-start gap-[var(--space-2)]"),
              OnSubmit(toParentMessage(TaskCreateClicked(ctx))),
            ],
            [
              div(
                [Class("min-w-0 flex-1")],
                [
                  Input<ParentMessage>({
                    id: `task-title-${model.tenantId}`,
                    value: model.draft,
                    onInput: (value) => toParentMessage(TaskDraftChanged({ value })),
                    placeholder: "Add a task...",
                    inputClassName:
                      "flex h-[var(--size-control-md)] w-full rounded-[var(--radius)] border border-input bg-transparent px-[var(--space-control-x)] py-[var(--space-list-item-y)] text-base text-foreground shadow-[var(--shadow-control)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:text-sm",
                  }),
                ],
              ),
              Button<ParentMessage>({
                type: "submit",
                className:
                  "inline-flex h-[var(--size-control-md)] items-center justify-center rounded-[var(--radius)] bg-primary px-[var(--space-control-x)] py-[var(--space-control-y)] text-sm font-medium text-primary-foreground shadow-[var(--shadow-control)] outline-none transition-colors hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                children: ["Add"],
              }),
            ],
          ),
          model.error ? div([Class("text-sm text-destructive")], [model.error]) : div([], []),
          model.tasks.length === 0
            ? div(
                [
                  Class(
                    "rounded-[var(--radius)] border border-dashed border-border p-[var(--space-card)] text-sm text-muted-foreground",
                  ),
                ],
                ["No tasks yet."],
              )
            : ul(
                [Class("grid gap-[var(--space-list-item-x)]")],
                model.tasks.map((task) =>
                  li(
                    [
                      Class(
                        "flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius)] border border-border p-[var(--space-card)]",
                      ),
                    ],
                    [
                      div(
                        [Class("grid gap-[var(--space-list-item-y)]")],
                        [
                          span(
                            [Class(task.status === "done" ? "font-medium line-through opacity-60" : "font-medium")],
                            [task.title],
                          ),
                          span([Class("text-xs text-muted-foreground")], [`Updated ${task.updatedAt}`]),
                        ],
                      ),
                      Button<ParentMessage>({
                        variant: "outline",
                        size: "sm",
                        onClick: toParentMessage(
                          TaskStatusClicked({ ...ctx, taskId: task.id, status: nextStatus(task.status) }),
                        ),
                        children: [task.status === "done" ? "Reopen" : "Done"],
                      }),
                    ],
                  ),
                ),
              ),
        ],
      }),
    ],
  });
};
