import { AuthEnv } from "@/context";
import { milestonesTable, tasksTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { UpdateMilestoneSchema } from "@/schemas/milestone";
import { CreateTaskSchema } from "@/schemas/task";
import { handleDbError } from "@/utils/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const milestoneRoutes = new Hono<AuthEnv>();

milestoneRoutes.use(auth);

milestoneRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
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
		.where(eq(milestonesTable.id, id))
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
		const milestoneId = c.req.param("id");
		const payload = c.req.valid("json");
		const db = c.get("db");

		await db
			.insert(tasksTable)
			.values({ id, milestoneId, ...payload })
			.catch(handleDbError);

		return c.text("Task successfully added");
	}
);

milestoneRoutes.patch(
	"/:id",
	valibot("json", UpdateMilestoneSchema),
	async (c) => {
		const id = c.req.param("id");
		const payload = c.req.valid("json");
		const db = c.get("db");

		await db
			.update(milestonesTable)
			.set(payload)
			.where(eq(milestonesTable.id, id))
			.catch(handleDbError);

		return c.text("Milestone updated successfully");
	}
);

milestoneRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const db = c.get("db");

	await db
		.delete(milestonesTable)
		.where(eq(milestonesTable.id, id))
		.catch(handleDbError);

	return c.text("Milestone deleted successfully");
});

export default milestoneRoutes;
