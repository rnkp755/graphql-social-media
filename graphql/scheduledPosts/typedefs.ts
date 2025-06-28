export const typeDefs = `#graphql
scalar DateTime

enum ScheduledPostStatus {
    PENDING
    PUBLISHED
    FAILED
    CANCELLED
}

type ScheduledPost {
    id: ID!
    description: String
    mediaUrl: String
    mediatype: String
    scheduledBy: User!
    commentsDisabled: Boolean
    scheduledFor: DateTime!
    status: ScheduledPostStatus!
    publishedPostId: ID
    publishedPost: Post
    errorMessage: String
    createdAt: DateTime
    updatedAt: DateTime
}

type Query {
    getScheduledPostById(id: ID!): ScheduledPost
    getUserScheduledPosts(limit: Int): [ScheduledPost]
}

type Mutation {
    createScheduledPost(
        description: String
        media: Upload
        commentsDisabled: Boolean
        scheduledFor: DateTime!
    ): ScheduledPost
    
    updateScheduledPost(
        id: ID!
        description: String
        media: Upload
        commentsDisabled: Boolean
        scheduledFor: DateTime
    ): ScheduledPost
    
    cancelScheduledPost(id: ID!): ScheduledPost
}
`;
