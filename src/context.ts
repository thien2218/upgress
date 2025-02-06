import type { Env } from "hono";
import { SessionValidation } from "./types";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

export interface AppEnv extends Env {
	Variables: SessionValidation & {
		db: NodePgDatabase;
	};
	Bindings: {
		// IMAGES_BUCKET: R2Bucket;
		// KV_PROFILES: KVNamespace;
		DB_URL: string;
		ENVIRONMENT: "development" | "production";
	};
}
