import UserService from "../../services/users";
import type { createUserPayload } from "../../services/users";

const mutations = {
	createUser: async (_: any, args: createUserPayload) => {
		const res = await UserService.createUser(args);
		return res ?? null;
	},
};

export const resolvers = {
	Query: {
		_empty: () => "Hello from server",
	},
	Mutation: mutations,
};
  