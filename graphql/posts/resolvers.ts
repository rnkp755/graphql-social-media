import { uploadOnCloudinary } from "../../lib/cloudinary";
import PostService from "../../services/posts";
import type { createPostPayload } from "../../services/posts";
import UserService from "../../services/users";
import fs, { createWriteStream, unlink } from "fs";
import path from "path";
import { getDirname } from "../../lib/path";
import { GraphQLUpload } from "graphql-upload-minimal";
import { get } from "http";

const mutations = {
	createPost: async (_: any, { media, ...args }: any, context: any) => {
		const userId = context?.user?.id;
		if (!userId) throw new Error("Unauthorized");

		let mediaUrl: string | null = null;
		let mediaType: string | null = null;

		if (media) {
			try {
				console.log("Starting media processing...", media); // Debug log

				// 1. Get file stream and metadata
				const filePromise = await media;
				console.log("Received file promise:", filePromise); // Debug log
				console.log(
					"File promise properties:",
					Object.keys(filePromise)
				); // Debug log

				// Access the actual file from the promise-like object
				const file = filePromise.file;
				console.log("Actual file object:", file); // Debug log
				console.log("File object properties:", Object.keys(file)); // Debug log

				// Extract properties from the actual file object
				const { createReadStream, filename, mimetype } = file;
				console.log("File details:", { filename, mimetype }); // Debug log

				// Create the read stream
				const stream = createReadStream();
				console.log("Stream created:", stream); // Debug log

				// 2. Create temp directory path
				const currentDir = getDirname(import.meta.url);
				const tempDir = path.join(currentDir, "../../../tmp");
				const tempPath = path.join(
					tempDir,
					`${Date.now()}-${filename}`
				);
				console.log("Temp path:", tempPath); // Debug log

				// 3. Ensure directory exists
				await fs.promises.mkdir(tempDir, { recursive: true });
				console.log("Temp directory verified"); // Debug log

				// 4. Create write stream and pipe the file
				console.log("Starting file stream..."); // Debug log
				await new Promise((resolve, reject) => {
					const writeStream = createWriteStream(tempPath);

					// Add stream event listeners for debugging
					stream.on("error", (error: any) => {
						console.error("Read stream error:", error);
						reject(error);
					});

					writeStream.on("error", (error) => {
						console.error("Write stream error:", error);
						reject(error);
					});

					writeStream.on("finish", () => {
						console.log("File write completed");
						resolve(true);
					});

					stream.pipe(writeStream);
				});

				console.log("File saved locally, uploading to Cloudinary..."); // Debug log

				// 5. Upload to Cloudinary
				const uploadResult = await uploadOnCloudinary(tempPath);
				console.log("Cloudinary upload result:", uploadResult); // Debug log

				if (!uploadResult || !uploadResult.secure_url) {
					throw new Error("Cloudinary upload failed");
				}

				mediaUrl = uploadResult.secure_url;

				mediaType = uploadResult.resource_type;

				// 6. Clean up temp file
				// await fs.promises.unlink(tempPath);
				console.log("Temp file cleaned up"); // Debug log
			} catch (error) {
				console.error("Full error details:", error); // Detailed error log
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				throw new Error(
					`Failed to process media upload: ${errorMessage}`
				);
			}
		}

		const payload = {
			...args,
			userId,
			mediaUrl,
			mediatype: mediaType,
		};

		return PostService.createPost(payload);
	},
};

const queries = {
	getPostById: async (_: any, args: { id: string }) => {
		const res = await PostService.getPostById(args.id);
		return res ?? null;
	},
	getFeedPosts: async (_: any, args: { limit?: number }, context: any) => {
		if (!context?.user?.id) {
			throw new Error("Unauthorized");
		}
		const { limit } = args;
		const posts = await PostService.getFeedPosts(context.user.id, limit);
		return posts;
	},
	getUserPosts: async (_: any, args: { userId: string; limit?: number }) => {
		const { userId, limit } = args;
		if (!userId) {
			throw new Error("User ID is required");
		}
		const posts = await PostService.getPostsByUserId(userId, limit);
		return posts;
	},
};

const postResolvers = {
	Post: {
		postedBy: async (parent: any) => {
			// If we already have user data from the enhanced queries, use it
			if (parent.userName && parent.userAvatar) {
				return {
					id: parent.postedBy,
					name: parent.userName,
					avatar: parent.userAvatar,
				};
			}

			// Otherwise, fetch the user data
			const userId = parent.userId || parent.postedBy;
			if (!userId) return null;

			const user = await UserService.getUserById(userId);
			return user;
		},
	},
};

export const resolvers = {
	Upload: GraphQLUpload,
	Query: queries,
	Mutation: mutations,
	...postResolvers,
};
