import UserService from "./users";
import { posts } from "../db/schema/posts";
import { follows } from "../db/schema/follows";
import { users } from "../db/schema/users";
import db from "../db";
import { eq, desc, inArray } from "drizzle-orm";

export type createPostPayload = {
	description?: string;
	mediaUrl?: string;
	mediatype?: "image" | "video";
	commentsDisabled?: boolean;
	userId: string;
};

export type FeedPost = {
	id: string;
	description: string | null;
	mediaUrl: string | null;
	mediatype: "image" | "video" | null;
	postedBy: string;
	commentsDisabled: boolean | null;
	likesCount: number | null;
	commentsCount: number | null;
	createdAt: Date | null;
	updatedAt: Date | null;
	userName: string | null;
	userAvatar: string | null;
};

class PostService {
	public static async createPost(payload: createPostPayload) {
		try {
			const {
				description,
				mediaUrl,
				mediatype,
				commentsDisabled,
				userId,
			} = payload;

			if (!description && !mediaUrl) {
				throw new Error(
					"Description or media is required to create a post"
				);
			}

			const insertedPosts = await db
				.insert(posts)
				.values({
					description: description || null,
					mediaUrl: mediaUrl || null,
					mediatype: (mediatype as "image" | "video") || "image",
					commentsDisabled,
					postedBy: userId,
				})
				.returning();

			const newPost = insertedPosts?.[0];
			if (!newPost) {
				throw new Error("Post creation failed");
			}

			return newPost;
		} catch (error) {
			console.error("Error creating post:", error);
			throw new Error("Post creation failed");
		}
	}
	public static async getPostById(id: string) {
		try {
			const post = await db
				.select()
				.from(posts)
				.where(eq(posts.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!post) {
				throw new Error("Post not found");
			}
			return post;
		} catch (error) {
			console.error("Error fetching post by ID:", error);
			throw new Error("Post not found");
		}
	}
	public static async getFeedPosts(
		userId: string,
		limit = 10
	): Promise<FeedPost[]> {
		try {
			// Get IDs of users that the current user follows
			const followedUsers = await db
				.select({ followingId: follows.followingId })
				.from(follows)
				.where(eq(follows.followerId, userId));

			const followedUserIds = followedUsers.map((f) => f.followingId);

			// Include the user's own ID to show their posts too
			const userIdsToInclude = [...followedUserIds, userId];

			// Fetch posts from followed users and the user themselves
			const postsData = await db
				.select({
					id: posts.id,
					description: posts.description,
					mediaUrl: posts.mediaUrl,
					mediatype: posts.mediatype,
					postedBy: posts.postedBy,
					commentsDisabled: posts.commentsDisabled,
					likesCount: posts.likesCount,
					commentsCount: posts.commentsCount,
					createdAt: posts.createdAt,
					updatedAt: posts.updatedAt,
					// Include user information
					userName: users.name,
					userAvatar: users.avatar,
				})
				.from(posts)
				.leftJoin(users, eq(posts.postedBy, users.id))
				.where(inArray(posts.postedBy, userIdsToInclude))
				.orderBy(desc(posts.createdAt))
				.limit(limit);

			return postsData;
		} catch (error) {
			console.error("Error fetching feed posts:", error);
			throw new Error("Failed to fetch feed posts");
		}
	}
	public static async getPostsByUserId(
		userId: string,
		limit = 20
	): Promise<FeedPost[]> {
		try {
			const postsData = await db
				.select({
					id: posts.id,
					description: posts.description,
					mediaUrl: posts.mediaUrl,
					mediatype: posts.mediatype,
					postedBy: posts.postedBy,
					commentsDisabled: posts.commentsDisabled,
					likesCount: posts.likesCount,
					commentsCount: posts.commentsCount,
					createdAt: posts.createdAt,
					updatedAt: posts.updatedAt,
					userName: users.name,
					userAvatar: users.avatar,
				})
				.from(posts)
				.leftJoin(users, eq(posts.postedBy, users.id))
				.where(eq(posts.postedBy, userId))
				.orderBy(desc(posts.createdAt))
				.limit(limit);

			return postsData;
		} catch (error) {
			console.error("Error fetching posts by user ID:", error);
			throw new Error("Failed to fetch user posts");
		}
	}
}

export default PostService;
