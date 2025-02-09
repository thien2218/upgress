import { AuthEnv } from "@/context";
import { resourcesTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { CreateResourceSchema, UpdateResourceSchema } from "@/schemas/resource";
import { Resource } from "@/types";
import { kvCacheWithTtl, kvGetWithTtl } from "@/utils/cache";
import { handleDbError } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const resourceRoutes = new Hono<AuthEnv>();
const resourceColumns = {
	name: resourcesTable.name,
	type: resourcesTable.type,
	cost: resourcesTable.cost,
	link: resourcesTable.link,
	description: resourcesTable.description,
};

resourceRoutes.use(auth);

resourceRoutes.post("/", valibot("json", CreateResourceSchema), async (c) => {
	const id = nanoid(25);
	const { id: userId } = c.get("user");
	const payload = c.req.valid("json");
	const db = c.get("db");

	await db
		.insert(resourcesTable)
		.values({ id, userId, ...payload })
		.catch(handleDbError);

	kvCacheWithTtl("resource", c.env.KV_CACHE, `resource/${id}`, payload);
	return c.text("New resource created successfully");
});

resourceRoutes.get("/", async (c) => {
	const { id: userId } = c.get("user");
	const db = c.get("db");
	const kv = c.env.KV_CACHE;

	const cached = await kvGetWithTtl("resource", kv, `${userId}/resources`);
	let resources: Resource[];

	if (cached) {
		resources = JSON.parse(cached);
	} else {
		resources = await db
			.select(resourceColumns)
			.from(resourcesTable)
			.where(eq(resourcesTable.userId, userId))
			.catch(handleDbError);

		if (!resources.length) {
			return c.text("No resources found", 404);
		}

		kvCacheWithTtl("resource", kv, `${userId}/resource`, resources);
	}

	return c.json(resources);
});

resourceRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");
	const kv = c.env.KV_CACHE;

	const cached = await kvGetWithTtl("resource", kv, `resource/${id}`);
	let resource: Resource;

	if (cached) {
		resource = JSON.parse(cached);
	} else {
		const records = await db
			.select(resourceColumns)
			.from(resourcesTable)
			.where(
				and(eq(resourcesTable.userId, userId), eq(resourcesTable.id, id))
			)
			.catch(handleDbError);

		if (!records.length) {
			return c.text("No resource found", 404);
		}

		resource = records[0];
		kvCacheWithTtl("resource", kv, `resource/${id}`, resource);
	}

	return c.json(resource);
});

resourceRoutes.patch(
	"/:id",
	valibot("json", UpdateResourceSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: userId } = c.get("user");
		const payload = c.req.valid("json");
		const db = c.get("db");

		const records = await db
			.update(resourcesTable)
			.set(payload)
			.where(
				and(eq(resourcesTable.id, id), eq(resourcesTable.userId, userId))
			)
			.returning(resourceColumns)
			.catch(handleDbError);

		if (!records.length) {
			return c.text("No resource found with specified id to update", 404);
		}

		kvCacheWithTtl("resource", c.env.KV_CACHE, `resource/${id}`, records[0]);
		return c.text("Resource successfully updated");
	}
);

resourceRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");
	const kv = c.env.KV_CACHE;

	const records = await db
		.delete(resourcesTable)
		.where(and(eq(resourcesTable.id, id), eq(resourcesTable.userId, userId)))
		.returning({ updated: sql<boolean>`true` })
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No resource found with specified id to delete", 404);
	}

	kv.delete(`resource/${id}`);
	return c.text("Resource successfully deleted");
});

export default resourceRoutes;
