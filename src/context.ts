import type { Env } from "hono";
import { SessionValidation } from "./types";
import { TiDBServerlessDatabase } from "drizzle-orm/tidb-serverless";

export interface AppEnv extends Env {
	Variables: SessionValidation & {
		db: TiDBServerlessDatabase;
	};
	Bindings: {
		// IMAGES_BUCKET: R2Bucket;
		// KV_PROFILES: KVNamespace;
		DB_URL: string;
		ENVIRONMENT: "development" | "production";
	};
}
