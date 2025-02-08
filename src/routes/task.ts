import { AuthEnv } from "@/context";
import { milestonesTable, tasksTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { UpdateTaskSchema } from "@/schemas/task";
import { handleDbError } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

const taskRoutes = new Hono<AuthEnv>();

taskRoutes.use(auth);

taskRoutes.patch("/:id", valibot("json", UpdateTaskSchema), async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const payload = c.req.valid("json");
	const db = c.get("db");

	const rows = await db
		.update(tasksTable)
		.set(payload)
		.where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
		.returning({ milestoneId: tasksTable.milestoneId })
		.catch(handleDbError);

	if (!rows.length) {
		return c.text("No task found with specified id to update", 404);
	}

	const milestoneId = rows[0].milestoneId;

	await db
		.update(milestonesTable)
		.set({ updatedAt: new Date() })
		.where(eq(milestonesTable.id, milestoneId));

	return c.text("Task updated successfully");
});

taskRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const rows = await db
		.delete(tasksTable)
		.where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)))
		.returning({ updated: sql`true` })
		.catch(handleDbError);

	if (!rows.length) {
		return c.text("No task found with specified id to delete", 404);
	}

	return c.text("Task deleted successfully");
});

export default taskRoutes;
