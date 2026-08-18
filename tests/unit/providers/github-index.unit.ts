import { describe, expect, it } from "vitest";
import { createGitHubProviderFromEnv } from "../../../src/providers/github";
import type { Env } from "../../../src/types/env";

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

describe("createGitHubProviderFromEnv", () => {
  it("should return undefined when no GitHub credentials are bound", () => {
    expect(createGitHubProviderFromEnv(baseEnv())).toBeUndefined();
  });

  it("should return an actions provider when only a token is bound", () => {
    const provider = createGitHubProviderFromEnv(baseEnv({ GITHUB_TOKEN: "abc" }));
    expect(provider).toBeDefined();
    expect(provider!.type).toBe("actions");
  });

  it("should prefer GitHub App credentials over a token", () => {
    const provider = createGitHubProviderFromEnv(
      baseEnv({
        GITHUB_TOKEN: "abc",
        GITHUB_APP_ID: "123",
        GITHUB_APP_PRIVATE_KEY: "key",
        GITHUB_APP_INSTALLATION_ID: "456",
      }),
    );
    expect(provider).toBeDefined();
    expect(provider!.type).toBe("app");
  });

  it("should return an injected provider binding as-is", () => {
    const injected = { type: "actions" as const, authenticate: async () => {} };
    const provider = createGitHubProviderFromEnv(
      baseEnv({ GITHUB_PROVIDER: injected as Env["GITHUB_PROVIDER"] }),
    );
    expect(provider).toBe(injected);
  });

  it("should not construct an app provider when credentials are partial", () => {
    expect(
      createGitHubProviderFromEnv(baseEnv({ GITHUB_APP_ID: "123", GITHUB_APP_PRIVATE_KEY: "key" })),
    ).toBeUndefined();
  });
});
