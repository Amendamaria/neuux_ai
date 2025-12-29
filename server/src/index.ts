import { Hono } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import errorHandler from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import { env } from "./config/env";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: env.CORS_ORIGIN }));
app.use("*", csrf());
app.use("*", prettyJSON());
app.use("*", secureHeaders());
app.use("*", timing());

app.get("/", (c) => {
  return c.text("NeuUX-AI Server is running");
});
app.get("/health", (c) => {
  return c.json({ status: "Running", timestamp: new Date().toLocaleString() });
});

app.route("/auth", authRoutes);

app.notFound((c) => c.text("404 Not Found", 404));
app.onError(errorHandler);

export type AppType = typeof app;

export default app;
