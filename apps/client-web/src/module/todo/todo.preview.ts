import { Preview } from "@qaveai/foldkit-preview";
import { Schema } from "effect";
import { html } from "foldkit/html";
import {
  TodoAddClicked,
  TodoCreated,
  TodoDeleted,
  TodoDeleteClicked,
  TodoDraftChanged,
  TodoFailed,
  TodoLoaded,
  TodoMessage,
  TodoStarted,
  TodoToggleClicked,
  TodoToggled,
} from "./todo.message";
import type { TodoModel } from "./todo.model";
import { update } from "./todo.update";
import { todoListView } from "./todo.view";

const inboxId = "prj_inbox";
const todoA = { id: "todo_write_plan", projectId: inboxId, title: "Write implementation plan", completed: false };
const todoB = { id: "todo_ship_preview", projectId: inboxId, title: "Ship Foldkit previews", completed: true };
const todoC = { id: "todo_review", projectId: "prj_client", title: "Review client UI states", completed: false };
const todos = [todoA, todoB, todoC];
const wrap = (message: typeof TodoMessage.Type) => message;
const frame = (model: TodoModel) => {
  const { main, Class } = html<typeof TodoMessage.Type>();
  return main([Class("w-[min(42rem,calc(100vw-4rem))]")], [todoListView(model, wrap, inboxId)]);
};
const idleStatus = { loadingTodos: false, creatingTodo: false };

export const TodoPreview = Preview.module({
  title: "Module/Todo",
  previews: [
    Preview.preview({
      name: "States",
      view: () => {
        const { div, h2, Class } = html<typeof TodoMessage.Type>();
        const example = (label: string, model: TodoModel) =>
          div([Class("grid gap-3")], [h2([Class("text-sm font-medium text-muted-foreground")], [label]), frame(model)]);

        return div(
          [Class("grid gap-8")],
          [
            example("Empty", { draft: "", todos: [], status: idleStatus, error: null }),
            example("Populated", {
              draft: "",
              todos: todos.map((todo) => ({ todo, status: "idle" })),
              status: idleStatus,
              error: null,
            }),
            example("Creating", {
              draft: "",
              todos: todos.map((todo) => ({ todo, status: "idle" })),
              status: { ...idleStatus, creatingTodo: true },
              error: null,
            }),
            example("Deleting and error", {
              draft: "",
              todos: todos.map((todo, index) => ({ todo, status: index === 0 ? "deleting" : "idle" })),
              status: idleStatus,
              error: "Could not update todo.",
            }),
          ],
        );
      },
    }),
    Preview.preview({
      name: "Replay",
      init: (): TodoModel => ({ draft: "", todos: [], status: { ...idleStatus, loadingTodos: true }, error: null }),
      update,
      view: frame,
      scenarios: [
        Preview.scenario("Load todos", [TodoLoaded({ todos })]),
        Preview.scenario("Add todo", [
          TodoLoaded({ todos: [todoA] }),
          TodoDraftChanged({ value: "Add preview scenarios" }),
          TodoAddClicked({ projectId: inboxId }),
          TodoCreated({
            todo: { id: "todo_new", projectId: inboxId, title: "Add preview scenarios", completed: false },
          }),
        ]),
        Preview.scenario("Toggle then delete", [
          TodoLoaded({ todos }),
          TodoToggleClicked({ id: todoA.id }),
          TodoToggled({ todo: { ...todoA, completed: true } }),
          TodoDeleteClicked({ id: todoB.id }),
          TodoDeleted({ id: todoB.id }),
        ]),
        Preview.scenario("Failed create", [
          TodoLoaded({ todos: [todoA] }),
          TodoDraftChanged({ value: "Will fail" }),
          TodoAddClicked({ projectId: inboxId }),
          TodoFailed({ message: "Todo RPC failed." }),
        ]),
        Preview.scenario("Kitchen sink", [
          TodoStarted(),
          Preview.step(TodoLoaded({ todos }), { delayMs: 400 }),
          TodoDraftChanged({ value: "Capture replay edge cases" }),
          TodoAddClicked({ projectId: inboxId }),
          Preview.step(
            TodoCreated({
              todo: {
                id: "todo_kitchen_sink",
                projectId: inboxId,
                title: "Capture replay edge cases",
                completed: false,
              },
            }),
            { delayMs: 500 },
          ),
          TodoToggleClicked({ id: todoA.id }),
          Preview.step(TodoToggled({ todo: { ...todoA, completed: true } }), { delayMs: 300 }),
          TodoDeleteClicked({ id: todoB.id }),
          Preview.step(TodoDeleted({ id: todoB.id }), { delayMs: 300 }),
          TodoDraftChanged({ value: "Duplicate failing todo" }),
          TodoAddClicked({ projectId: inboxId }),
          Preview.step(TodoFailed({ message: "Kitchen sink mocked failure." }), { delayMs: 500 }),
        ]),
      ],
      commandResolutions: {
        TodoCommandLoad: [{ label: "Resolve loaded", message: () => TodoLoaded({ todos }) }],
        TodoCommandCreate: [
          {
            label: "Resolve created",
            message: () =>
              TodoCreated({
                todo: { id: "todo_created", projectId: inboxId, title: "Created from command", completed: false },
              }),
          },
          { label: "Resolve failed", message: () => TodoFailed({ message: "Mocked create failed." }) },
        ],
        TodoCommandToggle: [
          { label: "Resolve toggled", message: () => TodoToggled({ todo: { ...todoA, completed: true } }) },
          { label: "Resolve failed", message: () => TodoFailed({ message: "Mocked toggle failed." }) },
        ],
        TodoCommandDelete: [
          { label: "Resolve deleted", message: () => TodoDeleted({ id: todoA.id }) },
          { label: "Resolve failed", message: () => TodoFailed({ message: "Mocked delete failed." }) },
        ],
      },
    }),
  ],
});

export const Message = Schema.Union([TodoMessage]);
