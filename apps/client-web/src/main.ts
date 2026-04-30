import { Match, Schema } from "effect";
import * as Effect from "effect/Effect";
import { Todo } from "@qaveai/shared/rpc";
import { Command, Runtime } from "foldkit";
import { html } from "foldkit/html";
import type { Document, Html } from "foldkit/html";
import { m } from "foldkit/message";
import { todoRpc } from "./rpc";
import { Button } from "./shared/ui/button";
import "./style.css";

const Model = Schema.Struct({
  draft: Schema.String,
  todos: Schema.Array(Todo),
  loading: Schema.Boolean,
  error: Schema.NullOr(Schema.String),
});
type Model = typeof Model.Type;

const Started = m("Started");
const ChangedDraft = m("ChangedDraft", { value: Schema.String });
const ClickedAdd = m("ClickedAdd");
const ClickedToggle = m("ClickedToggle", { id: Schema.String });
const ClickedDelete = m("ClickedDelete", { id: Schema.String });
const LoadedTodos = m("LoadedTodos", { todos: Schema.Array(Todo) });
const CreatedTodo = m("CreatedTodo", { todo: Todo });
const ToggledTodo = m("ToggledTodo", { todo: Todo });
const DeletedTodo = m("DeletedTodo", { id: Schema.String });
const FailedRpc = m("FailedRpc", { message: Schema.String });

const Message = Schema.Union(
  Started,
  ChangedDraft,
  ClickedAdd,
  ClickedToggle,
  ClickedDelete,
  LoadedTodos,
  CreatedTodo,
  ToggledTodo,
  DeletedTodo,
  FailedRpc,
);
type Message = typeof Message.Type;

const LoadTodos = Command.define("LoadTodos", LoadedTodos, FailedRpc);
const CreateTodo = Command.define("CreateTodo", CreatedTodo, FailedRpc);
const ToggleTodo = Command.define("ToggleTodo", ToggledTodo, FailedRpc);
const DeleteTodo = Command.define("DeleteTodo", DeletedTodo, FailedRpc);

const failMessage = (error: unknown) =>
  FailedRpc({ message: error instanceof Error ? error.message : String(error) });

const loadTodos = LoadTodos(
  todoRpc.list.pipe(
    Effect.map((todos) => LoadedTodos({ todos })),
    Effect.catchAll((error) => Effect.succeed(failMessage(error))),
  ),
);

const createTodo = (title: string) =>
  CreateTodo(
    todoRpc.create(title).pipe(
      Effect.map((todo) => CreatedTodo({ todo })),
      Effect.catchAll((error) => Effect.succeed(failMessage(error))),
    ),
  );

const toggleTodo = (id: string) =>
  ToggleTodo(
    todoRpc.toggle(id).pipe(
      Effect.map((todo) => ToggledTodo({ todo })),
      Effect.catchAll((error) => Effect.succeed(failMessage(error))),
    ),
  );

const deleteTodo = (id: string) =>
  DeleteTodo(
    todoRpc.delete(id).pipe(
      Effect.as(DeletedTodo({ id })),
      Effect.catchAll((error) => Effect.succeed(failMessage(error))),
    ),
  );

const init: Runtime.ProgramInit<Model, Message> = () => [
  { draft: "", todos: [], loading: true, error: null },
  [loadTodos],
];

const update = (
  model: Model,
  message: Message,
): readonly [Model, ReadonlyArray<Command.Command<Message>>] =>
  Match.value(message).pipe(
    Match.withReturnType<readonly [Model, ReadonlyArray<Command.Command<Message>>]>(),
    Match.tagsExhaustive({
      Started: () => [{ ...model, loading: true, error: null }, [loadTodos]],
      ChangedDraft: ({ value }) => [{ ...model, draft: value }, []],
      ClickedAdd: () => {
        const title = model.draft.trim();
        return title.length === 0
          ? [model, []]
          : [{ ...model, draft: "", loading: true, error: null }, [createTodo(title)]];
      },
      ClickedToggle: ({ id }) => [
        { ...model, loading: true, error: null },
        [toggleTodo(id)],
      ],
      ClickedDelete: ({ id }) => [
        { ...model, loading: true, error: null },
        [deleteTodo(id)],
      ],
      LoadedTodos: ({ todos }) => [
        { ...model, todos, loading: false, error: null },
        [],
      ],
      CreatedTodo: ({ todo }) => [
        { ...model, todos: [...model.todos, todo], loading: false, error: null },
        [],
      ],
      ToggledTodo: ({ todo }) => [
        {
          ...model,
          todos: model.todos.map((item) => item.id === todo.id ? todo : item),
          loading: false,
          error: null,
        },
        [],
      ],
      DeletedTodo: ({ id }) => [
        {
          ...model,
          todos: model.todos.filter((todo) => todo.id !== id),
          loading: false,
          error: null,
        },
        [],
      ],
      FailedRpc: ({ message }) => [{ ...model, loading: false, error: message }, []],
    }),
  );

const { div, h1, p, form, input, ul, li, span, Class, OnSubmit, OnInput, OnClick, Value, Checked, Type } = html<Message>();

const view = (model: Model): Document => ({
  title: "Todo RPC Playground",
  body: div([Class("grid min-h-screen place-items-center p-6")], [
    div([Class("w-full max-w-[760px] rounded-3xl border border-[#2e485d] bg-[#172635] p-5 shadow-[0_24px_80px_rgb(0_0_0_/_35%)] sm:p-8")], [
      h1([Class("m-0 text-[clamp(2rem,7vw,4rem)] font-bold tracking-[-0.06em]")], ["Todo RPC Playground"]),
      p([Class("text-[#a9bed0] leading-relaxed")], ["Foldkit drives state. Effect RPC crosses the wire. effect-qb models the SQL on the server."]),
      form([Class("my-4 grid gap-3 sm:my-7 sm:grid-cols-[1fr_auto]"), OnSubmit(ClickedAdd())], [
        input([
          Type("text"),
          Value(model.draft),
          OnInput((value) => ChangedDraft({ value })),
          Class("rounded-full border-0 bg-[#0e1720] px-[18px] py-[14px] text-[#eef6ff] outline outline-1 outline-[#35536a]"),
        ]),
        Button<Message>({
          type: "submit",
          isDisabled: model.loading,
          className: "rounded-full border-0 bg-[#72ffb6] px-[22px] py-[14px] font-extrabold text-[#092017] data-disabled:opacity-50",
          children: [model.loading ? "Working..." : "Add"],
        }),
      ]),
      model.error ? p([Class("text-[#ffb4b4]")], [model.error]) : div([], []),
      ul([Class("m-0 grid list-none gap-2.5 p-0")], model.todos.map((todo) =>
        li([Class("grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[18px] border border-[#2e485d] bg-[#0e1720] p-3")], [
          input([
            Type("checkbox"),
            Checked(todo.completed),
            OnClick(ClickedToggle({ id: todo.id })),
          ]),
          span([Class(todo.completed ? "text-[#7f96a8] line-through" : "")], [todo.title]),
          Button<Message>({
            onClick: ClickedDelete({ id: todo.id }),
            className: "rounded-full border-0 bg-transparent px-3 py-2 text-[#a9bed0]",
            children: ["Delete"],
          }),
        ]),
      )),
    ]),
  ]),
});

const program = Runtime.makeProgram({
  Model: Model as Schema.Schema<Model>,
  init,
  update,
  view,
  container: document.getElementById("root")!,
  devTools: { Message, banner: "QaveAI Todo" },
});

Runtime.run(program);
