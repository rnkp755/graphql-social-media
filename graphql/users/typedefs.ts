export const typeDefs = `#graphql
scalar DateTime

type User {
    id: ID!
    name: String!
    email: String!
    password: String
    salt: String
    avatar: String
    role: String
    gender: String
    createdAt: DateTime
    updatedAt: DateTime
}

type Query {
    getUserById(id: String!): User
    getUserByEmail(email: String!): User
    getUserToken(email: String!, password: String!): String
    getCurrentLoggedInUser: User
}

type Mutation {
    createUser(
        name: String!
        email: String!
        password: String!
        avatar: String
        gender: String
    ): User
}
`;
