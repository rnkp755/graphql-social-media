import { uploadOnCloudinary } from "../../lib/cloudinary";
import PostService from "../../services/posts";
import type { createPostPayload } from "../../services/posts";
import UserService from "../../services/users";
import fs, { createWriteStream, unlink } from "fs";
import path from "path";
import { getDirname } from "../../lib/path";
import { GraphQLUpload } from "graphql-upload-minimal";

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
				const { createReadStream, filename, mimetype } = await media;
				console.log("Received file:", filename, "Type:", mimetype); // Debug log

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
					const readStream = createReadStream();
					const writeStream = createWriteStream(tempPath);

					// Add stream event listeners for debugging
					readStream.on("error", (error: any) => {
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

					readStream.pipe(writeStream);
				});

				console.log("File saved locally, uploading to Cloudinary..."); // Debug log

				// 5. Upload to Cloudinary
				mediaUrl = await uploadOnCloudinary(tempPath);
				console.log("Cloudinary upload result:", mediaUrl); // Debug log

				if (!mediaUrl) throw new Error("Cloudinary returned no URL");

				mediaType = mimetype;

				// 6. Clean up temp file
				await fs.promises.unlink(tempPath);
				console.log("Temp file cleaned up"); // Debug log
			} catch (error) {
				console.error("Full error details:", error); // Detailed error log
				throw new Error(
					`Failed to process media upload: ${error.message}`
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
};

const postResolvers = {
	Post: {
		postedBy: async (parent: any) => {
			// parent.postedBy is the user id in your posts table
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
