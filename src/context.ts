import type { Env } from "hono";
import { SessionValidation } from "./types";
import { XataHttpDatabase } from "drizzle-orm/xata-http";

export interface AppEnv extends Env {
	Variables: SessionValidation & {
		db: XataHttpDatabase;
	};
	Bindings: {
		// IMAGES_BUCKET: R2Bucket;
		// KV_PROFILES: KVNamespace;
		DB_URL: string;
		ENVIRONMENT: "development" | "production";
		XATA_BRANCH: "development" | "main";
		XATA_API_KEY: string;
	};
}
