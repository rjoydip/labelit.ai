import { exec } from "child_process";
import { promisify } from "util";
import type {
  ProviderConfig,
  GitHubProvider,
  GitHubIssue,
  GitHubPullRequest,
  GitHubRepository,
} from "./types";
import type { Issue, PullRequest, Repository, ListOptions } from "../../types/basic";

const execAsync = promisify(exec);

export class GitHubCLIProvider implements GitHubProvider {
  type = "cli" as const;
  private token: string;

  constructor(config: ProviderConfig) {
    this.token = config.token || process.env.GITHUB_TOKEN || "";
  }

  async authenticate(): Promise<void> {
    try {
      await execAsync("gh auth status");
    } catch {
      throw new Error("GitHub CLI not authenticated. Run 'gh auth login' first.");
    }
  }

  private async runGH(command: string): Promise<string> {
    const { stdout } = await execAsync(command, {
      env: { ...process.env, GH_TOKEN: this.token },
    });
    return stdout.trim();
  }

  async getIssues(options: ListOptions): Promise<Issue[]> {
    const { owner, repo, state = "open", per_page = 30 } = options;
    const output = await this.runGH(
      `gh issue list --repo ${owner}/${repo} --state ${state} --limit ${per_page} --json number,title,body,labels,state`,
    );
    const data = JSON.parse(output) as GitHubIssue[];

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
    const { owner, repo, state = "open", per_page = 30 } = options;
    const output = await this.runGH(
      `gh pr list --repo ${owner}/${repo} --state ${state} --limit ${per_page} --json number,title,body,labels,state`,
    );
    const data = JSON.parse(output) as GitHubPullRequest[];

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
    const labelArg = labels.map((l) => `"${l}"`).join(",");
    await this.runGH(`gh issue edit ${owner}/${repo}#${number} --add-label ${labelArg}`);
  }

  async removeLabels(target: string, labels: string[]): Promise<void> {
    const [owner, repo, , number] = target.split("/");
    const labelArg = labels.map((l) => `"${l}"`).join(",");
    await this.runGH(`gh issue edit ${owner}/${repo}#${number} --remove-label ${labelArg}`);
  }

  async getRepository(options: { owner: string; repo: string }): Promise<Repository> {
    const output = await this.runGH(
      `gh repo view ${options.owner}/${options.repo} --json name,fullName,description`,
    );
    const data = JSON.parse(output) as GitHubRepository;

    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description || "",
    };
  }
}
