import express from "express";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
import createApolloGraphqlServer from "./graphql";
import db from "./db";

async function main() {
	try {
		const app = express();
		const PORT = Number(process.env.PORT) || 4000;

		app.get("/", (req, res) => {
			res.json({ message: "Server is up and running" });
		});

		const gqlServer = await createApolloGraphqlServer();

		app.use(
			"/graphql",
			bodyParser.json(),
			// @ts-ignore
			expressMiddleware(gqlServer, {
				context: async ({ req }) => {
					return { headers: req.headers };
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
