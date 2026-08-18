import type { ProviderType } from "../../types/basic";
import type { Env, GitHubProvider as EnvGitHubProvider } from "../../types/env";
import type { GitHubProvider, ProviderConfig } from "./types";
import { GitHubActionsProvider } from "./actions";
import { GitHubAppProvider } from "./app";

export { GitHubActionsProvider } from "./actions";
export { GitHubAppProvider } from "./app";
export type { GitHubProvider, ProviderConfig };

export type WorkerGitHubProvider = GitHubProvider & { type: "actions" | "app" };

export function createGitHubProvider(type: ProviderType, config: ProviderConfig): GitHubProvider {
  switch (type) {
    case "actions":
      return new GitHubActionsProvider(config);
    case "app":
      return new GitHubAppProvider(config);
    default:
      throw new Error(`Provider type '${type}' is not supported in Cloudflare Workers`);
  }
}

/**
 * Build a provider from Worker env bindings so the GitHub routes work in
 * production, where `GITHUB_PROVIDER` is not a serializable binding.
 *
 * Precedence: an injected provider, then GitHub App credentials, then token.
 */
export function createGitHubProviderFromEnv(env: Env): EnvGitHubProvider | undefined {
  if (env.GITHUB_PROVIDER) {
    return env.GITHUB_PROVIDER;
  }

  if (env.GITHUB_APP_ID && env.GITHUB_APP_PRIVATE_KEY && env.GITHUB_APP_INSTALLATION_ID) {
    return createGitHubProvider("app", {
      appID: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY,
      installationID: env.GITHUB_APP_INSTALLATION_ID,
    }) as WorkerGitHubProvider;
  }

  if (env.GITHUB_TOKEN) {
    return createGitHubProvider("actions", { token: env.GITHUB_TOKEN }) as WorkerGitHubProvider;
  }

  return undefined;
}
