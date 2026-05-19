# Development Plan: labelit.ai

A comprehensive development plan for labelit.ai - a monolithic platform for AI-powered issue labeling via webhooks.

---

## 1. Current State (Q2 2026)

- ✅ **Monolithic** structure (converted from Turborepo monorepo)
- ✅ Basic webhook handling in Cloudflare Worker
- ✅ PI tools integration (@earendil-works/pi-ai, @earendil-works/pi-agent-core)
- ✅ GitHub providers (Actions, CLI, App)
- ✅ TypeScript configured
- ✅ Linting with oxlint
- ✅ Development workflows with Bun

### Completed Migration

- [x] Converted from 7-package monorepo to monolithic
- [x] Created `src/harness/` with custom AI integration
- [x] Created `src/providers/github/` with Actions, CLI, App
- [x] Enhanced webhook with validation, retry, rate limiting
- [x] Consolidated into single package.json and tsconfig.json
- [x] Updated documentation

---

## 2. Architecture

### Monolithic Structure

```
labelit.ai/
├── src/
│   ├── harness/           # PI tools integration
│   │   ├── index.ts       # Harness with Agent, streamSimple
│   │   └── tools/         # Custom tool definitions for labeling
│   │
│   ├── providers/         # Provider implementations
│   │   └── github/
│   │       ├── actions.ts # GitHub Actions
│   │       ├── cli.ts     # GitHub CLI
│   │       └── app.ts     # GitHub App
│   │
│   ├── webhook/           # Webhook handling
│   │   ├── handler.ts     # Webhook handler
│   │   ├── validation.ts  # Signature verification
│   │   ├── queue.ts       # Queue with retry logic
│   │   └── rate-limit.ts  # Rate limiting
│   │
│   ├── services/          # Core business logic
│   │   ├── analyzer/      # PR & Ticket analyzers
│   │   └── feedback.ts    # Feedback processing
│   │
│   ├── ai/                # AI processing
│   │   ├── processor.ts   # AI processor
│   │   └── prompts.ts     # Prompt templates
│   │
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── config/            # Configuration
│
├── wrangler.toml          # Cloudflare Workers config
├── package.json           # Single package.json
├── tsconfig.json          # Single tsconfig
└── ...
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          External Inputs                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ GitHub       │  │ GitHub CLI   │  │ GitHub App   │             │
│  │ Actions      │  │              │  │              │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Providers Layer                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  src/providers/github/ - Unified Provider Interface          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Webhook Service                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Validation  │  │ Queue       │  │ Rate Limit  │                │
│  │ - HMAC      │  │ - Retry     │  │ - Per IP    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Harness Layer (PI Tools)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  @earendil-works/pi-ai   - Unified LLM API (OpenAI, Anthropic, Google) │
│  │  @earendil-works/pi-agent-core - Agent runtime with tool calling │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Core Services                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                          │
│  │ Analyzer │  │ Feedback │  │ AI Proc  │                          │
│  └──────────┘  └──────────┘  └──────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. PI Tools Harness

### Supported Providers

PI tools supports multiple LLM providers:

| Provider   | Models                           |
| ---------- | -------------------------------- |
| OpenAI     | GPT-4, GPT-3.5, o1, o3           |
| Anthropic  | Claude 3.5, Claude 3, Opus       |
| Google     | Gemini 1.5, Gemini 2.0           |
| DeepSeek   | DeepSeek Chat, DeepSeek Reasoner |
| OpenRouter | Any model from 250+ providers    |

### Agent Integration

```typescript
// src/harness/index.ts
import { Agent } from "@earendil-works/pi-agent-core";
import { streamSimple } from "@earendil-works/pi-ai";

const agent = new Agent({
  streamFn: streamSimple,
  getApiKey: (provider) => process.env[`${provider.toUpperCase()}_API_KEY`],
});

