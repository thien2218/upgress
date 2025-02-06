import { HTTPException } from "hono/http-exception";

export const handleDbError = ({ message }: { message: string }) => {
	console.log(message);

	throw new HTTPException(500, {
		res: new Response(
			JSON.stringify({
				state: "error",
				message,
				error: { code: "DB_ERROR" },
			}),
			{ headers: { "Content-Type": "application/json" } }
		),
	});
};
