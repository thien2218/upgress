import { HTTPException } from "hono/http-exception";

type SQLError = { fields?: string[]; code: string };

export const handleDbError = ({ message }: { message: string }) => {
	console.log(message);

	if (message.includes("SQLITE_CONSTRAINT")) {
		const chunks = message.split(": ");
		const msg = chunks[1];
		const error: SQLError = { code: chunks[chunks.length - 1] };

		if (message.includes("UNIQUE")) {
			const fields = message
				.split(": ")[2]
				.split(", ")
				.map((f) => f);

			error.fields = fields;
		}

		throw new HTTPException(400, {
			res: new Response(
				JSON.stringify({
					state: "error",
					message: msg,
					error,
				}),
				{ headers: { "Content-Type": "application/json" } }
			),
		});
	}

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
