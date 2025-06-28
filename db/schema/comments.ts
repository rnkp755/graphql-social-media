import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { posts } from "./posts";
import { users } from "./users";

export const comments = pgTable("comments", {
	id: uuid().primaryKey().defaultRandom(),
	postId: uuid()
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	content: text("content").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.default(sql`NOW()`)
		.$onUpdate(() => sql`NOW()`),
});

type InsertComment = typeof comments.$inferInsert;
type SelectComment = typeof comments.$inferSelect;

export type { InsertComment, SelectComment };
