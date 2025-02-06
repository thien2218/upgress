import { AppEnv } from "@/context";
import { profilesTable, usersTable } from "@/db";
import { auth, onboard, unauth, valibot } from "@/middlewares";
import { LoginSchema, OnboardSchema, SignupSchema } from "@/schemas/auth";
import {
	createSession,
	deleteSessionTokenCookie,
	invalidateSession,
	setSessionTokenCookie,
} from "@/utils/auth";
import { handleDbError } from "@/utils/db";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const authRoutes = new Hono<AppEnv>();

authRoutes.post("/signup", unauth, valibot("json", SignupSchema), async (c) => {
	const { password, email } = c.req.valid("json");
	const encryptedPwd = await hash(password, 12);
	const userId = nanoid(25);
	const db = c.get("db");

	await db
		.insert(usersTable)
		.values({
			id: userId,
			email,
			encryptedPwd,
			emailVerified: false,
			onboarded: false,
		})
		.catch(handleDbError);

	const { session, token } = await createSession(db, userId);
	setSessionTokenCookie(c, token, session.expiresAt);

	return c.text("User signed up successfully", 201);
});

authRoutes.post("/login", unauth, valibot("json", LoginSchema), async (c) => {
	const { email, password } = c.req.valid("json");
	const db = c.get("db");

	const records = await db
		.select({ id: usersTable.id, encryptedPwd: usersTable.encryptedPwd })
		.from(usersTable)
		.where(eq(usersTable.email, email))
		.catch(handleDbError);

	if (!records.length) {
		return c.text("Incorrect email or password", 400);
	}

	const user = records[0];

	if (!user.encryptedPwd) {
		return c.text("Incorrect login method", 400);
	}
	if (!(await compare(password, user.encryptedPwd))) {
		return c.text("Incorrect email or password", 400);
	}

	const { session, token } = await createSession(db, user.id);
	setSessionTokenCookie(c, token, session.expiresAt);

	return c.text("User logged in successfully");
});

authRoutes.post("/logout", auth, async (c) => {
	const session = c.get("session");
	// Session invalidation removes the session from the database
	// No need to await it since it can be done in the background
	// or later by a cron job
	invalidateSession(c.get("db"), session.id);
	deleteSessionTokenCookie(c);
	return c.text("User successfully logged out");
});

authRoutes.post(
	"/onboard",
	onboard,
	valibot("json", OnboardSchema),
	async (c) => {
		const user = c.get("user");
		const payload = c.req.valid("json");
		const db = c.get("db");

		await db
			.insert(profilesTable)
			.values({ userId: user.id, ...payload })
			.catch(handleDbError);

		await db.update(usersTable).set({ onboarded: true }).catch(handleDbError);

		return c.text("User's profile created successfully", 201);
	}
);

export default authRoutes;
