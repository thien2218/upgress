import { HTTPException } from "hono/http-exception";

export const kvGetWithTtl = async (
	type: "session" | "profile" | "resource",
	kv: KVNamespace,
	key: string
) => {
	const edgeTtlMap = {
		session: 60 * 60 * 24 * 7, // 7 days
		resource: 60 * 60 * 24, // 1 day
		profile: 60 * 60, // 1 hour
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

	const value = await kv.get(key, { cacheTtl: edgeTtlMap[type] });
	if (!value) return value;
	return JSON.parse(value);
};

export const kvCacheWithTtl = async (
	type: "session" | "profile" | "resource",
	kv: KVNamespace,
	key: string,
	value: any
) => {
	const ttlMap = {
		session: 60 * 60 * 24 * 30, // 1 month
		resource: 60 * 60 * 24 * 15, // 15 days
		profile: 60 * 60 * 24, // 1 day
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
		expirationTtl: ttlMap[type],
	});
};
