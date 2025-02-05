import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { db, session } from "./middlewares";

const app = new Hono();

// Middlewares
app.use(csrf());
app.use(db);
app.use(session);

// Routes
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
