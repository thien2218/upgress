import { AppEnv } from "@/context";
import { usersTable } from "@/db";
import { auth, unauth, valibot } from "@/middlewares";
import { LoginSchema, SignupSchema } from "@/schemas/auth";
import {
	createSession,
	invalidateSession,
	setSessionTokenCookie,
} from "@/utils/auth";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { nanoid } from "nanoid";

const authRoutes = new Hono<AppEnv>();

// Signup a new user
authRoutes.post("/signup", unauth, valibot("json", SignupSchema), async (c) => {
	const { password, email } = c.req.valid("json");
	const encryptedPwd = await hash(password, 11);
	const userId = nanoid(25);
	const db = c.get("db");

	await db.insert(usersTable).values({
		id: userId,
		email,
		encryptedPwd,
		emailVerified: false,
	});

	const { session, token } = await createSession(db, userId);
	setSessionTokenCookie(c, token, session.expiresAt);

	return c.text("User signed up successfully", 201);
});

// Login a user
authRoutes.post("/login", unauth, valibot("json", LoginSchema), async (c) => {
	const { email, password } = c.req.valid("json");
	const db = c.get("db");

	const records = await db
		.select({ id: usersTable.id, encryptedPwd: usersTable.encryptedPwd })
		.from(usersTable)
		.where(eq(usersTable.email, email));

	if (!records.length) {
		return c.text("Incorrect email/username or password", 400);
	}

	const user = records[0];

	if (!user.encryptedPwd) {
		return c.text("Incorrect login method", 400);
	}
	if (!(await compare(password, user.encryptedPwd))) {
		return c.text("Incorrect email/username or password", 400);
	}

	const { session, token } = await createSession(db, user.id);
	setSessionTokenCookie(c, token, session.expiresAt);

	return c.text("User logged in successfully");
});

// Logout a user
authRoutes.post("/logout", auth, async (c) => {
	const session = c.get("session");
	// Session invalidation only removes the session from the database
	// so no need to await it since it can be done in the background
	// or later by a cron job
	invalidateSession(c.get("db"), session.id);
	return c.text("User successfully logged out");
});

// Get the current user's basic info
authRoutes.get("/me", auth, async (c) => {
	const user = c.get("user");

	return c.json(
		{
			state: "success",
			message: "User info fetched successfully",
			output: user,
		},
		200
	);
});

export default authRoutes;
