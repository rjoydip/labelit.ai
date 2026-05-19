import type {
  ProviderConfig,
  GitHubProvider,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepository,
} from "./types";
import type { Issue, PullRequest, Repository, ListOptions } from "../../types/basic";

const GITHUB_API = "https://api.github.com";

export class GitHubActionsProvider implements GitHubProvider {
  type = "actions" as const;
  private token: string;
  private baseUrl = GITHUB_API;

  constructor(config: ProviderConfig) {
    this.token = config.token || process.env.GITHUB_TOKEN || "";
    if (!this.token) {
      throw new Error("GITHUB_TOKEN is required for Actions provider");
    }
  }

  async authenticate(): Promise<void> {
    if (!this.token) {
      throw new Error("GITHUB_TOKEN not set");
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
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
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
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
