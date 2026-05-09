import { pgTable, text } from "drizzle-orm/pg-core";
import { orgs } from "../org/org.table";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  orgId: text("org_id")
    .notNull()
    .references(() => orgs.id),
  name: text("name").notNull(),
});
