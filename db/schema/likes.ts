import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { posts } from "./posts";
import { users } from "./users";

export const likes = pgTable("likes", {
	id: uuid().primaryKey().defaultRandom(),
	postId: uuid()
		.notNull()
		.references(() => posts.id, { onDelete: "cascade" }),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow(),
});

type InsertLike = typeof likes.$inferInsert;
type SelectLike = typeof likes.$inferSelect;

export type { InsertLike, SelectLike };
