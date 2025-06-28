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
			let tempPath: string | null = null;
			try {
				console.log("Starting media processing...", media); // Debug log

				// 1. Get file stream and metadata
				const fileUpload = await media;
				console.log("Received file upload:", fileUpload); // Debug log

				// Check if fileUpload exists and has the expected structure
				if (!fileUpload) {
					throw new Error("No file data received");
				}

				console.log("File upload properties:", Object.keys(fileUpload)); // Debug log

				// Handle different possible structures
				let file;
				if (fileUpload.file) {
					// Structure: { file: { createReadStream, filename, mimetype } }
					file = fileUpload.file;
				} else if (fileUpload.createReadStream) {
					// Structure: { createReadStream, filename, mimetype }
					file = fileUpload;
				} else {
					throw new Error("Invalid file upload structure");
				}

				console.log("Actual file object:", file); // Debug log
				if (file) {
					console.log("File object properties:", Object.keys(file)); // Debug log
				}

				// Extract properties from the file object
				const { createReadStream, filename, mimetype } = file;
				console.log("File details:", { filename, mimetype }); // Debug log

				if (!createReadStream || !filename) {
					throw new Error(
						"Missing required file properties (createReadStream or filename)"
					);
				}

				// Create the read stream
				let stream;
				try {
					stream = createReadStream();
					console.log("Stream created:", stream); // Debug log
				} catch (streamError) {
					console.error("Error creating stream:", streamError);
					throw new Error("Failed to create file stream");
				}

				// 2. Create temp directory path
				const currentDir = getDirname(import.meta.url);
				const tempDir = path.join(currentDir, "../../../public/temp");
				tempPath = path.join(tempDir, `${Date.now()}-${filename}`);
				console.log("Temp path:", tempPath); // Debug log

				// 3. Ensure directory exists
				await fs.promises.mkdir(tempDir, { recursive: true });
				console.log("Temp directory verified"); // Debug log

				// 4. Create write stream and pipe the file
				console.log("Starting file stream..."); // Debug log
				if (!tempPath) {
					throw new Error("Temp path not defined");
				}

				await new Promise((resolve, reject) => {
					const writeStream = createWriteStream(tempPath!);

					// Set a timeout for the operation
					const timeout = setTimeout(() => {
						reject(new Error("File upload timeout"));
					}, 30000); // 30 seconds timeout

					// Add stream event listeners for debugging
					stream.on("error", (error: any) => {
						clearTimeout(timeout);
						console.error("Read stream error:", error);
						reject(error);
					});

					writeStream.on("error", (error) => {
						clearTimeout(timeout);
						console.error("Write stream error:", error);
						reject(error);
					});

					writeStream.on("finish", () => {
						clearTimeout(timeout);
						console.log("File write completed");
						resolve(true);
					});

					writeStream.on("close", () => {
						clearTimeout(timeout);
						console.log("Write stream closed");
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

				console.log("Media upload completed successfully"); // Debug log
			} catch (error) {
				console.error("Full error details:", error); // Detailed error log

				// Clean up temp file if it exists
				if (tempPath) {
					try {
						await fs.promises.unlink(tempPath);
						console.log("Temp file cleaned up after error");
					} catch (cleanupError) {
						console.error(
							"Failed to clean up temp file:",
							cleanupError
						);
					}
				}

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
