import { uploadOnCloudinary } from "../../lib/cloudinary";
import PostService from "../../services/posts";
import type { createPostPayload } from "../../services/posts";
import UserService from "../../services/users";
import fs from "fs";
import path from "path";

const mutations = {
	createPost: async (_: any, args: any, context: any) => {
		const userId = context?.user?.id;
		if (!userId) {
			throw new Error("Unauthorized");
		}

		let mediaUrl: any;
		let mediaType: string | null = null;

		if (args.media) {
			// args.media is a Promise
			const { createReadStream, filename, mimetype } = await args.media;

			// Create a temp path
			const tempPath = path.join(
				__dirname,
				`../../../tmp/${Date.now()}-${filename}`
			);

			// Pipe the file stream to local disk
			await new Promise<void>((resolve, reject) => {
				const writeStream = fs.createWriteStream(tempPath);
				createReadStream()
					.pipe(writeStream)
					.on("finish", resolve)
					.on("error", reject);
			});

			// Upload to Cloudinary
			mediaUrl = await uploadOnCloudinary(tempPath);

			if (!mediaUrl) {
				throw new Error("Failed to upload media");
			}

			console.log("Media uploaded to Cloudinary:", mediaUrl);

			mediaType = mimetype;

			// Optionally delete local file
			fs.unlink(tempPath, (err) => {
				if (err) console.error("Failed to delete temp file:", err);
			});
		}

		const payload: createPostPayload = {
			...args,
			userId,
			mediaUrl,
			mediatype: mediaType,
		};
		console.log("Creating post with payload:", payload);
		const post = await PostService.createPost(payload);
		return post;
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
	Query: queries,
	Mutation: mutations,
	...postResolvers,
};
