# Architecture Overview

This document provides a detailed overview of the labelit.ai architecture.

## System Architecture

labelit.ai follows a monolithic architecture with clearly separated layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Inputs                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ GitHub       │  │ GitHub CLI   │  │ GitHub App   │             │
│  │ Actions      │  │              │  │              │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼─────────────────┼─────────────────┼──────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Providers Layer                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  src/providers/github/                                        │  │
│  │  - actions.ts (GitHub Actions provider)                     │  │
│  │  - cli.ts (GitHub CLI provider)                              │  │
│  │  - app.ts (GitHub App provider)                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Webhook Service                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Validation  │  │ Queue       │  │ Rate Limit  │                │
│  │ - HMAC      │  │ - Retry     │  │ - Per IP    │                │
│  │ - Token     │  │ - DLQ       │  │ - Config    │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  @earendil-works/pi-ai     - Unified LLM API (OpenAI, Anthropic, Google)  │  │
│  @earendil-works/pi-agent-core - Agent runtime with tool calling         │  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Core Services                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Analyzer │  │ Feedback │  │ AI Proc  │  │ Utils    │           │
│  │ - PR     │  │ Service  │  │          │  │          │           │
│  │ - Ticket │  │          │  │          │  │          │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── harness/           # PI tools integration
│   ├── index.ts       # Harness entry point (Agent, streamSimple)
│   └── createAddLabelsTool.ts  # Labeling tool definitions
│
├── providers/        # GitHub provider implementations
│   └── github/
│       ├── index.ts   # Provider exports
│       ├── types.ts   # Type definitions
│       ├── factory.ts # Provider factory
│       ├── actions.ts # GitHub Actions
│       ├── cli.ts     # GitHub CLI
│       └── app.ts     # GitHub App
│
├── webhook/         # Webhook handling
│   ├── index.ts     # Module exports
│   ├── handler.ts   # Main webhook handler
│   ├── validation.ts # Signature verification
│   ├── queue.ts     # Queue with retry logic
│   └── rate-limit.ts # Rate limiting
│
├── services/        # Core business logic
│   ├── index.ts     # Module exports
│   ├── feedback.ts  # Feedback service
│   └── analyzer/
│       ├── pull-request.ts
│       └── ticket.ts
│
├── ai/             # AI processing
│   ├── processor.ts
│   └── prompts.ts
│
├── types/          # TypeScript types
│   ├── index.ts
│   ├── basic.ts
│   └── env.ts
│
├── utils/          # Utility functions
│   └── index.ts
│
└── config/         # Configuration
    └── index.ts
```

## Data Flow

1. **GitHub** sends webhook event
2. **Webhook handler** receives and validates the request
3. **Validation** checks HMAC signature/rate limits
4. **Queue** processes with retry logic if needed
5. **Harness** orchestrates AI processing
6. **Agent Core** manages tool execution and state
7. **PI tools** handles LLM calls (OpenAI/Anthropic/Google)
8. **Services** perform business logic (analysis, feedback)
9. **Results** stored in database for analytics

## Security Considerations

- Webhook signature verification (HMAC for GitHub)
- Rate limiting per client IP
- Exponential backoff retry with dead letter queue
- Provider authentication via tokens/JWT
- Input validation prevents injection attacks

## Scalability Features

- Horizontal scaling via Cloudflare Workers
- Queue buffering for traffic spikes
- Rate limiting prevents abuse
- Efficient resource usage for LLM calls

## Technology Choices

### Cloudflare Workers

- Global edge network for low latency
- Automatic scaling without server management
- Generous free tier for development
- Built-in KV storage and R2 object storage
- Workers AI for accessible machine learning

### Bun

- Fast package installation
- Built-in test runner
- Optimized for TypeScript

### Hono Framework

- Minimal bundle size for fast cold starts
- Middleware architecture
- Excellent TypeScript integration

### AI Harness

- Unified multi-provider LLM API
- Agent runtime with tool calling
- State management for multi-turn conversations

### Vitest

- Fast test execution
- Built-in coverage reporting
- Excellent ESM support

### oxlint + oxfmt

- Blazing fast linting and formatting
- Zero-configuration defaults
- Modern JavaScript/TypeScript support
