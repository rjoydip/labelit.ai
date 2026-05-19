import type { ProviderType } from "../../types/basic";
import type { GitHubProvider, ProviderConfig } from "./types";
import { GitHubActionsProvider } from "./actions";
import { GitHubCLIProvider } from "./cli";
import { GitHubAppProvider } from "./app";

export { GitHubActionsProvider } from "./actions";
export { GitHubCLIProvider } from "./cli";
export { GitHubAppProvider } from "./app";
export type { GitHubProvider, ProviderConfig };

export type GitHubProviderType = "actions" | "cli" | "app";

export function createGitHubProvider(type: ProviderType, config: ProviderConfig): GitHubProvider {
  switch (type) {
    case "actions":
      return new GitHubActionsProvider(config);
    case "cli":
      return new GitHubCLIProvider(config);
    case "app":
      return new GitHubAppProvider(config);
  }
}
