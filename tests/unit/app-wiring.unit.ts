import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../../src/index";
import type { Env } from "../../src/types/env";

function baseEnv(overrides: Partial<Env> = {}): Env {
  return {
    KV: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
      list: async () => ({ keys: [] }),
    },
    ...overrides,
  } as Env;
}

describe("Main app GitHub provider wiring", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should use the injected GITHUB_PROVIDER binding for /api/labels/add", async () => {
    const addLabels = vi.fn().mockResolvedValue(undefined);
    const provider = {
      type: "actions" as const,
      authenticate: vi.fn(),
      addLabels,
      removeLabels: vi.fn(),
    };

    const request = new Request("http://localhost/api/labels/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "owner/repo#1", labels: ["type:bug"] }),
    });

    const response = await app.fetch(
      request,
      baseEnv({ GITHUB_PROVIDER: provider as unknown as Env["GITHUB_PROVIDER"] }),
    );
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(addLabels).toHaveBeenCalledWith("owner/repo#1", ["type:bug"]);
  });

  it("should build an actions provider from a token binding for /api/labels/remove", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      }),
    );

    const request = new Request("http://localhost/api/labels/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "owner/repo#1", labels: ["priority:low"] }),
    });

    const response = await app.fetch(request, baseEnv({ GITHUB_TOKEN: "test-token" }));
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 500 when no provider is configured", async () => {
    const request = new Request("http://localhost/api/labels/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: "owner/repo#1", labels: ["type:bug"] }),
    });

    const response = await app.fetch(request, baseEnv());
    const data = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(500);
    expect(data.error).toBe("Provider not configured");
  });
});
