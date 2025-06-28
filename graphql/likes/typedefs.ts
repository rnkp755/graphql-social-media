export const typeDefs = `#graphql
scalar DateTime

type Like {
    id: ID!
    postId: String!
    userId: String!
    createdAt: DateTime
}

type LikeResponse {
    message: String!
    id: ID
    postId: String
    userId: String
    createdAt: DateTime
}

type Mutation {
    likePost(postId: String!): LikeResponse
    unlikePost(postId: String!): LikeResponse
}
`;
