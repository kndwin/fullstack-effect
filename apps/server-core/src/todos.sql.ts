import { Column as C, Query as Q, Renderer, Table } from "effect-qb/postgres";

export const todos = Table.make("todos", {
  id: C.uuid().pipe(C.primaryKey),
  title: C.text(),
  completed: C.boolean(),
});

export const listTodos = Q.select({
  id: todos.id,
  title: todos.title,
  completed: todos.completed,
}).pipe(Q.from(todos), Q.orderBy(todos.title));

export const listOpenTodos = Q.select({
  id: todos.id,
  title: todos.title,
}).pipe(Q.from(todos), Q.where(Q.eq(todos.completed, false)));

export const createTodo = Q.insert(todos, {
  id: Q.literal("00000000-0000-0000-0000-000000000000"),
  title: Q.literal("Learn Effect RPC"),
  completed: Q.literal(false),
}).pipe(
  Q.returning({
    id: todos.id,
    title: todos.title,
    completed: todos.completed,
  }),
);

const renderer = Renderer.make();

export const renderedTodoQueries = {
  listTodos: renderer.render(listTodos),
  listOpenTodos: renderer.render(listOpenTodos),
  createTodo: renderer.render(createTodo),
};
