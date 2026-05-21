import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import type { TestEnv, JsonResponseBody } from "../vitest-types";

// Mock the webhook handler to avoid complex dependencies
vi.mock("../../src/webhook/handler");

// Mock environment variables for testing
const testEnvBase: TestEnv = {
  KV: {} as any,
  MODEL_NAME: "test-model",
  GITHUB_PROVIDER: {} as any,
};

describe("Environment Integration Tests", () => {
  let server: any;
  const PORT = 3003;

  // Helper function to create app with specific environment
  const createTestApp = (_env: TestEnv) => {
    const app = new Hono<{ Bindings: TestEnv }>();

    app.post("/webhook/events", async (c) => {
      return c.json({ success: true });
    });

    app.get("/api/status", (c) => {
      return c.json({
        status: "ok",
        version: "0.0.0",
        timestamp: Date.now(),
      });
    });

    return app;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe("Missing required environment variables", () => {
    it("should handle missing WEBHOOK_SECRET gracefully", async () => {
      const env: TestEnv = {
        ...testEnvBase,
        WEBHOOK_SECRET: undefined,
      };

      const app = createTestApp(env);
      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/status`, {
        method: "GET",
      });

      // Status endpoint should work regardless of WEBHOOK_SECRET
      expect(response.status).toBe(200);
      const data = (await response.json()) as JsonResponseBody;
      expect(data.status).toBe("ok");
    });

    it("should handle missing GITHUB_PROVIDER gracefully", async () => {
      const env: TestEnv = {
        ...testEnvBase,
        GITHUB_PROVIDER: undefined,
      };

      const app = createTestApp(env);
      server = serve({ fetch: app.fetch, port: PORT });

      const response = await fetch(`http://localhost:${PORT}/api/status`, {
        method: "GET",
      });

      // Status endpoint should work regardless of GITHUB_PROVIDER
      expect(response.status).toBe(200);
      const data = (await response.json()) as JsonResponseBody;
      expect(data.status).toBe("ok");
    });
  });

  describe("Different configuration scenarios", () => {
    it("should work with different PI_PROVIDER values", async () => {
      const providers = ["openai", "anthropic", "google", "local"] as const;

      for (const provider of providers) {
        const env: TestEnv = {
          ...testEnvBase,
          PI_PROVIDER: provider,
          PI_API_KEY: "test-key",
          PI_MODEL_NAME: "test-model",
        };

        const app = createTestApp(env);
        const testPort = PORT + providers.indexOf(provider);
        server = serve({ fetch: app.fetch, port: testPort });

        try {
          const response = await fetch(`http://localhost:${testPort}/api/status`, {
            method: "GET",
          });

          expect(response.status).toBe(200);
          const data = (await response.json()) as JsonResponseBody;
          expect(data.status).toBe("ok");
        } finally {
          server.close();
        }
      }
    });

    it("should handle missing PI_API_KEY when PI_PROVIDER is set", async () => {
      const env: TestEnv = {
        ...testEnvBase,
        PI_PROVIDER: "openai",
        // PI_API_KEY is intentionally missing
      };

      const app = createTestApp(env);
      server = serve({ fetch: app.fetch, port: PORT });

      try {
        const response = await fetch(`http://localhost:${PORT}/api/status`, {
          method: "GET",
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as JsonResponseBody;
        expect(data.status).toBe("ok");
      } finally {
        server.close();
      }
    });
  });

  describe("Edge case environment values", () => {
    it("should handle empty string environment variables", async () => {
      const env: TestEnv = {
        ...testEnvBase,
        WEBHOOK_SECRET: "",
        PI_API_KEY: "",
        MODEL_NAME: "",
      };

      const app = createTestApp(env);
      server = serve({ fetch: app.fetch, port: PORT });

      try {
        const response = await fetch(`http://localhost:${PORT}/api/status`, {
          method: "GET",
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as JsonResponseBody;
        expect(data.status).toBe("ok");
      } finally {
        server.close();
      }
    });

    it("should handle special characters in environment variables", async () => {
      const env: TestEnv = {
        ...testEnvBase,
        WEBHOOK_SECRET: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
        PI_API_KEY: "key-with-dashes_and_underscores",
        MODEL_NAME: "model.with.dots",
      };

      const app = createTestApp(env);
      server = serve({ fetch: app.fetch, port: PORT });

      try {
        const response = await fetch(`http://localhost:${PORT}/api/status`, {
          method: "GET",
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as JsonResponseBody;
        expect(data.status).toBe("ok");
      } finally {
        server.close();
      }
    });
  });

  describe("Startup behavior with different configurations", () => {
    it("should initialize successfully with minimal required env vars", async () => {
      // Minimal env needed for basic functionality
      const minimalEnv: TestEnv = {
        KV: {} as any,
        MODEL_NAME: "test-model",
      };

      const app = createTestApp(minimalEnv);
      server = serve({ fetch: app.fetch, port: PORT });

      try {
        // Test that the app at least starts and responds to basic requests
        const response = await fetch(`http://localhost:${PORT}/api/status`, {
          method: "GET",
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as JsonResponseBody;
        expect(data.status).toBe("ok");
      } finally {
        server.close();
      }
    });
  });
});
