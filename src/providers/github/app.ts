import type {
  ProviderConfig,
  GitHubProvider,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepository,
} from "./types";
import type { Issue, PullRequest, Repository, ListOptions } from "../../types/basic";

const GITHUB_API = "https://api.github.com";

interface JWTPayload {
  iss: string;
  iat: number;
  exp: number;
}

export class GitHubAppProvider implements GitHubProvider {
  type = "app" as const;
  private appID: string;
  private privateKey: string;
  private installationID: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl = GITHUB_API;

  constructor(config: ProviderConfig) {
    this.appID = config.appID || process.env.GITHUB_APP_ID || "";
    this.privateKey = config.privateKey || process.env.GITHUB_APP_PRIVATE_KEY || "";
    this.installationID = config.installationID || process.env.GITHUB_APP_INSTALLATION_ID || "";

    if (!this.appID || !this.privateKey || !this.installationID) {
      throw new Error("GitHub App requires appID, privateKey, and installationID");
    }
  }

  private base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64.replace(/-----.*?-----/g, "").replace(/\s/g, ""), "base64");
  }

  private createJWT(): string {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const now = Math.floor(Date.now() / 1000);
    const payload: JWTPayload = {
      iss: this.appID,
      iat: now,
      exp: now + 600,
    };
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString("base64");

    const crypto = require("crypto");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${payloadEncoded}`);
    const signature = sign.sign(this.privateKey, "base64");

    return `${header}.${payloadEncoded}.${signature}`;
  }

  private async getInstallationToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const jwt = this.createJWT();
    const response = await fetch(
      `${this.baseUrl}/app/installations/${this.installationID}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get installation token: ${response.status}`);
    }

    const data = (await response.json()) as { token: string; expires_at: string };
    this.token = data.token;
    this.tokenExpiry = Date.now() + new Date(data.expires_at).getTime() - Date.now() - 60000;

    return this.token!;
  }

  async authenticate(): Promise<void> {
    await this.getInstallationToken();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getInstallationToken();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getIssues(options: ListOptions): Promise<Issue[]> {
    const { owner, repo, state = "open", per_page = 30, page = 1 } = options;
    const data = await this.request<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}&page=${page}`,
    );

    return data.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || "",
      labels: issue.labels.map((l) => l.name),
      state: issue.state,
    }));
  }

  async getPullRequests(options: ListOptions): Promise<PullRequest[]> {
    const { owner, repo, state = "open", per_page = 30, page = 1 } = options;
    const data = await this.request<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&per_page=${per_page}&page=${page}`,
    );

    return data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || "",
      labels: pr.labels.map((l) => l.name),
      state: pr.state,
    }));
  }

  async addLabels(target: string, labels: string[]): Promise<void> {
    const [owner, repo, , number] = target.split("/");
    await this.request(`/repos/${owner}/${repo}/issues/${number}/labels`, {
      method: "POST",
      body: JSON.stringify({ labels }),
    });
  }

  async removeLabels(target: string, labels: string[]): Promise<void> {
    const [owner, repo, , number] = target.split("/");
    for (const label of labels) {
      await this.request(
        `/repos/${owner}/${repo}/issues/${number}/labels/${encodeURIComponent(label)}`,
        {
          method: "DELETE",
        },
      );
    }
  }

  async getRepository(options: { owner: string; repo: string }): Promise<Repository> {
    const data = await this.request<GitHubRepository>(`/repos/${options.owner}/${options.repo}`);
    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description || "",
    };
  }
}
