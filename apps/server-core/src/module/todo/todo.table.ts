import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { projects } from "../project/project.table";

export const todos = pgTable("todos", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
});
