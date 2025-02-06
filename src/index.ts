import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { db, session } from "./middlewares";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";

const app = new Hono().basePath("/api");

// Middlewares
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(db);
app.use(session);

// Routes
app.route("/v1/auth", authRoutes);
app.route("/v1/profile", profileRoutes);

export default app;
