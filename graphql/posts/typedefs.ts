export const typeDefs = `#graphql
scalar DateTime

type Post {
    id: ID!
    title: String!
    description: String!
    image: String
    postedBy: User!
    createdAt: DateTime
    updatedAt: DateTime
}

type Query {
    getPostById(id: ID!): Post
}

type Mutation {
    createPost(title: String!, description: String!, image: String): Post
}
`;