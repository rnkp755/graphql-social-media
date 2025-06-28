import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	integer,
	pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

const mediaEnum = pgEnum("mediatype", ["image", "video"]);

export const posts = pgTable("posts", {
	id: uuid().primaryKey().defaultRandom(),
	description: varchar({ length: 1000 }),
	mediaUrl: varchar({ length: 255 }),
	mediatype: mediaEnum().default("image"),
	postedBy: uuid("posted_by")
		.notNull()
		.references(() => users.id),
	commentsDisabled: boolean("comments_disabled").default(false),
	likesCount: integer("likes_count").default(0),
	commentsCount: integer("comments_count").default(0),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.default(sql`NOW()`)
		.$onUpdate(() => sql`NOW()`),
});

type InsertPost = typeof posts.$inferInsert;
type SelectPost = typeof posts.$inferSelect;

export type { InsertPost, SelectPost };
