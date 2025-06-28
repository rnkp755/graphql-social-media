import CommentService from "../../services/comments";

const queries = {
	getCommentsByPostId: async (
		_: any,
		args: { postId: string; limit?: number }
	) => {
		const res = await CommentService.getCommentsByPostId(
			args.postId,
			args.limit
		);
		return res ?? null;
	},
};

const mutations = {
	createComment: async (
		_: any,
		args: { postId: string; content: string },
		context: any
	) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to create a comment");
		}
		const res = await CommentService.createComment(
			args.postId,
			context.user.id,
			args.content
		);
		return res ?? null;
	},
	updateComment: async (
		_: any,
		args: { commentId: string; content: string },
		context: any
	) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to update a comment");
		}
		const res = await CommentService.updateComment(
			args.commentId,
			context.user.id,
			args.content
		);
		return res ?? null;
	},
	deleteComment: async (
		_: any,
		args: { commentId: string },
		context: any
	) => {
		if (!context || !context.user) {
			throw new Error("You must be logged in to delete a comment");
		}
		const res = await CommentService.deleteComment(
			args.commentId,
			context.user.id
		);
		return res ?? null;
	},
};

export const resolvers = {
	Query: queries,
	Mutation: mutations,
};
