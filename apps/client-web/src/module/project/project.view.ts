import { Button } from "@qaveai/client-ds/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qaveai/client-ds/card";
import { Input } from "@qaveai/client-ds/input";
import { html } from "foldkit/html";
import type { Html } from "foldkit/html";
import { TodoToggleClicked, type TodoMessage } from "../todo/todo.message";
import type { TodoModel } from "../todo/todo.model";
import { todoListView } from "../todo/todo.view";
import type { ProjectModel } from "./project.model";
import { ProjectCreateClicked, ProjectDraftChanged, ProjectSelected, type ProjectMessage } from "./project.message";
import { projectDetailRouter, projectListRouter, projectTodoDetailRouter } from "./project.route";

export const projectListView = <Message>(
  model: ProjectModel,
  orgId: string,
  wrap: (message: ProjectMessage) => Message,
): Html => {
  const { a, div, form, li, p, ul, Class, Href, OnClick, OnSubmit } = html<Message>();
  const isCreating = model.status.creatingProject;

  return div(
    [Class("grid gap-4")],
    [
      div(
        [Class("grid gap-1")],
        [
          CardTitle<Message>({ className: "m-0 text-2xl font-semibold tracking-tight", children: ["Projects"] }),
          CardDescription<Message>({
            children: ["Projects own parent records; todos remain a child submodel composed by the app."],
          }),
        ],
      ),
      form(
        [Class("grid gap-3 sm:grid-cols-[1fr_auto]"), OnSubmit(wrap(ProjectCreateClicked({ orgId })))],
        [
          Input<Message>({
            id: "project-name",
            value: model.draft,
            onInput: (value) => wrap(ProjectDraftChanged({ value })),
            placeholder: "Create a project...",
          }),
          Button<Message>({
            type: "submit",
            isDisabled: isCreating,
            children: [isCreating ? "Working..." : "Create"],
          }),
        ],
      ),
      model.error ? p([Class("text-sm text-destructive")], [model.error]) : div([], []),
      ul(
        [Class("m-0 grid list-none gap-2 p-0")],
        model.projects.map((item) =>
          li(
            [
              Class(
                "rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm transition-colors hover:bg-accent/50",
              ),
            ],
            [
              a(
                [
                  Href(projectDetailRouter({ projectId: item.project.id })),
                  OnClick(wrap(ProjectSelected({ id: item.project.id }))),
                  Class(
                    item.status === "selected"
                      ? "text-sm font-semibold text-primary underline underline-offset-4"
                      : "text-sm font-medium text-foreground hover:underline hover:underline-offset-4",
                  ),
                ],
                [item.project.name],
              ),
            ],
          ),
        ),
      ),
    ],
  );
};

export const projectDetailView = <Message>(
  model: ProjectModel,
  todoModel: TodoModel,
  projectId: string,
  wrapTodo: (message: TodoMessage) => Message,
): Html => {
  const { a, div, p, Class, Href } = html<Message>();
  const project = model.projects.find((item) => item.project.id === projectId)?.project;
  const projectTodos = { ...todoModel, todos: todoModel.todos.filter((item) => item.todo.projectId === projectId) };

  return div(
    [Class("grid gap-4")],
    [
      a(
        [Href(projectListRouter()), Class("text-sm font-medium text-primary underline-offset-4 hover:underline")],
        ["Back to projects"],
      ),
      project
        ? Card<Message>({
            children: [
              CardHeader<Message>({
                children: [
                  CardTitle<Message>({ children: [project.name] }),
                  CardDescription<Message>({ children: [`Project id: ${project.id}`] }),
                ],
              }),
              CardContent<Message>({
                children: [
                  todoListView(projectTodos, wrapTodo, project.id, (todoId) =>
                    projectTodoDetailRouter({ projectId: project.id, todoId }),
                  ),
                ],
              }),
            ],
          })
        : p(
            [Class("text-sm text-destructive")],
            [model.status.loadingProjects ? "Loading project..." : "Project not found."],
          ),
    ],
  );
};

export const projectTodoDetailView = <Message>(
  model: ProjectModel,
  todoModel: TodoModel,
  projectId: string,
  todoId: string,
  wrapTodo: (message: TodoMessage) => Message,
): Html => {
  const { a, div, p, Class, Href } = html<Message>();
  const project = model.projects.find((item) => item.project.id === projectId)?.project;
  const todoItem = todoModel.todos.find((item) => item.todo.id === todoId && item.todo.projectId === projectId);
  const todo = todoItem?.todo;

  return div(
    [Class("grid gap-4")],
    [
      a(
        [
          Href(projectDetailRouter({ projectId })),
          Class("text-sm font-medium text-primary underline-offset-4 hover:underline"),
        ],
        ["Back to project"],
      ),
      project && todo && todoItem
        ? Card<Message>({
            children: [
              CardHeader<Message>({
                children: [
                  CardTitle<Message>({ children: [todo.title] }),
                  CardDescription<Message>({ children: [`Project: ${project.name}`] }),
                ],
              }),
              CardContent<Message>({
                className: "grid gap-4 p-6 pt-0",
                children: [
                  p(
                    [Class("m-0 text-sm text-muted-foreground")],
                    [todo.completed ? "This todo is complete." : "This todo is still open."],
                  ),
                  Button<Message>({
                    onClick: wrapTodo(TodoToggleClicked({ id: todo.id })),
                    children: [
                      todoItem.status === "toggling" ? "Working..." : todo.completed ? "Mark open" : "Mark complete",
                    ],
                  }),
                ],
              }),
            ],
          })
        : p(
            [Class("text-sm text-destructive")],
            [
              model.status.loadingProjects || todoModel.status.loadingTodos
                ? "Loading todo..."
                : "Todo not found in this project.",
            ],
          ),
    ],
  );
};
