import UserService from "../../services/users";
import type {
	createUserPayload,
	followUserPayload,
} from "../../services/users";

const mutations = {
	createUser: async (_: any, args: createUserPayload) => {
		const res = await UserService.createUser(args);
		return res ?? null;
	},
	followUser: async (_: any, args: followUserPayload, context: any) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to follow a user");
		}
		if (context.user.id === args.followerId) {
			throw new Error("You cannot follow yourself");
		}
		args.followerId = context.user.id;
		console.log(args);
		const res = await UserService.followUser(args);
		return res ?? null;
	},
	unfollowUser: async (_: any, args: followUserPayload, context: any) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to unfollow a user");
		}
		if (context.user.id === args.followerId) {
			throw new Error("You cannot unfollow yourself");
		}
		args.followerId = context.user.id;
		const res = await UserService.unfollowUser(args);
		return res ?? null;
	},
};

const queries = {
	getUserById: async (_: any, args: { id: string }) => {
		const res = await UserService.getUserById(args.id);
		return res ?? null;
	},
	getUserByEmail: async (_: any, args: { email: string }) => {
		const res = await UserService.getUserByEmail(args.email);
		return res ?? null;
	},
	searchUsers: async (_: any, args: { query: string }) => {
		const res = await UserService.searchUsers(args.query);
		return res ?? null;
	},
	getUserToken: async (_: any, args: { email: string; password: string }) => {
		const res = await UserService.getUserToken(args);
		return res ?? null;
	},
	getCurrentLoggedInUser: async (_: any, parameters: any, context: any) => {
		console.log("Context User: ", context);
		if (context && context.user) {
			const id = context.user.id;
			const user = await UserService.getUserById(id);
			return user;
		}
		throw new Error("I dont know who are you");
	},
};

export const resolvers = {
	Query: queries,
	Mutation: mutations,
};
