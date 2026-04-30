import { Todo } from "@qaveai/shared/rpc";
import { Effect, Ref } from "effect";

export class TodoRepository extends Effect.Service<TodoRepository>()(
  "TodoRepository",
  {
    effect: Effect.gen(function* () {
      const todos = yield* Ref.make<Array<Todo>>([
        new Todo({ id: crypto.randomUUID(), title: "Explore Foldkit", completed: false }),
        new Todo({ id: crypto.randomUUID(), title: "Render typed SQL with effect-qb", completed: false }),
      ]);

      return {
        findMany: Ref.get(todos),
        create: (title: string) =>
          Ref.updateAndGet(todos, (current) => [
            ...current,
            new Todo({ id: crypto.randomUUID(), title, completed: false }),
          ]).pipe(Effect.map((current) => current[current.length - 1]!)),
        toggle: (id: string) =>
          Ref.modify(todos, (current) => {
            const updated = current.map((todo) =>
              todo.id === id
                ? new Todo({ ...todo, completed: !todo.completed })
                : todo,
            );
            const todo = updated.find((item) => item.id === id);

            return [todo, updated] as const;
          }).pipe(
            Effect.flatMap((todo) =>
              todo
                ? Effect.succeed(todo)
                : Effect.dieMessage(`Todo not found: ${id}`),
            ),
          ),
        delete: (id: string) =>
          Ref.update(todos, (current) => current.filter((todo) => todo.id !== id)),
      };
    }),
  },
) {}
