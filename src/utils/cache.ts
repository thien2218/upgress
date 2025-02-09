import { HTTPException } from "hono/http-exception";

export const kvCacheWithTtl = async (
	type: "session" | "profile" | "resource",
	kv: KVNamespace,
	key: string,
	value: any
) => {
	const defaultExpiration = 60 * 60; // 1 hour
	const expirations = {
		session: 60 * 60 * 24 * 7, // 7 days
		resource: 60 * 60 * 12, // 12 hours
	};

	if (!key.includes(type)) {
		throw new HTTPException(500, {
			res: new Response(
				JSON.stringify({
					state: "error",
					message: "Invalid caching key",
					error: { code: "KV_CACHE_ERROR" },
				}),
				{ headers: { "Content-Type": "application/json" } }
			),
		});
	}

	await kv.put(key, JSON.stringify(value), {
		// @ts-ignore
		expirationTtl: expirations[type] ?? defaultExpiration,
	});
};
