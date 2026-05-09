import { pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { users } from "../auth/auth.table";

export const orgs = pgTable("orgs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const orgMemberships = pgTable(
  "org_memberships",
  {
    orgId: text("org_id")
      .notNull()
      .references(() => orgs.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.orgId, table.userId] })],
);
