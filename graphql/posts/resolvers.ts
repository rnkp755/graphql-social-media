import PostService from "../../services/posts";
import type { createPostPayload } from "../../services/posts";
import UserService from "../../services/users";

const mutations = {
	createPost: async (_: any, args: createPostPayload, context: any) => {
		const userId = context?.user?.id;
		if (!userId) {
			throw new Error("Unauthorized");
		}
		const payload = {
			...args,
			userId,
		};

		const post = await PostService.createPost(payload);
		return post;
	},
};

const queries = {
	getPostById: async (_: any, args: { id: string }) => {
		const res = await PostService.getPostById(args.id);
		return res ?? null;
	},
};

const postResolvers = {
	Post: {
		postedBy: async (parent: any) => {
			// parent.postedBy is the user id in your posts table
			const userId = parent.userId || parent.postedBy;
			if (!userId) return null;

			const user = await UserService.getUserById(userId);
			return user;
		},
	},
};

export const resolvers = {
	Query: queries,
	Mutation: mutations,
	...postResolvers,
};
