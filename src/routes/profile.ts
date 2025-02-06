import { AppEnv } from "@/context";
import { profilesTable } from "@/db";
import { auth } from "@/middlewares";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const profileRoutes = new Hono<AppEnv>();

profileRoutes.get("/me", auth, async (c) => {
	const user = c.get("user");
	const db = c.get("db");

	const records = await db
		.select({
			firstName: profilesTable.firstName,
			lastName: profilesTable.lastName,
			profileImage: profilesTable.profileImage,
			bio: profilesTable.bio,
		})
		.from(profilesTable)
		.where(eq(profilesTable.userId, user.id));

	if (!records.length) {
		return c.text("User has not completed their onboarding process", 403);
	}

	const profile = records[0];

	return c.json({ ...user, ...profile });
});

export default profileRoutes;
