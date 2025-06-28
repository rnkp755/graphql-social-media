import { posts } from "../db/schema/posts";
import { users } from "../db/schema/users";
import { likes } from "../db/schema/likes";
import db from "../db";
import { eq, and } from "drizzle-orm";

class LikeService {
	public static async likePost(postId: string, userId: string) {
		try {
			const post = await db
				.select()
				.from(posts)
				.where(eq(posts.id, postId))
				.limit(1)
				.then((rows) => rows[0]);
			if (!post) {
				throw new Error("Post not found");
			} else if (post.postedBy === userId) {
				return {
					message: "You cannot like your own post",
					success: false,
				};
			}

			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((rows) => rows[0]);
			if (!user) {
				throw new Error("User not found");
			}

			const likeExists = await db
				.select()
				.from(likes)
				.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
				.limit(1)
				.then((rows: any) => rows.length > 0);

			if (likeExists) {
				return {
					message: "You have already liked this post",
					...likeExists[0],
				};
			}

			const insertedLike = await db
				.insert(likes)
				.values({
					postId: postId,
					userId: userId,
				})
				.returning();

			if (!insertedLike || insertedLike.length === 0) {
				throw new Error("Failed to like post");
			}

			// Update the likes count in the posts table
			await db
				.update(posts)
				.set({
					likesCount: (post.likesCount || 0) + 1,
				})
				.where(eq(posts.id, postId));

			return {
				message: "Post liked successfully",
				...insertedLike[0],
			};
		} catch (error) {
			console.error("Error liking post:", error);
			throw new Error("Failed to like post");
		}
	}

	public static async unlikePost(postId: string, userId: string) {
		try {
			// Check if post exists
			const post = await db
				.select()
				.from(posts)
				.where(eq(posts.id, postId))
				.limit(1)
				.then((rows) => rows[0]);
			if (!post) {
				throw new Error("Post not found");
			}

			// Check if user exists
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.limit(1)
				.then((rows) => rows[0]);
			if (!user) {
				throw new Error("User not found");
			}

			// Check if like exists
			const existingLike = await db
				.select()
				.from(likes)
				.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
				.limit(1)
				.then((rows) => rows[0]);

			if (!existingLike) {
				return {
					message: "You haven't liked this post yet",
					success: false,
				};
			}

			// Delete the like
			const deletedLike = await db
				.delete(likes)
				.where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
				.returning();

			if (!deletedLike || deletedLike.length === 0) {
				throw new Error("Failed to unlike post");
			}

			// Update the likes count in the posts table (decrement)
			await db
				.update(posts)
				.set({
					likesCount: Math.max((post.likesCount || 0) - 1, 0),
				})
				.where(eq(posts.id, postId));

			return {
				message: "Post unliked successfully",
				success: true,
				...deletedLike[0],
			};
		} catch (error) {
			console.error("Error unliking post:", error);
			throw new Error("Failed to unlike post");
		}
	}
}
export default LikeService;
