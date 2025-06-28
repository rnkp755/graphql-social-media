import UserService from "./users";
import { posts } from "../db/schema/posts";
import db from "../db";
import { eq } from "drizzle-orm";

export interface createPostPayload {
    description?: string;
    image?: string;
    userId: string;
}

class PostService {
    public static async createPost(payload: createPostPayload) {
        try {
            const { description, image, userId } = payload;
            if (!description && !image) {
                throw new Error("Description or image is required to create a post");
            }
            
            const insertedPosts = await db
                .insert(posts)
                .values({
                    description,
                    image,
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
}

export default PostService;