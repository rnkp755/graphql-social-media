import { createHmac, randomUUID } from "node:crypto";
import db from "../db";
import { users } from "../db/schema/users";
import { eq, or, like } from "drizzle-orm";
import JWT from "jsonwebtoken";
import Fuse from "fuse.js";
import "dotenv/config";

type Gender = "male" | "female" | "other";

export interface createUserPayload {
	name: string;
	email: string;
	password: string;
	avatar?: string;
	gender?: Gender;
}

export interface GetUserTokenPayload {
	email: string;
	password: string;
}

class UserService {
	private static generateHash(password: string, salt: string): string {
		const hashedPassword = createHmac("sha256", salt)
			.update(password)
			.digest("hex");
		return hashedPassword;
	}
	public static async createUser(payload: createUserPayload) {
		try {
			const { name, email, password, avatar, gender } = payload;

			const salt = randomUUID();
			const hashedPassword = this.generateHash(password, salt);

			const insertedUsers = await db
				.insert(users)
				.values({
					name,
					email,
					password: hashedPassword,
					salt,
					avatar,
					gender,
				})
				.returning();

			const newUser = insertedUsers?.[0];

			if (!newUser) {
				throw new Error("User creation failed");
			}

			return {
				id: newUser.id,
				name: newUser.name,
				email: newUser.email,
				password:
					"Intentionally_Exposed_To_Show_Hash_" + newUser.password,
				avatar: newUser.avatar,
				gender: newUser.gender,
				role: newUser.role,
				createdAt: newUser.createdAt,
				updatedAt: newUser.updatedAt,
			};
		} catch (error) {
			console.error("Error creating user:", error);
			throw new Error("Failed to create user");
		}
	}
	public static async getUserById(id: string) {
		try {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, id))
				.limit(1)
				.then((rows) => rows[0]);
			if (!user) {
				throw new Error("User not found");
			}
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				avatar: user.avatar,
				gender: user.gender,
				role: user.role,
			};
		} catch (error) {
			console.error("Error fetching user by ID:", error);
			throw new Error("Failed to fetch user");
		}
	}
	public static async getUserByEmail(email: string) {
		try {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.email, email))
				.limit(1)
				.then((rows) => rows[0]);
			if (!user) {
				throw new Error("User not found");
			}
			return {
				id: user.id,
				name: user.name,
				email: user.email,
				avatar: user.avatar,
				gender: user.gender,
				role: user.role,
			};
		} catch (error) {
			console.error("Error fetching user by email:", error);
			throw new Error("Failed to fetch user by email");
		}
	}
	public static async getUserToken(payload: GetUserTokenPayload) {
		const { email, password } = payload;
		const user = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1)
			.then((rows) => rows[0]);
		if (!user) throw new Error("user not found");

		const userSalt = user.salt;
		const usersHashPassword = UserService.generateHash(password, userSalt);

		if (usersHashPassword !== user.password)
			throw new Error("Incorrect Password");

		// Gen Token
		const token = JWT.sign(
			{ id: user.id, email: user.email },
			process.env.JWT_SECRET!
		);
		return token;
	}
	public static decodeJWTToken(token: string) {
		return JWT.verify(token, process.env.JWT_SECRET!);
	}
	public static async searchUsers(query: string) {
		try {
			// STEP 1 → SQL partial match
			const partialUsers = await db
				.select()
				.from(users)
				.where(
					or(
						like(users.name, `%${query}%`),
						like(users.email, `%${query}%`)
					)
				)
				.limit(10);

			if (partialUsers.length >= 5) {
				// Enough results, return immediately
				return partialUsers.map((user) => ({
					id: user.id,
					name: user.name,
					email: user.email,
					avatar: user.avatar,
				}));
			}

			// STEP 2 → fallback to fuzzy search

			// Fetch a broader chunk for fuzzy search
			const allUsers = await db.select().from(users).limit(500);

			const fuse = new Fuse(allUsers, {
				keys: ["name", "email"],
				threshold: 0.3,
			});

			const result = fuse.search(query);

			return result.slice(0, 10).map((res) => {
				const user = res.item;
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					avatar: user.avatar,
					role: user.role,
					gender: user.gender,
				};
			});
		} catch (error) {
			console.error("Error searching users:", error);
			throw new Error("Failed to search users");
		}
	}
}

export default UserService;
