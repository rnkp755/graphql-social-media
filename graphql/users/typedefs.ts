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

type FollowData {
    message: String
    id: ID
    followerId: String
    followingId: String
    createdAt: DateTime
    updatedAt: DateTime
}

type Query {
    getUserById(id: String!): User
    getUserByEmail(email: String!): User
    getUserToken(email: String!, password: String!): String
    getCurrentLoggedInUser: User
    searchUsers(query: String!): [User]
}

type Mutation {
    createUser(
        name: String!
        email: String!
        password: String!
        avatar: String
        gender: String
    ): User
    followUser(followingId: String!): FollowData
    unfollowUser(followingId: String!): FollowData
}
`;
