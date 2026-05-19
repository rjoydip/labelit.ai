# Architecture Overview

This document provides a detailed overview of the labelit.ai architecture.

## System Diagram

```
GitHub Webhooks → Webhook Handler → AI Classification → Label Management
                     ↓
              Validation, Queue, Rate Limiting
                     ↓
              PI Tools (Agent, LLM)
                     ↓
              Core Services (Analysis, Feedback)
```

## Directory Structure

```
src/
├── harness/           # PI tools integration (AgentCore, streamSimple)
├── providers/         # GitHub providers (Actions, App)
├── webhook/           # Webhook handling (handler, validation, queue, rate-limit)
├── services/          # Core business logic (analyzer, feedback)
├── ai/                # AI processing (processor, prompts)
├── types/             # TypeScript types
├── utils/             # Utility functions
└── config/            # Configuration
```

## Data Flow

1. **Webhook Reception** - GitHub sends events
2. **Validation** - HMAC signature and rate limiting
3. **Queue Processing** - Retry logic with dead letter queue
4. **AI Classification** - Analyze content using PI tools
5. **Label Management** - Add/remove labels via providers

## Key Components

### Webhook Handler

- Signature verification (HMAC SHA-256)
- Rate limiting per client IP
- Queue with exponential backoff retry
- Dead letter queue for failed items

### AI Harness (PI Tools)

- `AgentCore` - Agent runtime with tool calling
- `streamSimple` - Unified LLM API
- Custom tools: add_labels, remove_labels, analyze_content

### GitHub Providers

- **Actions** - Token-based authentication
- **App** - JWT signing with Web Crypto API

## Security

- HMAC signature verification
- Rate limiting (configurable)
- JWT authentication for App provider
- Input validation

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| Package Manager | Bun |
| AI | @earendil-works/pi-ai, @earendil-works/pi-agent-core |
| Testing | Vitest |
| Linting | oxlint |
| Formatting | oxfmt |

## Configuration

See individual module documentation:
- [Providers](PROVIDERS.md)
- [Harness](HARNESS.md)
- [Webhook](WEBHOOK.md)