import {
	Auth,
	Session,
	SessionValidation,
	StoredSessionData,
	User,
} from "@/types";
import { eq } from "drizzle-orm";
import {
	encodeBase32LowerCaseNoPadding,
	encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { sessionsTable, usersTable } from "@/db";
import { Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { handleDbError } from "./db";
import { XataHttpDatabase } from "drizzle-orm/xata-http";
import { kvGetWithTtl } from "./cache";

const EXPIRY = 1000 * 60 * 60 * 24 * 15; // 15 days
const REFRESH_THRESH = EXPIRY / 2;
const BASE_SESSION_OPTS = {
	httpOnly: true,
	sameSite: "lax",
	path: "/",
} as const;

export const SESSION_COOKIE_NAME = "upgress_session";

export async function createSession(
	db: XataHttpDatabase,
	kv: KVNamespace,
	user: User
): Promise<{ token: string; session: Session }> {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);

	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);
	const expiresAt = new Date(Date.now() + EXPIRY);

	const session: Session & { userId: string } = {
		id: sessionId,
		userId: user.id,
		expiresAt,
	};

	await kv.put(`session/${sessionId}`, JSON.stringify({ user, expiresAt }));
	await db.insert(sessionsTable).values(session).catch(handleDbError);

	return { token, session };
}

export async function validateSessionToken(
	db: XataHttpDatabase,
	kv: KVNamespace,
	token: string
): Promise<SessionValidation> {
	const sessionId = encodeHexLowerCase(
		sha256(new TextEncoder().encode(token))
	);

	let storedSession: StoredSessionData;
	let shouldWriteCache = false;
	const cached = await kvGetWithTtl("session", kv, `session/${sessionId}`);

	if (cached) {
		storedSession = JSON.parse(cached);
	} else {
		const records = await db
			.select({
				user: {
					id: usersTable.id,
					email: usersTable.email,
					emailVerified: usersTable.emailVerified,
					onboarded: usersTable.onboarded,
				},
				expiresAt: sessionsTable.expiresAt,
			})
			.from(sessionsTable)
			.innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
			.where(eq(sessionsTable.id, sessionId))
			.catch(handleDbError);

		if (records.length === 0) {
			return { session: null, user: null };
		}

		shouldWriteCache = true;
		storedSession = records[0];
	}

	let result: Auth = {
		session: { id: sessionId, expiresAt: storedSession.expiresAt },
		user: storedSession.user,
	};

	if (Date.now() >= result.session.expiresAt.getTime()) {
		invalidateSession(db, kv, sessionId);
		return { session: null, user: null };
	}

	if (Date.now() >= result.session.expiresAt.getTime() - REFRESH_THRESH) {
		result.session.expiresAt = new Date(Date.now() + EXPIRY);
		shouldWriteCache = true;
		await db
			.update(sessionsTable)
			.set({ expiresAt: result.session.expiresAt })
			.where(eq(sessionsTable.id, sessionId))
			.catch(handleDbError);
	}

	if (shouldWriteCache) {
		kv.put(`session/${sessionId}`, JSON.stringify(result));
	}

	return result;
}

export async function invalidateSession(
	db: XataHttpDatabase,
	kv: KVNamespace,
	sessionId: string
): Promise<void> {
	await kv.delete(`session/${sessionId}`);
	await db
		.delete(sessionsTable)
		.where(eq(sessionsTable.id, sessionId))
		.catch(handleDbError);
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
