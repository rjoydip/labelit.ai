# Providers

GitHub providers for interacting with GitHub API to manage issues and pull requests.

## Overview

Providers handle authentication and API communication with GitHub. They expose a unified interface for listing issues, managing labels, and retrieving repository information.

## Supported Providers

| Provider           | Description                   | Authentication           |
| ------------------ | ----------------------------- | ------------------------ |
| **GitHub Actions** | For workflow-based automation | `GITHUB_TOKEN`           |
| **GitHub App**     | For multi-repository access   | JWT + Installation token |

## Provider Interface

All providers implement the `GitHubProvider` interface:

```typescript
interface GitHubProvider {
  type: "actions" | "app";
  authenticate(): Promise<void>;
  getIssues(options: ListOptions): Promise<Issue[]>;
  getPullRequests(options: ListOptions): Promise<PullRequest[]>;
  addLabels(target: string, labels: string[]): Promise<void>;
  removeLabels(target: string, labels: string[]): Promise<void>;
  getRepository(options: { owner: string; repo: string }): Promise<Repository>;
}
```

## Configuration

```typescript
interface ProviderConfig {
  token?: string;
  appID?: string;
  privateKey?: string;
  installationID?: string;
}
```

## GitHub Actions Provider

Uses a personal access token for authentication. Suitable for workflows running in GitHub Actions.

### Environment Variables

| Variable       | Required | Description                  |
| -------------- | -------- | ---------------------------- |
| `GITHUB_TOKEN` | Yes      | GitHub personal access token |

### Usage

```typescript
import { createGitHubProvider } from "./providers/github";

const provider = createGitHubProvider("actions", {
  token: process.env.GITHUB_TOKEN,
});

await provider.authenticate();
const issues = await provider.getIssues({ owner: "user", repo: "repo" });
```

### Features

- Simple token-based authentication
- Automatic request headers
- JSON response parsing
- Error handling with meaningful messages

## GitHub App Provider

Uses JWT authentication for app-level access. Suitable for multi-repository automation with granular permissions.

### Environment Variables

| Variable                     | Required | Description           |
| ---------------------------- | -------- | --------------------- |
| `GITHUB_APP_ID`              | Yes      | GitHub App ID         |
| `GITHUB_APP_PRIVATE_KEY`     | Yes      | App private key (PEM) |
| `GITHUB_APP_INSTALLATION_ID` | Yes      | Installation ID       |

### JWT Signing

The App provider uses Web Crypto API for JWT signing (compatible with Cloudflare Workers):

```typescript
private async createJWT(): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = {
    iss: this.appID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 600,
  };
  // Sign using crypto.subtle
}
```

### Token Caching

Installation tokens are cached with automatic refresh before expiry:

```typescript
private async getInstallationToken(): Promise<string> {
  if (this.token && Date.now() < this.tokenExpiry) {
    return this.token;
  }
  // Fetch new token and cache it
}
```

### Usage

```typescript
import { createGitHubProvider } from "./providers/github";

const provider = createGitHubProvider("app", {
  appID: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  installationID: process.env.GITHUB_APP_INSTALLATION_ID,
});

await provider.authenticate();
const prs = await provider.getPullRequests({ owner: "user", repo: "repo" });
```

## Factory Function

Use `createGitHubProvider` to instantiate the appropriate provider:

```typescript
import { createGitHubProvider } from "./providers/github";

const provider = createGitHubProvider("actions", {
  token: process.env.GITHUB_TOKEN,
});
```

## Label Management

### Add Labels

```typescript
await provider.addLabels("owner/repo#123", ["bug", "priority:high"]);
```

Target format: `owner/repo#number`

### Remove Labels

```typescript
await provider.removeLabels("owner/repo#123", ["wontfix"]);
```

## Error Handling

All providers throw descriptive errors:

```typescript
try {
  await provider.authenticate();
} catch (error) {
  if (error.message.includes("required")) {
    console.error("Missing required configuration");
  }
}
```

## Type Definitions

```typescript
interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
}

interface PullRequest extends Issue {
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

interface Repository {
  name: string;
  full_name: string;
  description: string;
}

interface ListOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  per_page?: number;
  page?: number;
}
```
