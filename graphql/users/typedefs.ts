export const typeDefs = `#graphql
scalar DateTime

type User {
    id: ID!
    name: String!
    email: String!
    password: String!
    avatar: String
    role: String
    gender: String
    createdAt: DateTime!
    updatedAt: DateTime!
}

type Query {
    _empty: String
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
