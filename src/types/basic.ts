type TicketPredictedLabel = "Bug" | "Story" | "Task" | "Spike";
type PRPredictedLable = "Risk" | "Refactoring" | "Testing";

export interface TypeMetrics {
  total: number;
  correct: number;
}

export interface MetricsData {
  total: number;
  correct: number;
  byType: Record<string, TypeMetrics>;
}

export interface FeedbackData {
  ticketId: string;
  predictedLabel: string;
  actualLabel: string;
  wasCorrect: boolean;
  timestamp: string;
  userId: string;
}

export interface ClassificationType {
  text: string;
  processingTime: number;
}

export type PredictedLabel = TicketPredictedLabel | PRPredictedLable;

export interface LabelDefinition {
  name: string;
  color?: string;
  description?: string;
}

export interface LabelSuggestionResult {
  suggestedLabels: string[];
  rawText: string;
  processingTime: number;
}

export interface SyncResult {
  added: string[];
  removed: string[];
}

export interface PayloadMeta {
  source?: "github";
  type?: "issue" | "pull_request";
  action?: string;
  payload?: {
    issue?: {
      body: string;
      labels: string[];
      number: number;
      state: string;
      title: string;
    };
    pull_request?: {
      description: string;
      labels: string[];
      number: number;
      state: string;
      title: string;
    };
    repository?: {
      full_name: string;
      name: string;
      description: string;
    };
  };
  userPrompt: string;
}

export interface ParseResponse {
  predictedLabel: PredictedLabel;
  rawText: string;
  processingTime: number;
}

export interface Prompt {
  system: string;
  user: string;
}

export type ProviderType = "actions" | "cli" | "app";

export interface ListOptions {
  owner: string;
  repo: string;
  state?: "open" | "closed" | "all";
  per_page?: number;
  page?: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  labels: string[];
  state: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
}

export interface Repository {
  name: string;
  full_name: string;
  description: string;
}

export interface WebhookConfig {
  providers: {
    github?: { secret: string; events: string[] };
  };
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface PRData {
  additions: number;
  deletions: number;
  changed_files: number;
  diff_content: string;
  reviewers: string[];
}
