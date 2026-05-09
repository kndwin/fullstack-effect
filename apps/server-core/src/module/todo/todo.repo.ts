import { ErrorTodoNotFound } from "@qaveai/shared/module/todo/todo.schema";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DB, PgLive } from "../../platform/db";
import { todos } from "./todo.table";

const newTodoId = () => `tdo_${crypto.randomUUID()}`;

export class TodoRepository extends Context.Service<TodoRepository>()("TodoRepository", {
  make: Effect.gen(function* () {
    const db = yield* DB;

    const findMany = Effect.fn("TodoRepository.findMany")(function* () {
      return yield* db.query.todos.findMany({ orderBy: { title: "asc" } });
    });

    const create = Effect.fn("TodoRepository.create")(function* (title: string, projectId: string) {
      const [todo] = yield* db
        .insert(todos)
        .values({ id: newTodoId(), projectId, title, completed: false })
        .returning();
      if (!todo) return yield* Effect.die(new Error("Todo insert returned no rows"));
      return todo;
    });

    const toggle = Effect.fn("TodoRepository.toggle")(function* (id: string) {
      const todo = yield* db.query.todos.findFirst({ where: { id } });
      if (!todo) return yield* new ErrorTodoNotFound({ id });

      const [updated] = yield* db.update(todos).set({ completed: !todo.completed }).where(eq(todos.id, id)).returning();
      if (!updated) return yield* new ErrorTodoNotFound({ id });

      return updated;
    });

    const deleteTodo = Effect.fn("TodoRepository.delete")(function* (id: string) {
      yield* db.delete(todos).where(eq(todos.id, id));
    });

    return {
      findMany: findMany(),
      create,
      toggle,
      delete: deleteTodo,
    };
  }),
}) {}

export const TodoRepositoryLive = Layer.effect(TodoRepository)(TodoRepository.make).pipe(Layer.provide(PgLive));
