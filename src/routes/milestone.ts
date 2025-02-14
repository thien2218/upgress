import { AuthEnv } from "@/context";
import { milestonesTable, tasksTable, usersTable } from "@/db";
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
				timeSpent: tasksTable.timeSpent,
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

		const sq = db.$with("select_valid_milestone_id").as(
			db
				.select({ milestoneId: milestonesTable.id })
				.from(milestonesTable)
				.where(
					and(
						eq(milestonesTable.id, milestoneId),
						eq(milestonesTable.userId, userId)
					)
				)
		);

		const records = await db
			.with(sq)
			.insert(tasksTable)
			.values({
				id,
				milestoneId: sql`${sq.milestoneId}`,
				userId,
				...payload,
			})
			.returning({ value: sql`1` })
			.catch(handleDbError);

		if (!records.length) {
			return c.text(
				"No roadmap found from this user with the specified id",
				404
			);
		}

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

		const records = await db
			.update(milestonesTable)
			.set(payload)
			.where(
				and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))
			)
			.returning({ updated: sql`true` })
			.catch(handleDbError);

		if (!records.length) {
			return c.text("No resource found with specified id to update", 404);
		}

		return c.text("Milestone updated successfully");
	}
);

milestoneRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const records = await db
		.delete(milestonesTable)
		.where(
			and(eq(milestonesTable.id, id), eq(milestonesTable.userId, userId))
		)
		.returning({ updated: sql`true` })
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No resource found with specified id to update", 404);
	}

	return c.text("Milestone deleted successfully");
});

export default milestoneRoutes;
