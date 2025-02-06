import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { db, session } from "./middlewares";
import authRoutes from "./routes/auth";

const app = new Hono().basePath("/api");

// Middlewares
app.use(csrf());
app.use(db);
app.use(session);

// Routes
app.route("/v1/auth", authRoutes);

export default app;
