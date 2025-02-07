import { AuthEnv } from "@/context";
import { resourcesTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { CreateResourceSchema, UpdateResourceSchema } from "@/schemas/resource";
import { handleDbError } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const resourceRoutes = new Hono<AuthEnv>();

resourceRoutes.use(auth);

resourceRoutes.post("/", valibot("json", CreateResourceSchema), async (c) => {
	const { id: userId } = c.get("user");
	const db = c.get("db");
	const payload = c.req.valid("json");
	const id = nanoid(25);

	await db
		.insert(resourcesTable)
		.values({ id, userId, ...payload })
		.catch(handleDbError);

	return c.text("New resource created successfully");
});

resourceRoutes.get("/", async (c) => {
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const records = await db
		.select({
			name: resourcesTable.name,
			type: resourcesTable.type,
			cost: resourcesTable.cost,
			link: resourcesTable.link,
			description: resourcesTable.description,
		})
		.from(resourcesTable)
		.where(eq(resourcesTable.userId, userId))
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No resources found", 404);
	}

	return c.json(records);
});

resourceRoutes.get("/:id", async (c) => {
	const { id: userId } = c.get("user");
	const id = c.req.param("id");
	const db = c.get("db");

	const records = await db
		.select({
			name: resourcesTable.name,
			type: resourcesTable.type,
			cost: resourcesTable.cost,
			link: resourcesTable.link,
			description: resourcesTable.description,
		})
		.from(resourcesTable)
		.where(and(eq(resourcesTable.userId, userId), eq(resourcesTable.id, id)))
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No resource found", 404);
	}

	return c.json(records[0]);
});

resourceRoutes.patch(
	"/:id",
	valibot("json", UpdateResourceSchema),
	async (c) => {
		const { id: userId } = c.get("user");
		const db = c.get("db");
		const payload = c.req.valid("json");
		const id = nanoid(25);

		const rows = await db
			.update(resourcesTable)
			.set(payload)
			.where(
				and(eq(resourcesTable.id, id), eq(resourcesTable.userId, userId))
			)
			.returning({ updated: sql<boolean>`true` })
			.catch(handleDbError);

		if (!rows.length) {
			return c.text("No resource found with specified id to update", 404);
		}

		return c.text("Resource successfully updated");
	}
);

resourceRoutes.delete("/:id", async (c) => {
	const { id: userId } = c.get("user");
	const db = c.get("db");
	const id = nanoid(25);

	const rows = await db
		.delete(resourcesTable)
		.where(and(eq(resourcesTable.id, id), eq(resourcesTable.userId, userId)))
		.returning({ updated: sql<boolean>`true` })
		.catch(handleDbError);

	if (!rows.length) {
		return c.text("No resource found with specified id to delete", 404);
	}

	return c.text("Resource successfully deleted");
});

export default resourceRoutes;
