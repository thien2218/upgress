import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: `.env.${process.env.NODE_ENV}` });

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DB_URL!,
	},
});
