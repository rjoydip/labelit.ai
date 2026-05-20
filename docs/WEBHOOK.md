# Webhook Configuration

Webhook handling for processing GitHub webhook events with validation, rate limiting, and retry logic.

## Overview

The webhook module provides end-to-end webhook processing including signature verification, rate limiting, queue management, and AI-powered classification.

## WebhookHandler

The main handler for processing incoming webhook requests:

```typescript
import { WebhookHandler } from "./webhook/handler";
import type { Env } from "./types/env";

const handler = new WebhookHandler(env);

const response = await handler.handle(request);
```

### Request Flow

1. Parse incoming webhook payload
2. Extract client IP from headers
3. Check rate limits
4. Validate HMAC signature
5. Classify content using AI
6. Return response

### Response Codes

| Status | Meaning                                  |
| ------ | ---------------------------------------- |
| 200    | Success                                  |
| 429    | Rate limit exceeded or invalid signature |
| 500    | Internal error                           |

## Validation

### HMAC Signature Verification

Validates GitHub webhook signatures using HMAC SHA-256:

```typescript
import { validateGitHubWebhook } from "./webhook/validation";

const result = await validateGitHubWebhook(payload, signature, secret);

if (!result.valid) {
  console.error(result.error);
}
```

**Signature Format:** `sha256=<hex>`

**Example:**

```bash
# GitHub sends:
x-hub-signature-256: sha256=abc123...

# Verification:
const isValid = await verifyHMAC(payload, secret, "sha256=abc123...");
```

## Rate Limiting

### Configuration

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}
```

**Default Configuration:**

```typescript
{
  windowMs: 60000,    // 1 minute
  maxRequests: 100    // 100 requests per minute
}
```

### Usage

```typescript
import { RateLimiter } from "./webhook/rate-limit";

const limiter = new RateLimiter({
  windowMs: 60000,
  maxRequests: 100,
});

const allowed = await limiter.isAllowed("192.168.1.1");

if (!allowed) {
  // Reject request
}
```

### Methods

- `isAllowed(key: string)` - Check if request is allowed
- `reset(key: string)` - Reset limit for specific key
- `clear()` - Clear all rate limits

## Queue with Retry

### Configuration

```typescript
interface QueueConfig {
  maxAttempts: number; // Maximum retry attempts
  backoffMs: number; // Base backoff time in milliseconds
}
```

**Default Configuration:**

```typescript
{
  maxAttempts: 5,
  backoffMs: 1000  // Exponential: 1s, 2s, 4s, 8s, 16s
}
```

### Usage

```typescript
import { Queue } from "./webhook/queue";

const queue = new Queue({
  maxAttempts: 5,
  backoffMs: 1000,
});

// Enqueue work
await queue.enqueue("id-123", { data: "..." });

// Process with retry
const result = await queue.process("id-123", async (data) => {
  await processWebhook(data);
});

if (!result.success) {
  console.error(result.error);
}
```

### Dead Letter Queue

Failed items are moved to the dead letter queue (DLQ):

```typescript
const dlq = queue.getDLQ();

// Retry from DLQ
queue.retryFromDLQ("id-123");
```

### Queue Status

```typescript
console.log(`Pending: ${queue.size()}`);
console.log(`Failed: ${queue.dlqSize()}`);
```

## Payload Processing

### GitHub Event Types

| Event        | Action                      | Classification             |
| ------------ | --------------------------- | -------------------------- |
| issues       | opened, closed, reopened    | Bug, Story, Task, Spike    |
| pull_request | opened, closed, synchronize | Risk, Refactoring, Testing |

### Payload Structure

```typescript
interface PayloadMeta {
  source: "github";
  type: "issue" | "pull_request";
  action: string;
  payload: {
    issue?: {
      body: string;
      labels: string[];
      state: string;
      title: string;
    };
    pull_request?: {
      description: string;
      labels: string[];
      state: string;
      title: string;
    };
    repository?: {
      name: string;
      description: string;
    };
  };
  userPrompt: string;
}
```

## AI Classification

### Ticket Analysis

Classifies issues into categories:

| Category | Keywords                   |
| -------- | -------------------------- |
| Bug      | bug, fix, error, crash     |
| Story    | feat, feature, enhancement |
| Task     | General work items         |
| Spike    | Research, investigation    |

### PR Analysis

Calculates complexity and risk scores:

```typescript
const complexity = prAnalyzer.calculateComplexity({
  additions: 100,
  deletions: 50,
  changed_files: 5,
  diff_content: "...",
  reviewers: ["user1", "user2"],
});

const risk = prAnalyzer.calculateRiskScore({
  additions: 100,
  deletions: 50,
  changed_files: 5,
  diff_content: "...",
  reviewers: ["user1", "user2"],
});
```

## Default Configuration

```typescript
import { DEFAULT_CONFIG } from "./config";

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
```

## Hono Integration

### Setup

```typescript
import { Hono } from "hono";
import type { Env } from "./types/env";
import { WebhookHandler } from "./webhook/handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook/events", async (c) => {
  const handler = new WebhookHandler(c.env);
  return handler.handle(c.req.raw);
});

export default app;
```

### Environment Bindings

```typescript
interface Env {
  KV: KVNamespace;
  AI?: Ai;
  WEBHOOK_SECRET?: string;
  GITHUB_TOKEN?: string;
  PI_PROVIDER?: "openai" | "anthropic" | "google" | "local";
  PI_API_KEY?: string;
  PI_MODEL_NAME?: string;
  MODEL_NAME?: string;
}
```

## Error Responses

```typescript
import { createErrorResponse, createSuccessResponse } from "./utils";

// Error
return createErrorResponse("Rate limit exceeded", 429);

// Success
return createSuccessResponse({ labels: ["bug"] });
```

## Utilities

### Exponential Backoff

```typescript
import { exponentialBackoff } from "./utils";

// Calculate delay for attempt N
const delay = exponentialBackoff(3, 1000); // 8000ms
```

### Sleep

```typescript
import { sleep } from "./utils";

await sleep(1000); // Wait 1 second
```
