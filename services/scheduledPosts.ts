import { scheduledPosts } from "../db/schema/scheduledPosts";
import { posts } from "../db/schema/posts";
import db from "../db";
import { eq, lte, and } from "drizzle-orm";
import * as cron from "node-cron";

export type createScheduledPostPayload = {
	description?: string;
	mediaUrl?: string;
	mediatype?: "image" | "video";
	commentsDisabled?: boolean;
	userId: string;
	scheduledFor: Date;
};

export type ScheduledPost = {
	id: string;
	description: string | null;
	mediaUrl: string | null;
	mediatype: "image" | "video" | null;
	scheduledBy: string;
	commentsDisabled: boolean | null;
	scheduledFor: Date;
	status: "pending" | "published" | "failed" | "cancelled" | null;
	publishedPostId: string | null;
	errorMessage: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
};

class ScheduledPostService {
	private static cronJob: cron.ScheduledTask | null = null;

	// Initialize the cron job to check for scheduled posts every minute
	public static initializeScheduler() {
		if (this.cronJob) {
			this.cronJob.stop();
		}

		// Run every minute to check for posts to publish
		this.cronJob = cron.schedule("* * * * *", async () => {
			try {
				await this.processScheduledPosts();
			} catch (error) {
				console.error("Error processing scheduled posts:", error);
			}
		});

		console.log("Scheduled post processor initialized");
	}

	// Stop the scheduler
	public static stopScheduler() {
		if (this.cronJob) {
			this.cronJob.stop();
			this.cronJob = null;
		}
	}

	// Create a new scheduled post
	public static async createScheduledPost(
		payload: createScheduledPostPayload
	) {
		try {
			const {
				description,
				mediaUrl,
				mediatype,
				commentsDisabled,
				userId,
				scheduledFor,
			} = payload;

			// Validate that scheduled time is in the future
			if (scheduledFor <= new Date()) {
				throw new Error("Scheduled time must be in the future");
			}

			if (!description && !mediaUrl) {
				throw new Error(
					"Description or media is required to create a scheduled post"
				);
			}

			const insertedScheduledPost = await db
				.insert(scheduledPosts)
				.values({
					description: description || null,
					mediaUrl: mediaUrl || null,
					mediatype: (mediatype as "image" | "video") || "image",
					commentsDisabled,
					scheduledBy: userId,
					scheduledFor,
					status: "pending",
				})
				.returning();

			const newScheduledPost = insertedScheduledPost?.[0];
			if (!newScheduledPost) {
				throw new Error("Scheduled post creation failed");
			}

			return newScheduledPost;
		} catch (error) {
			console.error("Error creating scheduled post:", error);
			throw new Error("Scheduled post creation failed");
		}
	}

	// Get scheduled posts for a user
	public static async getUserScheduledPosts(
		userId: string,
		limit = 20
	): Promise<ScheduledPost[]> {
		try {
			const scheduledPostsData = await db
				.select()
				.from(scheduledPosts)
				.where(eq(scheduledPosts.scheduledBy, userId))
				.orderBy(scheduledPosts.scheduledFor)
				.limit(limit);

			return scheduledPostsData;
		} catch (error) {
			console.error("Error fetching scheduled posts:", error);
			throw new Error("Failed to fetch scheduled posts");
		}
	}

	// Get a scheduled post by ID
	public static async getScheduledPostById(id: string) {
		try {
			const scheduledPost = await db
				.select()
				.from(scheduledPosts)
				.where(eq(scheduledPosts.id, id))
				.limit(1)
				.then((rows) => rows[0]);

			if (!scheduledPost) {
				throw new Error("Scheduled post not found");
			}
			return scheduledPost;
		} catch (error) {
			console.error("Error fetching scheduled post by ID:", error);
			throw new Error("Scheduled post not found");
		}
	}

	// Cancel a scheduled post
	public static async cancelScheduledPost(id: string, userId: string) {
		try {
			const scheduledPost = await this.getScheduledPostById(id);

			if (scheduledPost.scheduledBy !== userId) {
				throw new Error("Unauthorized to cancel this scheduled post");
			}

			if (scheduledPost.status !== "pending") {
				throw new Error("Can only cancel pending scheduled posts");
			}

			const updatedPost = await db
				.update(scheduledPosts)
				.set({
					status: "cancelled",
					updatedAt: new Date(),
				})
				.where(eq(scheduledPosts.id, id))
				.returning();

			return updatedPost[0];
		} catch (error) {
			console.error("Error cancelling scheduled post:", error);
			throw new Error("Failed to cancel scheduled post");
		}
	}

	// Update a scheduled post (only if it's still pending)
	public static async updateScheduledPost(
		id: string,
		userId: string,
		updates: Partial<createScheduledPostPayload>
	) {
		try {
			const scheduledPost = await this.getScheduledPostById(id);

			if (scheduledPost.scheduledBy !== userId) {
				throw new Error("Unauthorized to update this scheduled post");
			}

			if (scheduledPost.status !== "pending") {
				throw new Error("Can only update pending scheduled posts");
			}

			// Validate scheduled time if being updated
			if (updates.scheduledFor && updates.scheduledFor <= new Date()) {
				throw new Error("Scheduled time must be in the future");
			}

			const updatedPost = await db
				.update(scheduledPosts)
				.set({
					...updates,
					updatedAt: new Date(),
				})
				.where(eq(scheduledPosts.id, id))
				.returning();

			return updatedPost[0];
		} catch (error) {
			console.error("Error updating scheduled post:", error);
			throw new Error("Failed to update scheduled post");
		}
	}

	// Process scheduled posts that are ready to be published
	private static async processScheduledPosts() {
		try {
			const now = new Date();

			// Get all pending posts that are scheduled for now or earlier
			const postsToPublish = await db
				.select()
				.from(scheduledPosts)
				.where(
					and(
						eq(scheduledPosts.status, "pending"),
						lte(scheduledPosts.scheduledFor, now)
					)
				);

			console.log(`Found ${postsToPublish.length} posts to publish`);

			for (const scheduledPost of postsToPublish) {
				await this.publishScheduledPost(scheduledPost);
			}
		} catch (error) {
			console.error("Error in processScheduledPosts:", error);
		}
	}

	// Publish a single scheduled post
	private static async publishScheduledPost(scheduledPost: any) {
		try {
			// Create the actual post
			const insertedPost = await db
				.insert(posts)
				.values({
					description: scheduledPost.description,
					mediaUrl: scheduledPost.mediaUrl,
					mediatype: scheduledPost.mediatype,
					commentsDisabled: scheduledPost.commentsDisabled,
					postedBy: scheduledPost.scheduledBy,
				})
				.returning();

			const newPost = insertedPost[0];
			if (!newPost) {
				throw new Error("Failed to create post from scheduled post");
			}

			// Update the scheduled post status
			await db
				.update(scheduledPosts)
				.set({
					status: "published",
					publishedPostId: newPost.id,
					updatedAt: new Date(),
				})
				.where(eq(scheduledPosts.id, scheduledPost.id));

			console.log(
				`Successfully published scheduled post ${scheduledPost.id}`
			);
		} catch (error) {
			console.error(
				`Error publishing scheduled post ${scheduledPost.id}:`,
				error
			);

			// Update the scheduled post with error status
			await db
				.update(scheduledPosts)
				.set({
					status: "failed",
					errorMessage:
						error instanceof Error ? error.message : String(error),
					updatedAt: new Date(),
				})
				.where(eq(scheduledPosts.id, scheduledPost.id));
		}
	}
}

export default ScheduledPostService;
