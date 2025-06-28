import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const follows = pgTable("follows", {
	id: uuid().primaryKey().defaultRandom(),
	followerId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	followingId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.default(sql`NOW()`)
		.$onUpdate(() => sql`NOW()`),
});

type InsertFollow = typeof follows.$inferInsert;
type SelectFollow = typeof follows.$inferSelect;

export type { InsertFollow, SelectFollow };

