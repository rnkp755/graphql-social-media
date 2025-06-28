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
    success: Boolean! # Ensure success is non-nullable
}

type Mutation {
    likePost(postId: String!): LikeResponse
    unlikePost(postId: String!): LikeResponse
}
`;
