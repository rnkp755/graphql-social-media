import {
	pgTable,
	uuid,
	varchar,
	timestamp,
	boolean,
	pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

const statusEnum = pgEnum("status", ["pending", "published", "failed", "cancelled"]);
const mediaEnum = pgEnum("scheduled_mediatype", ["image", "video"]);

export const scheduledPosts = pgTable("scheduled_posts", {
	id: uuid().primaryKey().defaultRandom(),
	description: varchar({ length: 1000 }),
	mediaUrl: varchar({ length: 255 }),
	mediatype: mediaEnum().default("image"),
	scheduledBy: uuid("scheduled_by")
		.notNull()
		.references(() => users.id),
	commentsDisabled: boolean("comments_disabled").default(false),
	scheduledFor: timestamp("scheduled_for").notNull(),
	status: statusEnum().default("pending"),
	publishedPostId: uuid("published_post_id"), // Reference to the actual post when published
	errorMessage: varchar({ length: 500 }), // Store error message if publishing fails
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.default(sql`NOW()`)
		.$onUpdate(() => sql`NOW()`),
});

type InsertScheduledPost = typeof scheduledPosts.$inferInsert;
type SelectScheduledPost = typeof scheduledPosts.$inferSelect;

export type { InsertScheduledPost, SelectScheduledPost };
