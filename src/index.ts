import { Hono } from "hono";
import type { Env } from "./types/env";
import { WebhookHandler } from "./webhook/handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook/events", async (c) => {
  const handler = new WebhookHandler(c.env);
  return handler.handle(c.req.raw);
});

app.get("/api/status", (c) => {
  return c.json({
    status: "ok",
    version: "0.0.0",
    timestamp: Date.now(),
  });
});

app.post("/api/labels/add", async (c) => {
  const body = await c.req.json();
  const { target, labels } = body;

  if (!target || !labels) {
    return c.json({ error: "Missing target or labels" }, 400);
  }

  const provider = c.env.GITHUB_PROVIDER;
  if (!provider) {
    return c.json({ error: "Provider not configured" }, 500);
  }

  try {
    await provider.addLabels(target, labels);
    return c.json({ success: true, target, labels });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/api/labels/remove", async (c) => {
  const body = await c.req.json();
  const { target, labels } = body;

  if (!target || !labels) {
    return c.json({ error: "Missing target or labels" }, 400);
  }

  const provider = c.env.GITHUB_PROVIDER;
  if (!provider) {
    return c.json({ error: "Provider not configured" }, 500);
  }

  try {
    await provider.removeLabels(target, labels);
    return c.json({ success: true, target, labels });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

app.post("/api/analyze", async (c) => {
  const body = await c.req.json();
  const { type, title, body: content, target } = body;

  if (!type || !title || !target) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const handler = new WebhookHandler(c.env);
  try {
    const result = await handler.analyze({ type, title, body: content, target });
    return c.json(result);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

app.get("/", () => new Response("labelit.ai - AI-powered issue labeling"));

export default app;
