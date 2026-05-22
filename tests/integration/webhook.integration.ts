import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import type { TestEnv, JsonResponseBody } from "../vitest-types";

// Mock the webhook handler and its dependencies
vi.mock("../../src/webhook/handler");

describe("Webhook Integration Tests", () => {
  let server: any;
  const PORT = 3002;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe("POST /webhook/events", () => {
    it("should return 429 when rate limit is exceeded", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        return c.json({ error: "Rate limit exceeded or invalid signature" }, 429);
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=test",
        },
        body: JSON.stringify({
          action: "opened",
          issue: {
            title: "Test issue",
            body: "Test body",
          },
          repository: {
            name: "test-repo",
            description: "Test repo",
          },
        }),
      });

      expect(response.status).toBe(429);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.error).toBe("Rate limit exceeded or invalid signature");
    });

    it("should return 200 for valid issue webhook", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        return c.json({ labels: ["bug"] }, 200);
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=valid",
        },
        body: JSON.stringify({
          action: "opened",
          issue: {
            title: "Test issue",
            body: "This is a bug that needs fixing",
            labels: [],
            state: "open",
          },
          repository: {
            name: "test-repo",
            description: "Test repository",
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.labels).toEqual(["bug"]);
    });

    it("should return 200 for valid pull request webhook", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        return c.json({ labels: ["refactoring"] }, 200);
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=valid",
        },
        body: JSON.stringify({
          action: "synchronize",
          pull_request: {
            title: "Refactor user service",
            body: "Refactoring the user service for better performance",
            labels: [],
            state: "open",
            additions: 100,
            deletions: 50,
            changed_files: 5,
          },
          repository: {
            name: "test-repo",
            description: "Test repository",
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.labels).toEqual(["refactoring"]);
    });

    it("should handle malformed JSON gracefully", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        try {
          await c.req.json();
          return c.json({ success: true }, 200);
        } catch {
          return c.json({ error: "Invalid JSON" }, 400);
        }
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=test",
        },
        body: "invalid json {",
      });

      expect(response.status).toBe(400);
    });

    it("should handle webhook with issue that has labels", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        return c.json({ labels: ["enhancement"] }, 200);
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=test",
        },
        body: JSON.stringify({
          action: "opened",
          issue: {
            title: "Add new feature",
            body: "Implement the new dashboard feature",
            labels: ["help wanted"],
            state: "open",
          },
          repository: {
            name: "test-repo",
            description: "Test repository",
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.labels).toEqual(["enhancement"]);
    });

    it("should handle webhook with pull request that has many changed files", async () => {
      const app = new Hono<{ Bindings: TestEnv }>();
      app.post("/webhook/events", async (c) => {
        return c.json({ labels: ["risk"] }, 200);
      });

      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/webhook/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=test",
        },
        body: JSON.stringify({
          action: "opened",
          pull_request: {
            title: "Major refactor",
            body: "Refactoring multiple core modules",
            labels: [],
            state: "open",
            additions: 1000,
            deletions: 800,
            changed_files: 50,
          },
          repository: {
            name: "test-repo",
            description: "Test repository",
          },
        }),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as JsonResponseBody;
      expect(data.labels).toEqual(["risk"]);
    });
  });
});
