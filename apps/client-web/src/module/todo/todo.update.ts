import { Match } from "effect";
import { Command } from "foldkit";
import { createTodo, deleteTodo, loadTodos, toggleTodo } from "./todo.command";
import type { TodoModel } from "./todo.model";
import { TodoMessage } from "./todo.message";

const idleStatus: TodoModel["status"] = {
  loadingTodos: false,
  creatingTodo: false,
};

const resetItemStatus = (model: TodoModel): TodoModel["todos"] =>
  model.todos.map((item) => ({ ...item, status: "idle" }));

export const init = () =>
  [{ draft: "", todos: [], status: { ...idleStatus, loadingTodos: true }, error: null }, [loadTodos]] as const;

export const update = (
  model: TodoModel,
  message: TodoMessage,
): readonly [TodoModel, ReadonlyArray<Command.Command<TodoMessage>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [TodoModel, ReadonlyArray<Command.Command<TodoMessage>>]>(),
    Match.tagsExhaustive({
      TodoStarted: () => [{ ...model, status: { ...model.status, loadingTodos: true }, error: null }, [loadTodos]],
      TodoDraftChanged: ({ value }) => [{ ...model, draft: value }, []],
      TodoAddClicked: ({ projectId }) => {
        const title = model.draft.trim();
        return title.length === 0
          ? [model, []]
          : [
              { ...model, draft: "", status: { ...model.status, creatingTodo: true }, error: null },
              [createTodo(title, projectId)],
            ];
      },
      TodoToggleClicked: ({ id }) => [
        {
          ...model,
          todos: model.todos.map((item) => (item.todo.id === id ? { ...item, status: "toggling" } : item)),
          error: null,
        },
        [toggleTodo(id)],
      ],
      TodoDeleteClicked: ({ id }) => [
        {
          ...model,
          todos: model.todos.map((item) => (item.todo.id === id ? { ...item, status: "deleting" } : item)),
          error: null,
        },
        [deleteTodo(id)],
      ],
      TodoLoaded: ({ todos }) => [
        {
          ...model,
          todos: todos.map((todo) => ({ todo, status: "idle" })),
          status: { ...model.status, loadingTodos: false },
          error: null,
        },
        [],
      ],
      TodoCreated: ({ todo }) => [
        {
          ...model,
          todos: [...model.todos, { todo, status: "idle" }],
          status: { ...model.status, creatingTodo: false },
          error: null,
        },
        [],
      ],
      TodoToggled: ({ todo }) => [
        {
          ...model,
          todos: model.todos.map((item) => (item.todo.id === todo.id ? { todo, status: "idle" } : item)),
          error: null,
        },
        [],
      ],
      TodoDeleted: ({ id }) => [
        { ...model, todos: model.todos.filter((item) => item.todo.id !== id), error: null },
        [],
      ],
      TodoFailed: ({ message }) => [
        { ...model, todos: resetItemStatus(model), status: idleStatus, error: message },
        [],
      ],
    }),
  );
