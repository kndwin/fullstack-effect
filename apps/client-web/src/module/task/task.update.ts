import { Match } from "effect";
import { Command } from "foldkit";
import { createTask, updateTaskStatus } from "./task.command";
import type { TaskModel } from "./task.model";
import { TaskMessage } from "./task.message";

export const update = (
  model: TaskModel & { readonly draft: string; readonly error: string | null },
  message: TaskMessage,
): readonly [
  TaskModel & { readonly draft: string; readonly error: string | null },
  ReadonlyArray<Command.Command<TaskMessage>>,
] =>
  Match.value(message).pipe(
    Match.withReturnType<
      readonly [
        TaskModel & { readonly draft: string; readonly error: string | null },
        ReadonlyArray<Command.Command<TaskMessage>>,
      ]
    >(),
    Match.tagsExhaustive({
      TaskDraftChanged: ({ value }) => [{ ...model, draft: value }, []],
      TaskCreateClicked: ({ tenantId, userId }) => {
        const title = model.draft.trim();
        return title.length === 0
          ? [model, []]
          : [{ ...model, draft: "", error: null }, [createTask({ tenantId, userId, title })]];
      },
      TaskStatusClicked: ({ tenantId, userId, taskId, status }) => [
        { ...model, error: null },
        [updateTaskStatus({ tenantId, userId, taskId, status })],
      ],
      TaskCreated: ({ task }) => [
        {
          ...model,
          tasks: model.tasks.some((item) => item.id === task.id) ? model.tasks : [...model.tasks, task],
          error: null,
        },
        [],
      ],
      TaskStatusUpdated: ({ task }) => [
        { ...model, tasks: model.tasks.map((item) => (item.id === task.id ? task : item)), error: null },
        [],
      ],
      TaskFailed: ({ message }) => [{ ...model, error: message }, []],
    }),
  );
