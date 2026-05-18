import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const channels = pgTable("channels", {
  tenantId: text("tenant_id").notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
