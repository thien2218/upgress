import { AuthEnv } from "@/context";
import { milestonesTable, tasksTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { UpdateMilestoneSchema } from "@/schemas/milestone";
import { CreateTaskSchema } from "@/schemas/task";
import { handleDbError } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const milestoneRoutes = new Hono<AuthEnv>();

milestoneRoutes.use(auth);

milestoneRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const records = await db
		.select({
			target: milestonesTable.target,
			deadline: milestonesTable.deadline,
			description: milestonesTable.description,
			task: {
				description: tasksTable.description,
				priority: tasksTable.priority,
				status: tasksTable.status,
				difficulty: tasksTable.difficulty,
				dueDate: tasksTable.dueDate,
			},
		})
		.from(milestonesTable)
		.innerJoin(tasksTable, eq(tasksTable.milestoneId, milestonesTable.id))
		.where(
			and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))
		)
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No milestone found with specified id", 404);
	}

	const { task, ...milestone } = records[0];

	return c.json({ ...milestone, tasks: records.map((record) => record.task) });
});

milestoneRoutes.post(
	"/:id/task",
	valibot("json", CreateTaskSchema),
	async (c) => {
		const id = nanoid(25);
		const { id: userId } = c.get("user");
		const milestoneId = c.req.param("id");
		const payload = c.req.valid("json");
		const db = c.get("db");

		await db
			.insert(tasksTable)
			.values({ id, milestoneId, userId, ...payload })
			.catch(handleDbError);

		return c.text("Task successfully added");
	}
);

milestoneRoutes.patch(
	"/:id",
	valibot("json", UpdateMilestoneSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: userId } = c.get("user");
		const payload = c.req.valid("json");
		const db = c.get("db");

		const rows = await db
			.update(milestonesTable)
			.set(payload)
			.where(
				and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))
			)
			.returning({ updated: sql`true` })
			.catch(handleDbError);

		if (!rows.length) {
			return c.text("No resource found with specified id to update", 404);
		}

		return c.text("Milestone updated successfully");
	}
);

milestoneRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const rows = await db
		.delete(milestonesTable)
		.where(
			and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))
		)
		.returning({ updated: sql`true` })
		.catch(handleDbError);

	if (!rows.length) {
		return c.text("No resource found with specified id to update", 404);
	}

	return c.text("Milestone deleted successfully");
});

export default milestoneRoutes;
