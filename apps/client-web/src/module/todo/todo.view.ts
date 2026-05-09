import { Button } from "@qaveai/client-ds/button";
import { Input } from "@qaveai/client-ds/input";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import type { TodoModel } from "./todo.model";
import {
  TodoAddClicked,
  TodoDeleteClicked,
  TodoDraftChanged,
  TodoToggleClicked,
  type TodoMessage,
} from "./todo.message";
import { todoListRouter } from "./todo.route";

export const todoListView = <Message>(
  model: TodoModel,
  wrap: (message: TodoMessage) => Message,
  projectId = "prj_inbox",
  todoHref?: (todoId: string) => string,
): Html => {
  const { a, div, p, form, input, ul, li, span, Class, Href, OnSubmit, OnClick, Checked, Type } = html<Message>();
  const isCreating = model.status.creatingTodo;

  return div(
    [],
    [
      form(
        [Class("mb-6 grid gap-3 sm:grid-cols-[1fr_auto]"), OnSubmit(wrap(TodoAddClicked({ projectId })))],
        [
          Input<Message>({
            id: `todo-title-${projectId}`,
            value: model.draft,
            onInput: (value) => wrap(TodoDraftChanged({ value })),
            placeholder: "Add a todo...",
          }),
          Button<Message>({
            type: "submit",
            isDisabled: isCreating,
            children: [isCreating ? "Working..." : "Add"],
          }),
        ],
      ),
      model.error ? p([Class("mb-4 text-sm text-destructive")], [model.error]) : div([], []),
      ul(
        [Class("m-0 grid list-none gap-2 p-0")],
        model.todos.map((item) =>
          li(
            [
              Class(
                "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent/50",
              ),
            ],
            [
              input([
                Type("checkbox"),
                Checked(item.todo.completed),
                OnClick(wrap(TodoToggleClicked({ id: item.todo.id }))),
                Class("size-4 rounded border-input accent-primary"),
              ]),
              a(
                [
                  Href(todoHref ? todoHref(item.todo.id) : todoListRouter()),
                  Class(
                    item.todo.completed
                      ? "text-sm text-muted-foreground line-through"
                      : "text-sm font-medium text-foreground hover:underline hover:underline-offset-4",
                  ),
                ],
                [item.todo.title],
              ),
              Button<Message>({
                onClick: wrap(TodoDeleteClicked({ id: item.todo.id })),
                variant: "ghost",
                size: "sm",
                isDisabled: item.status === "deleting",
                children: [
                  span([Class("text-muted-foreground")], [item.status === "deleting" ? "Deleting..." : "Delete"]),
                ],
              }),
            ],
          ),
        ),
      ),
    ],
  );
};
