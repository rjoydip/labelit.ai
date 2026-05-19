# Labelit.ai Agent Guidelines

Guidelines for AI agents working on the labelit.ai codebase.

## Quick Start

1. Read [README.md](README.md) for project overview
2. Check `package.json` for dependencies
3. Follow established code patterns

## Development Commands

```bash
bun install     # Install dependencies
bun run dev     # Development server
bun run build   # Build for production
bun run lint    # Lint code
bun run test    # Run tests
bun run typecheck  # Type check
```

## Module Guidelines

### harness/ - PI Tools Integration

- Uses `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`
- See [docs/HARNESS.md](docs/HARNESS.md)

### providers/ - GitHub Providers

- Actions and App authentication
- See [docs/PROVIDERS.md](docs/PROVIDERS.md)

### webhook/ - Webhook Handling

- Validation, retry, rate limiting
- See [docs/WEBHOOK.md](docs/WEBHOOK.md)

### services/ - Core Business Logic

- Analysis and feedback processing
- Framework-agnostic where possible

## Key Patterns

### PI Tools Integration

```typescript
import { AgentCore } from "./harness";
import { streamSimple } from "@earendil-works/pi-ai";

const agent = new AgentCore({
  streamFn: streamSimple,
  getApiKey: (provider) => process.env.PI_API_KEY,
});
```

### Provider Implementation

Follow `src/providers/github/types.ts` interface for new providers.

## Rules

- Keep changes focused and minimal
- Update tests when modifying functionality
- Ensure TypeScript type safety
- Avoid breaking changes without explicit instruction

## Getting Help

- Refer to existing similar implementations
- Check documentation in `/docs` folder
- Ask for clarification when uncertain