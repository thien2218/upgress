import { AppEnv } from "@/context";
import { getXataClient } from "@/db/xata";
import { Auth, Unauth } from "@/types";
import { SESSION_COOKIE_NAME, validateSessionToken } from "@/utils/auth";
import { Input, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import {
	GenericSchema,
	GenericSchemaAsync,
	InferOutput,
	safeParseAsync,
} from "valibot";
import { drizzle } from "drizzle-orm/xata-http";

export const JSON_RE =
	/^application\/([a-z-\.]+\+)?json(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;
export const MULTIPART_RE =
	/^multipart\/form-data(;\s?boundary=[a-zA-Z0-9'"()+_,\-./:=?]+)?$/;
export const URLENCODED_RE =
	/^application\/x-www-form-urlencoded(;\s*[a-zA-Z0-9\-]+\=([^;]+))*$/;

// Schema validation
type Targets = {
	json: any;
	query: Record<string, string | string[]>;
};

export const valibot =
	<
		Target extends keyof Targets,
		T extends GenericSchema | GenericSchemaAsync,
		I extends Input = { out: { [K in Target]: InferOutput<T> } }
	>(
		target: Target,
		schema: T
	): MiddlewareHandler<any, string, I> =>
	async (c, next) => {
		const contentType = c.req.header("Content-Type");
		let value: object = {};

		switch (target) {
			case "json":
				if (!contentType) break;

				if (JSON_RE.test(contentType)) {
					value = await c.req.json();
				} else if (
					MULTIPART_RE.test(contentType) ||
					URLENCODED_RE.test(contentType)
				) {
					value = await c.req.parseBody();
				}

				break;
			case "query":
				value = Object.fromEntries(
					Object.entries(c.req.queries()).map(([k, v]) => {
						return v.length === 1 ? [k, v[0]] : [k, v];
					})
				);
				break;
			default:
				throw new HTTPException(500, {
					res: new Response("Invalid target"),
				});
		}

		const result = await safeParseAsync(schema, value);

		if (!result.success) {
			const issue = result.issues[0];

			return c.json(
				{
					state: "error",
					message: issue.message,
					error: {
						target,
						field: issue.path?.[0].key ?? null,
						received: issue.input,
						expected: issue.expected,
					},
				},
				400
			);
		}

		c.req.addValidatedData(target, result.output as object);
		return next();
	};

// Database connection
export const db: MiddlewareHandler<AppEnv> = async (c, next) => {
	const xata = getXataClient({
		apiKey: c.env.XATA_API_KEY,
		branch: c.env.XATA_BRANCH,
	});

	const db = drizzle(xata);
	c.set("db", db);

	return next();
};

// Session extraction
export const session: MiddlewareHandler<AppEnv> = async (c, next) => {
	const token = getCookie(c, SESSION_COOKIE_NAME);

	if (!token) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	const { user, session } = await validateSessionToken(c.get("db"), token);
	c.set("user", user);
	c.set("session", session);

	return next();
};

// Marks routes to only allow authenticated users
interface AuthEnv extends AppEnv {
	Variables: Auth & AppEnv["Variables"];
}

export const auth: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const user = c.get("user");

	if (!user || !user.onboarded) {
		return c.text("User is not logged in", 401);
	}

	return next();
};

export const onboard: MiddlewareHandler<AuthEnv> = async (c, next) => {
	const user = c.get("user");

	if (!user) {
		return c.text("User is not logged in", 401);
	} else if (user.onboarded) {
		return c.text("User has already onboarded", 400);
	}

	return next();
};

// Marks routes to only allow unauthenticated users
interface UnauthEnv extends AppEnv {
	Variables: Unauth & AppEnv["Variables"];
}

export const unauth: MiddlewareHandler<UnauthEnv> = async (c, next) => {
	const user = c.get("user");

	if (user) {
		return c.text("User is already logged in", 400);
	}

	return next();
};