await agent.prompt("Analyze this issue for labeling");
```

### Custom Tools

Labeling operations handled by custom tools:

- `createAddLabelsTool()` - Add labels to issues/PRs
- `createRemoveLabelsTool()` - Remove labels from issues/PRs
- `createAnalyzeContentTool()` - Analyze content to suggest labels

---

## 4. GitHub Provider Implementation

### Unified Provider Interface

```typescript
// src/providers/github/types.ts
export interface GitHubProvider {
  type: ProviderType;
  authenticate(): Promise<void>;
  getIssues(options: ListOptions): Promise<Issue[]>;
  getPullRequests(options: ListOptions): Promise<PullRequest[]>;
  addLabels(target: string, labels: string[]): Promise<void>;
  removeLabels(target: string, labels: string[]): Promise<void>;
  getRepository(options: { owner: string; repo: string }): Promise<Repository>;
}
```

### Provider Implementations

| Provider       | File                              | Authentication           |
| -------------- | --------------------------------- | ------------------------ |
| GitHub Actions | `src/providers/github/actions.ts` | `GITHUB_TOKEN` env       |
| GitHub CLI     | `src/providers/github/cli.ts`     | `gh auth token`          |
| GitHub App     | `src/providers/github/app.ts`     | JWT + Installation token |

### Factory Pattern

```typescript
// src/providers/github/index.ts
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
```

---

## 5. Webhook Enhancement

### Features

| Feature                    | Description                                                             |
| -------------------------- | ----------------------------------------------------------------------- |
| **Signature Verification** | HMAC SHA-256 for GitHub, token validation for GitLab, secret validation |
| **Retry Logic**            | Exponential backoff (1s, 2s, 4s, 8s...), max 5 attempts                 |
| **Dead Letter Queue**      | Store failed events for manual retry                                    |
| **Rate Limiting**          | Per-provider rate limits (configurable)                                 |

### Configuration

```typescript
// src/config/index.ts
export interface Config {
  retry: {
    maxAttempts: number;
    backoffMs: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
```

---

## 6. Development Roadmap

### Short-Term Goals (Next 4-6 Weeks)

#### 1. Code Quality

- [ ] Add comprehensive tests for new modules
- [ ] Ensure 80%+ test coverage for core services
- [ ] Add integration tests for providers

#### 2. AI Integration

- [ ] Complete harness integration with unified LLM API
- [ ] Add more tool definitions for labeling operations
- [ ] Implement state management for multi-turn conversations

#### 3. Documentation

- [ ] Create PROVIDERS.md guide
- [ ] Create HARNESS.md guide
- [ ] Create WEBHOOK.md guide

### Medium-Term Goals (Next 3 Months)

#### 1. Provider Expansion

- [ ] Add GitLab provider implementation
- [ ] Add Jira provider implementation
- [ ] Add Bitbucket provider implementation

#### 2. Feature Completeness

- [ ] Complete webhook security verification (all providers)
- [ ] Build aggregator service for combining signals
- [ ] Implement confidence scoring

#### 3. Scalability & Performance

- [ ] Optimize Cloudflare Worker cold start times
- [ ] Implement caching layer
- [ ] Add metrics collection

### Long-Term Goals (6+ Months)

#### 1. Advanced Features

- [ ] Machine learning model fine-tuning capabilities
- [ ] Custom label creation UI
- [ ] Analytics dashboard

#### 2. Platform & Infrastructure

- [ ] Self-hosting options for enterprise
- [ ] Multi-tenant support
- [ ] Advanced security (SSO, audit logs)

#### 3. Ecosystem

- [ ] Public API with documentation
- [ ] Plugin system for extensibility
- [ ] Community contribution program

---

## 7. Implementation Phases

### Phase 1: Structural Conversion ✅

- [x] Remove `packages/` directory, create `src/` structure
- [x] Consolidate all code into `src/` subdirectories
- [x] Merge 7 package.json dependencies into 1
- [x] Create single tsconfig.json
- [x] Remove turbo.json and workspace configs

### Phase 2: Provider Implementation ✅

- [x] Create `src/providers/github/` with unified interface
- [x] Implement GitHub Actions provider
- [x] Implement GitHub CLI provider
- [x] Implement GitHub App provider
- [x] Add authentication handlers

### Phase 3: Webhook Enhancement ✅

- [x] Add signature verification to webhook handler
- [x] Implement retry with exponential backoff
- [x] Add rate limiting
- [x] Create webhook configuration system

### Phase 4: PI Tools Integration ✅

- [x] Install `@earendil-works/pi-ai` and `@earendil-works/pi-agent-core`
- [x] Integrate with webhook processing
- [x] Create custom labeling tools
- [x] Add agent runtime for tool calling

### Phase 5: Documentation & Testing (In Progress)

- [x] Update README with monolithic structure
- [x] Update ARCHITECTURE.md
- [x] Update PLANS.md (this file)
- [x] Update AGENTS.md
- [ ] Write comprehensive tests
- [ ] Add integration tests

---

## 8. Dependencies

### Core Dependencies

```json
{
  "hono": "^4.7.5",
  "@earendil-works/pi-ai": "^0.75.0",
  "@earendil-works/pi-agent-core": "^0.75.0"
}
```

### Build & Dev Dependencies

```json
{
  "typescript": "^5.8.2",
  "vitest": "^4.1.5",
  "oxlint": "^1.61.0",
  "oxfmt": "^0.46.0",
  "wrangler": "^4.6.0",
  "bun": "^1.3.13"
}
```

---

## 9. Success Metrics

### Technical Metrics

- 99.9% uptime for webhook processing
- <100ms average webhook processing time
- <5% error rate in AI labeling
- 80%+ test coverage maintained

### Business Metrics

- Time saved per developer on manual labeling
- Accuracy improvement over manual labeling
- Customer satisfaction score (NPS)
- Adoption rate among target users

---

## 10. Risk Mitigation

| Risk                     | Mitigation                              |
| ------------------------ | --------------------------------------- |
| LLM provider API changes | Abstract with unified interface         |
| Provider API changes     | Abstract with interface + adapters      |
| Migration complexity     | Incremental migration, preserve history |
| Breaking changes         | Add migration guide                     |

---

## 11. Review Process

This roadmap will be reviewed and updated:

- Quarterly during planning sessions
- After major milestones are completed
- When significant technical changes are proposed

---

_Last Updated: May 2026_
_Review Cycle: Quarterly_
