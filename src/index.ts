import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { db, session } from "./middlewares";
import authRoutes from "./routes/auth";

const app = new Hono();

// Middlewares
app.use(csrf());
app.use(db);
app.use(session);

// Routes
app.route("/auth", authRoutes);

export default app;
