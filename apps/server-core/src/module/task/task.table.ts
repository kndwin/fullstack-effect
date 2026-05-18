import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  tenantId: text("tenant_id").notNull(),
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
