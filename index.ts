import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import createApolloGraphqlServer from "./graphql";
import db from "./db";
import UserService from "./services/users";
import { graphqlUploadExpress } from "graphql-upload-minimal";

async function main() {
	try {
		const app = express();
		const PORT = Number(process.env.PORT) || 4000;

		app.use(
			cors({
				origin: true,
				credentials: true,
			})
		);
		app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
		app.use(express.json());
		app.use((req, res, next) => {
			if (!req.body) {
				req.body = {}; // Prevent Apollo from failing on undefined/null req.body
			}
			next();
		});

		app.get("/", (req, res) => {
			res.json({ message: "Server is up and running" });
		});

		const gqlServer = await createApolloGraphqlServer();

		app.use(
			"/graphql",
			// @ts-ignore
			expressMiddleware(gqlServer, {
				context: async ({ req }) => {
					// @ts-ignore
					const token = req
						.header("Authorization")
						?.replace("Bearer ", "");

					try {
						const user = UserService.decodeJWTToken(
							token as string
						);
						return { user };
					} catch (error) {
						return {};
					}
				},
			})
		);

		await db.execute(`SELECT 1`);
		console.log("✅ Connected to the database");

		app.listen(PORT, () =>
			console.log(`✅ Server started at http://localhost:${PORT}`)
		);
	} catch (error) {
		console.error("Error starting the server:", error);
		process.exit(1);
	}
}

main();
