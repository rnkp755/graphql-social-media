import {
	uuid,
	varchar,
	pgEnum,
	pgTable,
	timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const roleEnum = pgEnum("role", ["admin", "user", "guest"]);
const genderEnum = pgEnum("gender", ["male", "female", "other"]);

export const users = pgTable("users", {
	id: uuid().primaryKey().defaultRandom(),
	name: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 50 }).notNull().unique(),
	password: varchar({ length: 255 }).notNull(),
	salt: varchar({ length: 255 }).notNull(),
	avatar: varchar({ length: 255 }).default(
		"https://avatar.iran.liara.run/public"
	),
	role: roleEnum().default("user"),
	gender: genderEnum(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.default(sql`NOW()`)
		.$onUpdate(() => sql`NOW()`),
});

type InsertUser = typeof users.$inferInsert;
type SelectUser = typeof users.$inferSelect;

export type { InsertUser, SelectUser };
