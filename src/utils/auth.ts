import { Session, SessionValidation } from "@/types";
import { eq } from "drizzle-orm";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { TiDBServerlessDatabase } from "drizzle-orm/tidb-serverless";
import { sessionsTable, usersTable } from "@/db";
import { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";

const EXPIRY = 1000 * 60 * 60 * 24 * 30; // 30 days
const REFRESH_THRESH = EXPIRY / 2;
const BASE_SESSION_OPTS = {
	httpOnly: true,
	sameSite: "lax",
	path: "/",
} as const;

export const SESSION_COOKIE_NAME = "upgress_session";

export async function createSession(
	db: TiDBServerlessDatabase,
	userId: string
): Promise<{ token: string; session: Session }> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);

	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);

	const session: Session & { userId: string } = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + EXPIRY),
	};

	await db.insert(sessionsTable).values(session);
	return { token, session };
}

export async function validateSessionToken(
	db: TiDBServerlessDatabase,
	token: string
): Promise<SessionValidation> {
	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);

	const result = await db
		.select({
			user: {
				id: usersTable.id,
				email: usersTable.email,
				username: usersTable.username,
				emailVerified: usersTable.emailVerified,
			},
			expiresAt: sessionsTable.expiresAt,
		})
		.from(sessionsTable)
		.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
		.where(eq(sessionsTable.id, sessionId));

	if (result.length === 0) {
		return { session: null, user: null };
	}

	let { user, expiresAt } = result[0];

	if (Date.now() >= expiresAt.getTime()) {
		await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
		return { session: null, user: null };
	}

	if (Date.now() >= expiresAt.getTime() - REFRESH_THRESH) {
		expiresAt = new Date(Date.now() + EXPIRY);
		await db
			.update(sessionsTable)
			.set({ expiresAt: expiresAt })
			.where(eq(sessionsTable.id, sessionId));
	}

	return { session: { id: sessionId, expiresAt }, user };
}

export async function invalidateSession(
	db: TiDBServerlessDatabase,
	sessionId: string
): Promise<void> {
	await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}

export function setSessionTokenCookie(
	c: Context<any>,
	token: string,
	expiresAt: Date
): void {
	if (c.env.ENVIRONMENT === "production") {
		// When deployed over HTTPS
		setCookie(c, SESSION_COOKIE_NAME, token, {
			...BASE_SESSION_OPTS,
			expires: expiresAt,
			secure: true,
		});
	} else {
		// When deployed over HTTP (localhost)
		setCookie(c, SESSION_COOKIE_NAME, token, {
			...BASE_SESSION_OPTS,
			expires: expiresAt,
		});
	}
}

export function deleteSessionTokenCookie(c: Context<any>): void {
	if (c.env.ENVIRONMENT === "production") {
		// When deployed over HTTPS
		deleteCookie(c, SESSION_COOKIE_NAME, {
			...BASE_SESSION_OPTS,
			secure: true,
		});
	} else {
		// When deployed over HTTP (localhost)
		deleteCookie(c, SESSION_COOKIE_NAME, BASE_SESSION_OPTS);
	}
}
