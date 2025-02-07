import { AuthEnv } from "@/context";
import { milestonesTable, roadmapsTable, roadmapToMilestone } from "@/db";
import { auth, valibot } from "@/middlewares";
import { CreateMilestoneSchema } from "@/schemas/milestone";
import { CreateRoadmapSchema, UpdateRoadmapSchema } from "@/schemas/roadmap";
import { handleDbError } from "@/utils/db";
import { and, eq, max, sql } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const roadmapRoutes = new Hono<AuthEnv>();

roadmapRoutes.use(auth);

roadmapRoutes.post(
	"/:id/milestone",
	valibot("json", CreateMilestoneSchema),
	async (c) => {
		const id = c.req.param("id");
		const { id: userId } = c.get("user");
		const milestoneId = nanoid(25);
		const payload = c.req.valid("json");
		const db = c.get("db");

		const sq = db.$with("select_max_order").as(
			db
				.select({ value: sql`${max(roadmapToMilestone.order)} + 1` })
				.from(roadmapToMilestone)
				.innerJoin(
					roadmapsTable,
					and(eq(roadmapsTable.id, id), eq(roadmapsTable.userId, userId))
				)
		);

		const records = await db
			.with(sq)
			.insert(roadmapToMilestone)
			.values({ roadmapId: id, milestoneId, order: sq.value })
			.returning({ order: sq.value })
			.catch(handleDbError);

		if (!records.length) {
			return c.text(
				"No roadmap found from this user with the specified id",
				404
			);
		}

		await db
			.insert(milestonesTable)
			.values({ id: milestoneId, userId, ...payload })
			.catch(handleDbError);

		return c.text("Milestone created successfully");
	}
);

roadmapRoutes.post("/", valibot("json", CreateRoadmapSchema), async (c) => {
	const id = nanoid(25);
	const { id: userId } = c.get("user");
	const payload = c.req.valid("json");
	const db = c.get("db");

	await db
		.insert(roadmapsTable)
		.values({ id, userId, ...payload })
		.catch(handleDbError);

	return c.text("Roadmap created successfully");
});

roadmapRoutes.get("/", async (c) => {
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const roadmaps = await db
		.select({
			name: roadmapsTable.name,
			budget: roadmapsTable.budget,
			commitment: roadmapsTable.commitment,
			goal: roadmapsTable.goal,
			prerequisite: roadmapsTable.prerequisite,
		})
		.from(roadmapsTable)
		.where(eq(roadmapsTable.userId, userId))
		.catch(handleDbError);

	if (!roadmaps.length) {
		return c.text("No roadmaps found from user", 404);
	}

	return c.json(roadmaps);
});

roadmapRoutes.get("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const records = await db
		.select({
			name: roadmapsTable.name,
			budget: roadmapsTable.budget,
			commitment: roadmapsTable.commitment,
			goal: roadmapsTable.goal,
			prerequisite: roadmapsTable.prerequisite,
			milestone: {
				id: milestonesTable.id,
				target: milestonesTable.target,
				deadline: milestonesTable.deadline,
			},
		})
		.from(roadmapsTable)
		.where(and(eq(roadmapsTable.userId, userId), eq(roadmapsTable.id, id)))
		.innerJoin(
			roadmapToMilestone,
			eq(roadmapsTable.id, roadmapToMilestone.roadmapId)
		)
		.innerJoin(
			milestonesTable,
			eq(milestonesTable.id, roadmapToMilestone.milestoneId)
		)
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No roadmaps found from user", 404);
	}

	const { milestone, ...roadmap } = records[0];
	const milestones = records.map((record) => record.milestone);

	return c.json({ ...roadmap, milestones });
});

roadmapRoutes.patch("/:id", valibot("json", UpdateRoadmapSchema), async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const payload = c.req.valid("json");
	const db = c.get("db");

	const rows = await db
		.update(roadmapsTable)
		.set(payload)
		.returning({ updated: sql`true` })
		.where(and(eq(roadmapsTable.id, id), eq(roadmapsTable.userId, userId)));

	if (!rows.length) {
		return c.text(
			"No roadmap found to update from this user with the specified id",
			404
		);
	}

	return c.text("Roadmap updated successfully");
});

roadmapRoutes.delete("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: userId } = c.get("user");
	const db = c.get("db");

	const rows = await db
		.delete(roadmapsTable)
		.returning({ updated: sql`true` })
		.where(and(eq(roadmapsTable.id, id), eq(roadmapsTable.userId, userId)));

	if (!rows.length) {
		return c.text(
			"No roadmap found to delete from this user with the specified id",
			404
		);
	}

	return c.text("Roadmap updated successfully");
});

export default roadmapRoutes;
