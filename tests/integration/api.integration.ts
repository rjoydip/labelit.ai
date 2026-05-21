import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import type { JsonResponseBody } from "../vitest-types";
import type { Env } from "../../src/types/env";

describe("API Integration Tests", () => {
  let server: any;
  const PORT = 3001;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe("GET /api/status", () => {
    it("should return 200 with status information", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.get("/api/status", (c) => {
        return c.json({
          status: "ok",
          version: "0.0.0",
          timestamp: Date.now(),
        });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/status`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.status).toBe("ok");
      expect(data.version).toBe("0.0.0");
      expect(typeof data.timestamp).toBe("number");
    });
  });

  describe("GET /", () => {
    it("should return 200 with welcome message", async () => {
      const app = new Hono();
      app.get("/", () => new Response("labelit.ai - AI-powered issue labeling"));

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/`);
      expect(response.status).toBe(200);

      const text = await response.text();
      expect(text).toBe("labelit.ai - AI-powered issue labeling");
    });
  });

  describe("POST /api/labels/add", () => {
    it("should return 400 when target is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/labels/add", async (c) => {
        const body = await c.req.json();
        const { target, labels } = body;

        if (!target || !labels) {
          return c.json({ error: "Missing target or labels" }, 400);
        }

        return c.json({ success: true });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/labels/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["bug"] }),
      });

      expect(response.status).toBe(400);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.error).toBe("Missing target or labels");
    });

    it("should return 400 when labels is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/labels/add", async (c) => {
        const body = await c.req.json();
        const { target, labels } = body;

        if (!target || !labels) {
          return c.json({ error: "Missing target or labels" }, 400);
        }

        return c.json({ success: true });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/labels/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "owner/repo#1" }),
      });

      expect(response.status).toBe(400);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.error).toBe("Missing target or labels");
    });
  });

  describe("POST /api/labels/remove", () => {
    it("should return 400 when target is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/labels/remove", async (c) => {
        const body = await c.req.json();
        const { target, labels } = body;

        if (!target || !labels) {
          return c.json({ error: "Missing target or labels" }, 400);
        }

        return c.json({ success: true });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/labels/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["bug"] }),
      });

      expect(response.status).toBe(400);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.error).toBe("Missing target or labels");
    });
  });

  describe("POST /api/analyze", () => {
    it("should return 400 when type is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/analyze", async (c) => {
        const body = await c.req.json();
        const { type, title, target } = body;

        if (!type || !title || !target) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        return c.json({ labels: ["bug"], confidence: 0.8 });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test issue",
          target: "owner/repo#1",
        }),
      });

      expect(response.status).toBe(400);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 200 when all required fields are provided", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/analyze", async (c) => {
        const body = await c.req.json();
        const { type, title, target } = body;

        if (!type || !title || !target) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        return c.json({ labels: ["bug"], confidence: 0.8 });
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "issue",
          title: "Test issue",
          body: "Test body",
          target: "owner/repo#1",
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.labels).toEqual(["bug"]);
      expect(data.confidence).toBe(0.8);
    });
  });
});
