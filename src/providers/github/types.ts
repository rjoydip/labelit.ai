import type {
  ProviderType,
  ListOptions,
  Issue,
  PullRequest,
  Repository,
  LabelDefinition,
} from "../../types/basic";

export interface ProviderConfig {
  token?: string;
  appID?: string;
  privateKey?: string;
  installationID?: string;
}

export interface GitHubProvider {
  type: ProviderType;
  authenticate(): Promise<void>;
  getIssues(options: ListOptions): Promise<Issue[]>;
  getPullRequests(options: ListOptions): Promise<PullRequest[]>;
  addLabels(target: string, labels: string[]): Promise<void>;
  removeLabels(target: string, labels: string[]): Promise<void>;
  getRepository(options: { owner: string; repo: string }): Promise<Repository>;
  getLabels(target: string): Promise<string[]>;
  getRepositoryLabels(owner: string, repo: string): Promise<LabelDefinition[]>;
  createLabel(owner: string, repo: string, label: LabelDefinition): Promise<void>;
  getPRDiff(owner: string, repo: string, number: number): Promise<string>;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  labels: { name: string }[];
  state: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  labels: { name: string }[];
  state: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
}
