export const typeDefs = `#graphql
scalar DateTime
scalar Upload

type Post {
    id: ID!
    description: String
    mediaUrl: String
    mediatype: String
    postedBy: User!
    commentsDisabled: Boolean
    likesCount: Int
    commentsCount: Int
    createdAt: DateTime
    updatedAt: DateTime
}

type Query {
    getPostById(id: ID!): Post
}

type Mutation {
    createPost(description: String, media: Upload, commentsDisabled: Boolean): Post
}
`;
