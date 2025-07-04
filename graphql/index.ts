import { ApolloServer } from "@apollo/server";
import { User } from "./users";
import { Post } from "./posts";
import { Like } from "./likes";
import { Comment } from "./comments";
import * as ScheduledPost from "./scheduledPosts";
import "dotenv/config";

const createApolloGraphqlServer = async () => {
	const gqlServer = new ApolloServer({
		typeDefs: `
			${User.typeDefs}
			${Post.typeDefs}
			${Like.typeDefs}
			${Comment.typeDefs}
			${ScheduledPost.typeDefs}
		`,
		resolvers: {
			Query: {
				...User.resolvers.Query,
				...Post.resolvers.Query,
				...Comment.resolvers.Query,
				...ScheduledPost.resolvers.Query,
			},
			Mutation: {
				...User.resolvers.Mutation,
				...Post.resolvers.Mutation,
				...Like.resolvers.Mutation,
				...Comment.resolvers.Mutation,
				...ScheduledPost.resolvers.Mutation,
			},
			Post: {
				...Post.resolvers.Post,
			},
			ScheduledPost: {
				...ScheduledPost.resolvers.ScheduledPost,
			},
			Upload: ScheduledPost.resolvers.Upload,
		},
		csrfPrevention: false,
		introspection: true,
	});

	await gqlServer.start();
	return gqlServer;
};

export default createApolloGraphqlServer;
