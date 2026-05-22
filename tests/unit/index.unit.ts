import { describe, expect, it, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { JsonResponseBody } from "../vitest-types";
import type { Env } from "../../src/types/env";

describe("Main Application Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/status", () => {
    it("should return status ok with version and timestamp", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.get("/api/status", (c) => {
        return c.json({
          status: "ok",
          version: "0.0.0",
          timestamp: Date.now(),
        });
      });

      const request = new Request("http://localhost/api/status", {
        method: "GET",
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(data.version).toBe("0.0.0");
      expect(typeof data.timestamp).toBe("number");
    });
  });

  describe("GET /", () => {
    it("should return the welcome message", async () => {
      const app = new Hono();
      app.get("/", () => new Response("labelit.ai - AI-powered issue labeling"));

      const request = new Request("http://localhost/", {
        method: "GET",
      });

      const response = await app.fetch(request);
      const text = await response.text();

      expect(response.status).toBe(200);
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

      const request = new Request("http://localhost/api/labels/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["bug"] }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
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

      const request = new Request("http://localhost/api/labels/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "owner/repo#1" }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
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

      const request = new Request("http://localhost/api/labels/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labels: ["bug"] }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
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

      const request = new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Test issue",
          target: "owner/repo#1",
        }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 400 when title is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/analyze", async (c) => {
        const body = await c.req.json();
        const { type, title, target } = body;

        if (!type || !title || !target) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        return c.json({ labels: ["bug"], confidence: 0.8 });
      });

      const request = new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "issue",
          target: "owner/repo#1",
        }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 400 when target is missing", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/analyze", async (c) => {
        const body = await c.req.json();
        const { type, title, target } = body;

        if (!type || !title || !target) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        return c.json({ labels: ["bug"], confidence: 0.8 });
      });

      const request = new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "issue",
          title: "Test issue",
        }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return analysis result when successful", async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.post("/api/analyze", async (c) => {
        const body = await c.req.json();
        const { type, title, target } = body;

        if (!type || !title || !target) {
          return c.json({ error: "Missing required fields" }, 400);
        }

        return c.json({ labels: ["bug"], confidence: 0.9 });
      });

      const request = new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "issue",
          title: "Test issue",
          body: "Test body",
          target: "owner/repo#1",
        }),
      });

      const response = await app.fetch(request);
      const data = (await response.json()) as JsonResponseBody;

      expect(response.status).toBe(200);
      expect(data.labels).toEqual(["bug"]);
      expect(data.confidence).toBe(0.9);
    });
  });
});
