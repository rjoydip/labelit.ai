export const DEFAULT_CONFIG = {
  retry: {
    maxAttempts: 5,
    backoffMs: 1000,
  },
  rateLimit: {
    windowMs: 60000,
    maxRequests: 100,
  },
} as const;

export const GITHUB_EVENTS = {
  issues: ["opened", "closed", "reopened", "labeled", "unlabeled"],
  pull_request: ["opened", "closed", "reopened", "synchronize", "labeled", "unlabeled"],
  pull_request_review: ["submitted", "dismissed"],
} as const;
