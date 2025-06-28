import LikeService from "../../services/likes";

const mutations = {
	likePost: async (_: any, args: { postId: string }, context: any) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to like a post");
		}
		const res = await LikeService.likePost(args.postId, context.user.id);
		return res ?? null;
	},
	unlikePost: async (_: any, args: { postId: string }, context: any) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to unlike a post");
		}
		const res = await LikeService.unlikePost(args.postId, context.user.id);
		return res ?? null;
	},
};

export const resolvers = {
	Mutation: mutations,
};
