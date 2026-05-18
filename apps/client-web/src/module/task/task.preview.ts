import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import type { TaskModel } from "./task.model";
import { emptyTaskModel } from "./task.model";
import {
  TaskCreated,
  TaskDraftChanged,
  TaskFailed,
  TaskMessage,
  TaskStatusClicked,
  TaskStatusUpdated,
} from "./task.message";
import { update } from "./task.update";
import { taskListView, type TaskViewModel } from "./task.view";

const tenantId = "tenant_1";
const userId = "user_1";
const now = "2026-05-10T00:00:00.000Z";
const taskA = {
  tenantId,
  id: "task_write_plan",
  title: "Write sync plan",
  status: "todo" as const,
  createdByUserId: userId,
  createdAt: now,
  updatedAt: now,
};
const taskB = { ...taskA, id: "task_ship_preview", title: "Ship task preview", status: "done" as const };

const withUi = (model: TaskModel, overrides?: Partial<Pick<TaskViewModel, "draft" | "error">>): TaskViewModel => ({
  ...model,
  draft: overrides?.draft ?? "",
  error: overrides?.error ?? null,
});

const frame = (model: TaskViewModel) => {
  const { main, Class } = html<typeof TaskMessage.Type>();
  return main([Class("w-[min(44rem,calc(100vw-4rem))]")], [taskListView(model, { tenantId, userId })]);
};

export const TaskPreview = Preview.module({
  title: "Module/Task",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof TaskMessage.Type>();
        const example = (label: string, model: TaskViewModel) =>
          div(
            [Class("grid gap-[var(--space-3)]")],
            [h2([Class("text-sm font-medium text-muted-foreground")], [label]), frame(model)],
          );

        return div(
          [Class("grid gap-[calc(var(--space-6)+var(--space-2))]")],
          [
            example("Empty", withUi(emptyTaskModel(tenantId))),
            example("Seeded", withUi({ tenantId, tasks: [taskA, taskB], lastAppliedSeq: 2 })),
            example(
              "Create failure",
              withUi({ tenantId, tasks: [taskA], lastAppliedSeq: 1 }, { error: "Task RPC failed." }),
            ),
            example("Tenant switch", withUi(emptyTaskModel("tenant_2"))),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init: (): TaskViewModel => withUi(emptyTaskModel(tenantId)),
      update,
      view: frame,
      scenarios: [
        Preview.scenario("Pull task.created", [TaskCreated({ task: taskA })]),
        Preview.scenario("Duplicate event replay", [TaskCreated({ task: taskA }), TaskCreated({ task: taskA })]),
        Preview.scenario("Status update", [
          TaskCreated({ task: taskA }),
          TaskStatusClicked({ tenantId, userId, taskId: taskA.id, status: "done" }),
          TaskStatusUpdated({ task: { ...taskA, status: "done", updatedAt: "2026-05-10T00:01:00.000Z" } }),
        ]),
        Preview.scenario("Task create failure", [
          TaskDraftChanged({ value: "Will fail" }),
          TaskFailed({ message: "Mocked task create failure." }),
        ]),
      ],
      commandResolutions: {
        TaskCommandCreate: [
          { label: "Resolve created", message: () => TaskCreated({ task: { ...taskA, id: "task_created" } }) },
          { label: "Resolve failed", message: () => TaskFailed({ message: "Mocked create failed." }) },
        ],
        TaskCommandUpdateStatus: [
          { label: "Resolve updated", message: () => TaskStatusUpdated({ task: { ...taskA, status: "done" } }) },
          { label: "Resolve failed", message: () => TaskFailed({ message: "Mocked update failed." }) },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([TaskMessage]);
