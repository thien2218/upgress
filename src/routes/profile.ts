import { AuthEnv } from "@/context";
import { profilesTable } from "@/db";
import { auth, valibot } from "@/middlewares";
import { UpdateProfileSchema } from "@/schemas/profile";
import { Profile } from "@/types";
import { kvCacheWithTtl, kvGetWithTtl } from "@/utils/cache";
import { handleDbError } from "@/utils/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

const profileRoutes = new Hono<AuthEnv>();
const profileColumns = {
	firstName: profilesTable.firstName,
	lastName: profilesTable.lastName,
	profileImage: profilesTable.profileImage,
	bio: profilesTable.bio,
	joinedSince: profilesTable.joinedSince,
};

profileRoutes.use(auth);

profileRoutes.get("/me", async (c) => {
	const user = c.get("user");
	const db = c.get("db");
	const kv = c.env.KV_CACHE;

	let profile: Profile = await kvGetWithTtl(
		"profile",
		kv,
		`profile/${user.id}`
	);

	if (!profile) {
		const records = await db
			.select(profileColumns)
			.from(profilesTable)
			.where(eq(profilesTable.userId, user.id))
			.catch(handleDbError);

		if (!records.length) {
			return c.text("User has not completed their onboarding process", 403);
		}

		profile = records[0];
		kvCacheWithTtl("profile", kv, `profile/${user.id}`, profile);
	} else {
		profile.joinedSince = new Date(profile.joinedSince);
	}

	return c.json({ ...user, ...profile });
});

profileRoutes.patch("/", valibot("json", UpdateProfileSchema), async (c) => {
	const { id } = c.get("user");
	const payload = c.req.valid("json");
	const db = c.get("db");

	const records = await db
		.update(profilesTable)
		.set(payload)
		.where(eq(profilesTable.userId, id))
		.returning(profileColumns)
		.catch(handleDbError);

	if (!records.length) {
		return c.text("No profile found for this user", 404);
	}

	kvCacheWithTtl("profile", c.env.KV_CACHE, `profile/${id}`, records[0]);
	return c.text("Profile updated successfully");
});

export default profileRoutes;
