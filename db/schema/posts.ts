import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const posts = pgTable("posts", {
	id: uuid().primaryKey().defaultRandom(),
	description: varchar({ length: 1000 }),
	image: varchar({ length: 255 }),
    postedBy: uuid().notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .default(sql`NOW()`)
        .$onUpdate(() => sql`NOW()`),
});

type InsertPost = typeof posts.$inferInsert;
type SelectPost = typeof posts.$inferSelect;

export type { InsertPost, SelectPost };