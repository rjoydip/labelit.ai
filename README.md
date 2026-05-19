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
labelit.ai/
├── src/
│   ├── harness/        # PI tools integration (Agent, streamSimple)
│   ├── providers/      # GitHub provider implementations
│   │   └── github/
│   ├── webhook/       # Webhook handling with validation, retry, rate limiting
│   ├── services/      # Core business logic
│   ├── ai/            # AI processing
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions
│   └── config/         # Configuration
├── docs/               # Documentation
├── tests/              # Test files
├── wrangler.toml       # Cloudflare Workers configuration
└── package.json        # Single package.json
```

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

| Variable | Description | Required |
|----------|-------------|----------|
| `PI_PROVIDER` | LLM provider (openai, anthropic, google) | Yes |
| `PI_API_KEY` | API key for LLM provider | Yes |
| `PI_MODEL_NAME` | Model name (e.g., gpt-4o-mini) | No |
| `WEBHOOK_SECRET` | GitHub webhook secret | Yes |
| `GITHUB_TOKEN` | GitHub personal access token | For Actions |
| `GITHUB_APP_ID` | GitHub App ID | For App |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key | For App |
| `GITHUB_APP_INSTALLATION_ID` | GitHub App installation ID | For App |

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Package Manager**: Bun
- **Language**: TypeScript
- **AI Integration**: @earendil-works/pi-ai, @earendil-works/pi-agent-core
- **Linting**: oxlint
- **Formatting**: oxfmt
- **Testing**: Vitest

## Documentation

Detailed documentation can be found in the `/docs` directory:

- [Architecture](docs/ARCHITECTURE.md)
- [Providers](docs/PROVIDERS.md)
- [Harness](docs/HARNESS.md)
- [Webhook](docs/WEBHOOK.md)

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.