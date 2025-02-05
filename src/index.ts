import { Hono } from "hono";
import { csrf } from "hono/csrf";

const app = new Hono();

// Middlewares
app.use(csrf());

// Routes
app.get("/", (c) => {
	return c.text("Hello Hono!");
});

export default app;
