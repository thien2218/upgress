import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { db, session } from "./middlewares";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import taskRoutes from "./routes/task";
import resourceRoutes from "./routes/resource";
import milestoneRoutes from "./routes/milestone";
import roadmapRoutes from "./routes/roadmap";

const app = new Hono().basePath("/api");

// Middlewares
app.use(csrf({ origin: "http://localhost:8787" }));
app.use(db);
app.use(session);

// Routes
app.route("/v1/auth", authRoutes);
app.route("/v1/profile", profileRoutes);
app.route("/v1/resource", resourceRoutes);
app.route("/v1/task", taskRoutes);
app.route("/v1/milestone", milestoneRoutes);
app.route("/v1/roadmap", roadmapRoutes);

export default app;
