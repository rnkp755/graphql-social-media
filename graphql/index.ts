import { ApolloServer } from "@apollo/server";
import { User } from "./users";
import { Post } from "./posts";
import "dotenv/config";

const createApolloGraphqlServer = async () => {
	const gqlServer = new ApolloServer({
		typeDefs: `
			${User.typeDefs}
			${Post.typeDefs}
		`,
		resolvers: {
			Query: {
				...User.resolvers.Query,
				...Post.resolvers.Query,
			},
			Mutation: {
				...User.resolvers.Mutation,
				...Post.resolvers.Mutation,
			},
			Post: {
				...Post.resolvers.Post,
			},
		},
		csrfPrevention: false,
	});

	await gqlServer.start();
	return gqlServer;
};

export default createApolloGraphqlServer;
