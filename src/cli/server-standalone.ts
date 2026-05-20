import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createGitHubProvider } from "../providers/github";

/**
 * @file server-standalone.ts
 * @description Standalone server for local development (non-Cloudflare platforms)
 * @used-by CLI: bun run src/cli/server-standalone.ts
 */

const app = new Hono();

app.get("/api/status", (c) => {
  return c.json({
    status: "ok",
    version: "0.0.2",
    timestamp: Date.now(),
  });
});

app.post("/api/labels/add", async (c) => {
  const body = await c.req.json();
  const { target, labels } = body;

  if (!target || !labels) {
    return c.json({ error: "Missing target or labels" }, 400);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return c.json({ error: "GITHUB_TOKEN not configured" }, 500);
  }

  try {
    const provider = createGitHubProvider("actions", { token });
    await provider.authenticate();
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

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return c.json({ error: "GITHUB_TOKEN not configured" }, 500);
  }

  try {
    const provider = createGitHubProvider("actions", { token });
    await provider.authenticate();
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

  const labels: string[] = [];
  const normalizedTitle = (title || "").toLowerCase();
  const normalizedBody = (content || "").toLowerCase();

  if (normalizedTitle.includes("bug") || normalizedBody.includes("bug")) {
    labels.push("bug");
  } else if (normalizedTitle.includes("feat") || normalizedBody.includes("feature")) {
    labels.push("enhancement");
  } else if (normalizedTitle.includes("fix")) {
    labels.push("bug");
  } else if (normalizedTitle.includes("doc") || normalizedTitle.includes("readme")) {
    labels.push("documentation");
  } else if (normalizedTitle.includes("test")) {
    labels.push("test");
  } else if (normalizedTitle.includes("refactor")) {
    labels.push("refactoring");
  }

  if (labels.length === 0) {
    labels.push("task");
  }

  return c.json({ labels, confidence: 0.85 });
});

app.get("/", () => new Response("labelit.ai - AI-powered issue labeling"));

const port = parseInt(process.env.PORT || "8787", 10);

console.log(`Starting labelit.ai server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);
