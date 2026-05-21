# labelit.ai

[![code style](https://antfu.me/badge-code-style.svg)](https://oxlint.github.io/)
[![CI](https://github.com/rjoydip/labelit.ai/actions/workflows/ci.yml/badge.svg)](https://github.com/rjoydip/labelit.ai/actions/workflows/ci.yml)
[![Version](https://img.shields.io/npm/v/labelit.ai.svg)](https://www.npmjs.com/package/labelit.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://www.typestrong.com/)

## Overview

labelit.ai is a monolithic platform for processing webhook events from GitHub and applying AI-powered labeling to issues and pull requests. The system uses Cloudflare Workers for event ingestion and includes PI tools for AI orchestration.

## Project Structure

```
src/
├── harness/        # PI tools integration (AgentCore, streamSimple)
├── providers/      # GitHub providers (Actions, App)
├── webhook/        # Webhook handling (validation, retry, rate limiting)
├── services/       # Core business logic (analyzer, feedback)
├── ai/             # AI processing (processor, prompts)
├── types/          # TypeScript types
├── utils/          # Utility functions
└── config/         # Configuration
```

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (version 1.3+)
- Git
- Cloudflare account (for deployment)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/rjoydip/labelit.ai.git
   cd labelit.ai
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

### Development

Run the development server:

```bash
bun run dev
```

### CLI Usage

```bash
# Local
bun run labelit start
bun run labelit add-labels owner/repo#123 bug priority:high

# GitHub Actions
- uses: rjoydip/labelit.ai/labelit@main
  with:
    action: analyze
    target: owner/repo#123

# GitHub CLI (after extension setup)
gh labelit analyze owner/repo#123
```

See [docs/CLI.md](docs/CLI.md) for full documentation.

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production (Cloudflare Workers)
- `bun run deploy` - Deploy to Cloudflare
- `bun run lint` - Lint code (oxlint)
- `bun run format` - Format code (oxfmt)
- `bun run test` - Run tests
- `bun run typecheck` - Type check
- `bun run knip` - Check for unused dependencies

### Deployment

Secrets cannot be set directly in `wrangler.toml` for security. Use `wrangler secret put`:

```bash
wrangler secret put WEBHOOK_SECRET
wrangler secret put PI_API_KEY
wrangler secret put GITHUB_APP_PRIVATE_KEY
```

## Configuration

### Environment Variables

| Variable                     | Description                              | Required    |
| ---------------------------- | ---------------------------------------- | ----------- |
| `PI_PROVIDER`                | LLM provider (openai, anthropic, google) | Yes         |
| `PI_API_KEY`                 | API key for LLM provider                 | Yes         |
| `PI_MODEL_NAME`              | Model name (e.g., gpt-4o-mini)           | No          |
| `WEBHOOK_SECRET`             | GitHub webhook secret                    | Yes         |
| `GITHUB_TOKEN`               | GitHub personal access token             | For Actions |
| `GITHUB_APP_ID`              | GitHub App ID                            | For App     |
| `GITHUB_APP_PRIVATE_KEY`     | GitHub App private key                   | For App     |
| `GITHUB_APP_INSTALLATION_ID` | GitHub App installation ID               | For App     |

## Technology Stack

| Component       | Technology                                           |
| --------------- | ---------------------------------------------------- |
| Runtime         | Cloudflare Workers                                   |
| Framework       | Hono                                                 |
| Package Manager | Bun                                                  |
| AI              | @earendil-works/pi-ai, @earendil-works/pi-agent-core |
| Testing         | Vitest                                               |
| Linting         | oxlint                                               |
| Formatting      | oxfmt                                                |

## Documentation

| Topic                                | Description                     |
| ------------------------------------ | ------------------------------- |
| [Architecture](docs/ARCHITECTURE.md) | System design and components    |
| [CLI](docs/CLI.md)                   | Command-line interface          |
| [Providers](docs/PROVIDERS.md)       | GitHub provider implementations |
| [Harness](docs/HARNESS.md)           | PI tools integration            |
| [Webhook](docs/WEBHOOK.md)           | Webhook handling                |
| [Contributing](docs/CONTRIBUTING.md) | How to contribute and write tests |

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
