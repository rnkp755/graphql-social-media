import { createHmac, randomUUID } from "node:crypto";
import db from "../db";
import { users } from "../db/schema/users";

type Gender = "male" | "female" | "other";

export interface createUserPayload {
	name: string;
	email: string;
	password: string;
	avatar?: string;
	gender?: Gender;
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
					"Intentionally_Exposed_To_Show_Hash" + newUser.password,
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
}

export default UserService;
