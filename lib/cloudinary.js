import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SCERET,
});

const uploadOnCloudinary = async (localFilePath) => {
	try {
		if (!localFilePath) return null;
		const response = await cloudinary.uploader.upload(localFilePath, {
			resource_type: "auto",
			folder: "social_media",
		});
		console.log(
			"File has been  successfully uploaded to Cloudinary",
			response.url
		);
		fs.unlinkSync(localFilePath);
		return response;
	} catch (error) {
		console.log("Error while uploading file to Cloudinary", error);
		fs.unlinkSync(localFilePath);
		return null;
	}
};

const extractPublicIdFromUrl = (imageURL) => {
	try {
		const parts = imageURL.split("/").pop().split(".");
		// Ensure public ID format before returning
		if (parts.length === 2) {
			return parts[0];
		} else {
			throw new APIError(
				401,
				"Invalid URL format for extracting public ID"
			);
		}
	} catch (error) {
		throw new APIError(401, "Couldn't extract Public Id");
	}
};

const deleteFromCloudinary = async (publicId) => {
	try {
		await cloudinary.v2.uploader.destroy(publicId);
	} catch (error) {
		throw error;
	}
};

export { uploadOnCloudinary, extractPublicIdFromUrl, deleteFromCloudinary };
