export const typeDefs = `#graphql
scalar DateTime

type Comment {
    id: ID!
    postId: String!
    userId: String!
    content: String!
    createdAt: DateTime
    updatedAt: DateTime
    userName: String
    userAvatar: String
}

type CommentResponse {
    message: String!
    id: ID
    postId: String
    userId: String
    content: String
    createdAt: DateTime
    updatedAt: DateTime
    success: Boolean
}

type Query {
    getCommentsByPostId(postId: String!, limit: Int): [Comment]
}

type Mutation {
    createComment(postId: String!, content: String!): CommentResponse
    updateComment(commentId: String!, content: String!): CommentResponse
    deleteComment(commentId: String!): CommentResponse
}
`;
