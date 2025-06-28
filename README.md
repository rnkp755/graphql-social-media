# Social Media GraphQL API

A comprehensive GraphQL-based social media backend API built with TypeScript, featuring user management, posts, comments, likes, and scheduled posts functionality with media upload support.

## 🚀 Features

-   **User Management**: Registration, authentication, profile management, follow/unfollow system
-   **Posts**: Create, read posts with media upload support (images/videos via Cloudinary)
-   **Interactions**: Like/unlike posts, comment system with CRUD operations
-   **Scheduled Posts**: Schedule posts for future publishing with automatic processing
-   **Media Upload**: Cloudinary integration for image and video uploads
-   **Authentication**: JWT-based authentication with context-aware resolvers
-   **Real-time Processing**: Automated scheduled post publishing with cron jobs

## 🛠️ Tech Stack

-   **Runtime**: Bun (TypeScript)
-   **GraphQL**: Apollo Server v4
-   **Database**: PostgreSQL with Drizzle ORM
-   **Media Storage**: Cloudinary
-   **Authentication**: JWT
-   **File Upload**: GraphQL Upload Minimal
-   **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

-   [Bun](https://bun.sh) v1.2.17 or later
-   [Docker](https://www.docker.com/) and Docker Compose
-   [Node.js](https://nodejs.org/) (if using npm/yarn instead of Bun)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rnkp755/graphql-social-media.git
cd social-media-graphql
```

### 2. Install Dependencies

```bash
bun install
# Or using npm/yarn
npm install
# yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/social_media
JWT_SECRET=your-jwt-secret-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=4000
```

### 4. Start Services

```bash
# Start PostgreSQL database
docker compose up -d

# Generate and run database migrations
bun db:push

# Start the development server
bun run dev
```

The server will be available at `http://localhost:4000/graphql`

## 📚 API Documentation

### 🔐 Authentication

All mutations (except user registration and login) require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### 👤 User Management

#### Queries

##### `getUserById(id: String!): User`

Get user information by ID.

**Example:**

```graphql
query {
	getUserById(id: "user-uuid") {
		id
		name
		email
		avatar
		createdAt
	}
}
```

##### `getUserByEmail(email: String!): User`

Get user information by email address.

##### `searchUsers(query: String!): [User]`

Search users by name or email.

##### `getCurrentLoggedInUser: User`

Get current authenticated user's information.

##### `getUserToken(email: String!, password: String!): String`

Authenticate user and get JWT token.

**Example:**

```graphql
query {
	getUserToken(email: "user@example.com", password: "password123")
}
```

#### Mutations

##### `createUser`: Register new user

```graphql
mutation {
	createUser(
		name: "John Doe"
		email: "john@example.com"
		password: "securePassword123"
		avatar: "https://example.com/avatar.jpg"
		gender: "male"
	) {
		id
		name
		email
		createdAt
	}
}
```

##### `followUser`: Follow another user

```graphql
mutation {
	followUser(followingId: "user-uuid") {
		message
		followerId
		followingId
		createdAt
	}
}
```

##### `unfollowUser`: Unfollow a user

```graphql
mutation {
	unfollowUser(followingId: "user-uuid") {
		message
	}
}
```

### 📝 Posts Management

#### Queries

##### `getPostById(id: ID!): Post`

Get a specific post by ID.

##### `getFeedPosts(limit: Int): [Post]`

Get feed posts for authenticated user (includes followed users' posts).

##### `getUserPosts(userId: ID!, limit: Int): [Post]`

Get posts by a specific user.

**Example:**

```graphql
query {
	getFeedPosts(limit: 10) {
		id
		description
		mediaUrl
		mediatype
		postedBy {
			id
			name
			avatar
		}
		likesCount
		commentsCount
		createdAt
	}
}
```

#### Mutations

##### `createPost`: Create a new post

```graphql
mutation CreatePost($media: Upload) {
	createPost(
		description: "This is my new post!"
		media: $media
		commentsDisabled: false
	) {
		id
		description
		mediaUrl
		mediatype
		postedBy {
			name
		}
		createdAt
	}
}
```

### ❤️ Likes Management

#### Mutations

##### `likePost`: Like a post

```graphql
mutation {
	likePost(postId: "post-uuid") {
		message
		success
		postId
		userId
		createdAt
	}
}
```

##### `unlikePost`: Unlike a post

```graphql
mutation {
	unlikePost(postId: "post-uuid") {
		message
		success
	}
}
```

### 💬 Comments Management

#### Queries

##### `getCommentsByPostId(postId: String!, limit: Int): [Comment]`

Get comments for a specific post.

```graphql
query {
	getCommentsByPostId(postId: "post-uuid", limit: 20) {
		id
		content
		userName
		userAvatar
		createdAt
		updatedAt
	}
}
```

#### Mutations

##### `createComment`: Add a comment to a post

```graphql
mutation {
	createComment(postId: "post-uuid", content: "Great post!") {
		message
		success
		id
		content
		createdAt
	}
}
```

##### `updateComment`: Update an existing comment

```graphql
mutation {
	updateComment(commentId: "comment-uuid", content: "Updated comment") {
		message
		success
		content
		updatedAt
	}
}
```

##### `deleteComment`: Delete a comment

```graphql
mutation {
	deleteComment(commentId: "comment-uuid") {
		message
		success
	}
}
```

### ⏰ Scheduled Posts

#### Queries

##### `getScheduledPostById(id: ID!): ScheduledPost`

Get a specific scheduled post.

##### `getUserScheduledPosts(limit: Int): [ScheduledPost]`

Get user's scheduled posts.

```graphql
query {
	getUserScheduledPosts(limit: 10) {
		id
		description
		mediaUrl
		scheduledFor
		status
		publishedPost {
			id
		}
		createdAt
	}
}
```

#### Mutations

##### `createScheduledPost`: Schedule a post for future publishing

```graphql
mutation CreateScheduledPost($media: Upload) {
	createScheduledPost(
		description: "This will be posted later"
		media: $media
		commentsDisabled: false
		scheduledFor: "2025-07-01T10:00:00Z"
	) {
		id
		description
		scheduledFor
		status
		scheduledBy {
			name
		}
	}
}
```

##### `updateScheduledPost`: Update a scheduled post

```graphql
mutation UpdateScheduledPost($media: Upload) {
	updateScheduledPost(
		id: "scheduled-post-uuid"
		description: "Updated description"
		scheduledFor: "2025-07-02T14:00:00Z"
	) {
		id
		description
		scheduledFor
		status
	}
}
```

##### `cancelScheduledPost`: Cancel a scheduled post

```graphql
mutation {
	cancelScheduledPost(id: "scheduled-post-uuid") {
		id
		status
	}
}
```

## 📊 Data Types

### Core Types

```graphql
type User {
	id: ID!
	name: String!
	email: String!
	avatar: String
	role: String
	gender: String
	createdAt: DateTime
	updatedAt: DateTime
}

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

enum ScheduledPostStatus {
	PENDING
	PUBLISHED
	FAILED
	CANCELLED
}
```

## 🔧 Development Scripts

```bash
# Database operations
bun db:generate    # Generate migration files
bun db:migrate     # Run migrations
bun db:push        # Generate and run migrations
bun db:studio      # Open Drizzle Studio

# Development
bun run dev        # Start development server with hot reload
```

## 🐳 Docker Setup

The project includes a `docker-compose.yml` for easy PostgreSQL setup:

```bash
# Start database container
docker compose up -d

# Stop database container
docker compose down

# View logs
docker compose logs -f
```

## 🔒 Security Features

-   JWT-based authentication
-   Password hashing with salt
-   Protected mutations requiring authentication
-   User authorization checks for sensitive operations
-   File upload size limits and validation

## 📁 Project Structure

```
social-media-graphql/
├── db/                     # Database configuration and schema
├── drizzle/               # Database migrations
├── graphql/               # GraphQL schema and resolvers
│   ├── users/            # User-related GraphQL files
│   ├── posts/            # Post-related GraphQL files
│   ├── likes/            # Like-related GraphQL files
│   ├── comments/         # Comment-related GraphQL files
│   └── scheduledPosts/   # Scheduled post GraphQL files
├── lib/                   # Utility libraries
├── services/              # Business logic services
└── public/               # Static files and temp uploads
```

---

**Built with ❤️ using Bun and GraphQL by [Raushan Kumar Thakur](https://www.linkedin.com/in/rnkp755/)**
