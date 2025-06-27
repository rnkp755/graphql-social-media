import { ApolloServer } from "@apollo/server";
import { User } from "./users";
import "dotenv/config";

const createApolloGraphqlServer = async () => {
	const gqlServer = new ApolloServer({
		typeDefs: `
            ${User.typeDefs}
        `,
		resolvers: {
			Query: User.resolvers.Query,
			Mutation: User.resolvers.Mutation,
		},
	});

	await gqlServer.start();
	return gqlServer;
};

export default createApolloGraphqlServer;
