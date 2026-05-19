import type { ProviderType } from "../../types/basic";
import type { GitHubProvider, ProviderConfig } from "./types";
import { GitHubActionsProvider } from "./actions";
import { GitHubAppProvider } from "./app";

export { GitHubActionsProvider } from "./actions";
export { GitHubAppProvider } from "./app";
export type { GitHubProvider, ProviderConfig };

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