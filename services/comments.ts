import { posts } from "../db/schema/posts";
import { users } from "../db/schema/users";
import { comments } from "../db/schema/comments";
import db from "../db";
import { eq, and, desc } from "drizzle-orm";

class CommentService {
	public static async createComment(
		postId: string,
		userId: string,
		content: string
	) {
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

			// Check if comments are disabled for this post
			if (post.commentsDisabled) {
				throw new Error("Comments are disabled for this post");
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

			// Validate content
			if (!content || content.trim().length === 0) {
				throw new Error("Comment content cannot be empty");
			}

			// Create the comment
			const insertedComment = await db
				.insert(comments)
				.values({
					postId: postId,
					userId: userId,
					content: content.trim(),
				})
				.returning();

			if (!insertedComment || insertedComment.length === 0) {
				throw new Error("Failed to create comment");
			}

			// Update the comments count in the posts table
			await db
				.update(posts)
				.set({
					commentsCount: (post.commentsCount || 0) + 1,
					updatedAt: new Date(),
				})
				.where(eq(posts.id, postId));

			return {
				message: "Comment created successfully",
				...insertedComment[0],
			};
		} catch (error) {
			console.error("Error creating comment:", error);
			throw error;
		}
	}

	public static async getCommentsByPostId(postId: string, limit = 20) {
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

			// Get comments with user information
			const commentsData = await db
				.select({
					id: comments.id,
					postId: comments.postId,
					userId: comments.userId,
					content: comments.content,
					createdAt: comments.createdAt,
					updatedAt: comments.updatedAt,
					// Include user information
					userName: users.name,
					userAvatar: users.avatar,
				})
				.from(comments)
				.leftJoin(users, eq(comments.userId, users.id))
				.where(eq(comments.postId, postId))
				.orderBy(desc(comments.createdAt))
				.limit(limit);

			return commentsData;
		} catch (error) {
			console.error("Error fetching comments:", error);
			throw new Error("Failed to fetch comments");
		}
	}
	public static async updateComment(
		commentId: string,
		userId: string,
		content: string
	) {
		try {
			// Validate content
			if (!content || content.trim().length === 0) {
				throw new Error("Comment content cannot be empty");
			}

			// Check if comment exists and belongs to the user
			const existingComment = await db
				.select()
				.from(comments)
				.where(eq(comments.id, commentId))
				.limit(1)
				.then((rows) => rows[0]);

			if (!existingComment) {
				throw new Error("Comment not found");
			}

			if (existingComment.userId !== userId) {
				throw new Error("You can only update your own comments");
			}

			// Update the comment
			const updatedComment = await db
				.update(comments)
				.set({
					content: content.trim(),
					updatedAt: new Date(),
				})
				.where(eq(comments.id, commentId))
				.returning();

			if (!updatedComment || updatedComment.length === 0) {
				throw new Error("Failed to update comment");
			}

			return {
				message: "Comment updated successfully",
				...updatedComment[0],
			};
		} catch (error) {
			console.error("Error updating comment:", error);
			throw error;
		}
	}

	public static async deleteComment(commentId: string, userId: string) {
		try {
			// Check if comment exists and belongs to the user
			const existingComment = await db
				.select()
				.from(comments)
				.where(eq(comments.id, commentId))
				.limit(1)
				.then((rows) => rows[0]);

			if (!existingComment) {
				throw new Error("Comment not found");
			}

			if (existingComment.userId !== userId) {
				throw new Error("You can only delete your own comments");
			}

			// Get the post to update the comments count
			const post = await db
				.select()
				.from(posts)
				.where(eq(posts.id, existingComment.postId))
				.limit(1)
				.then((rows) => rows[0]);

			if (!post) {
				throw new Error("Associated post not found");
			}

			// Delete the comment
			const deletedComment = await db
				.delete(comments)
				.where(eq(comments.id, commentId))
				.returning();

			if (!deletedComment || deletedComment.length === 0) {
				throw new Error("Failed to delete comment");
			}

			// Update the comments count in the posts table (decrement)
			await db
				.update(posts)
				.set({
					commentsCount: Math.max((post.commentsCount || 0) - 1, 0),
					updatedAt: new Date(),
				})
				.where(eq(posts.id, existingComment.postId));

			return {
				message: "Comment deleted successfully",
				success: true,
				...deletedComment[0],
			};
		} catch (error) {
			console.error("Error deleting comment:", error);
			throw error;
		}
	}
}

export default CommentService;
