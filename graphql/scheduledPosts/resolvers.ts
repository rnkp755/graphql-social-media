import { uploadOnCloudinary } from "../../lib/cloudinary";
import ScheduledPostService from "../../services/scheduledPosts";
import PostService from "../../services/posts";
import UserService from "../../services/users";
import type { createScheduledPostPayload } from "../../services/scheduledPosts";
import fs, { createWriteStream } from "fs";
import path from "path";
import { getDirname } from "../../lib/path";
import { GraphQLUpload } from "graphql-upload-minimal";

const mutations = {
	createScheduledPost: async (
		_: any,
		{ media, scheduledFor, ...args }: any,
		context: any
	) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		let mediaUrl: string | null = null;
		let mediaType: string | null = null;

		// Handle media upload if provided
		if (media) {
			try {
				const filePromise = await media;
				const file = filePromise.file;
				const { createReadStream, filename, mimetype } = file;
				const stream = createReadStream();

				const currentDir = getDirname(import.meta.url);
				const tempDir = path.join(currentDir, "../../../tmp");
				const tempPath = path.join(
					tempDir,
					`${Date.now()}-${filename}`
				);

				await fs.promises.mkdir(tempDir, { recursive: true });

				await new Promise<void>((resolve, reject) => {
					const writeStream = createWriteStream(tempPath);
					stream.on("error", reject);
					writeStream.on("error", reject);
					writeStream.on("finish", () => resolve());
					stream.pipe(writeStream);
				});

				const uploadResult = await uploadOnCloudinary(tempPath);
				if (!uploadResult || !uploadResult.secure_url) {
					throw new Error("Cloudinary upload failed");
				}

				mediaUrl = uploadResult.secure_url;
				mediaType = uploadResult.resource_type;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				throw new Error(
					`Failed to process media upload: ${errorMessage}`
				);
			}
		}

		const payload: createScheduledPostPayload = {
			...args,
			userId,
			mediaUrl,
			mediatype: mediaType as "image" | "video",
			scheduledFor: new Date(scheduledFor),
		};

		return ScheduledPostService.createScheduledPost(payload);
	},

	updateScheduledPost: async (
		_: any,
		{ id, media, scheduledFor, ...args }: any,
		context: any
	) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		let mediaUrl: string | null = null;
		let mediaType: string | null = null;

		// Handle media upload if provided
		if (media) {
			try {
				const filePromise = await media;
				const file = filePromise.file;
				const { createReadStream, filename, mimetype } = file;
				const stream = createReadStream();

				const currentDir = getDirname(import.meta.url);
				const tempDir = path.join(currentDir, "../../../tmp");
				const tempPath = path.join(
					tempDir,
					`${Date.now()}-${filename}`
				);

				await fs.promises.mkdir(tempDir, { recursive: true });

				await new Promise<void>((resolve, reject) => {
					const writeStream = createWriteStream(tempPath);
					stream.on("error", reject);
					writeStream.on("error", reject);
					writeStream.on("finish", () => resolve());
					stream.pipe(writeStream);
				});

				const uploadResult = await uploadOnCloudinary(tempPath);
				if (!uploadResult || !uploadResult.secure_url) {
					throw new Error("Cloudinary upload failed");
				}

				mediaUrl = uploadResult.secure_url;
				mediaType = uploadResult.resource_type;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				throw new Error(
					`Failed to process media upload: ${errorMessage}`
				);
			}
		}

		const updates: Partial<createScheduledPostPayload> = {
			...args,
		};

		if (mediaUrl) {
			updates.mediaUrl = mediaUrl;
			updates.mediatype = mediaType as "image" | "video";
		}

		if (scheduledFor) {
			updates.scheduledFor = new Date(scheduledFor);
		}

		return ScheduledPostService.updateScheduledPost(id, userId, updates);
	},

	cancelScheduledPost: async (
		_: any,
		{ id }: { id: string },
		context: any
	) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		return ScheduledPostService.cancelScheduledPost(id, userId);
	},
};

const queries = {
	getScheduledPostById: async (
		_: any,
		args: { id: string },
		context: any
	) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		const scheduledPost = await ScheduledPostService.getScheduledPostById(
			args.id
		);

		// Check if the user owns this scheduled post
		if (scheduledPost.scheduledBy !== userId) {
			throw new Error("Unauthorized to view this scheduled post");
		}

		return scheduledPost;
	},

	getUserScheduledPosts: async (
		_: any,
		args: { limit?: number },
		context: any
	) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		const { limit } = args;
		const scheduledPosts = await ScheduledPostService.getUserScheduledPosts(
			userId,
			limit
		);
		return scheduledPosts;
	},
};

const scheduledPostResolvers = {
	ScheduledPost: {
		scheduledBy: async (parent: any) => {
			const userId = parent.scheduledBy;
			if (!userId) return null;

			const user = await UserService.getUserById(userId);
			return user;
		},

		publishedPost: async (parent: any) => {
			if (!parent.publishedPostId) return null;

			try {
				const post = await PostService.getPostById(
					parent.publishedPostId
				);
				return post;
			} catch (error) {
				// Post might not exist anymore
				return null;
			}
		},

		status: (parent: any) => {
			// Convert database enum to GraphQL enum
			switch (parent.status) {
				case "pending":
					return "PENDING";
				case "published":
					return "PUBLISHED";
				case "failed":
					return "FAILED";
				case "cancelled":
					return "CANCELLED";
				default:
					return "PENDING";
			}
		},
	},
};

export const resolvers = {
	Upload: GraphQLUpload,
	Query: queries,
	Mutation: mutations,
	...scheduledPostResolvers,
};
