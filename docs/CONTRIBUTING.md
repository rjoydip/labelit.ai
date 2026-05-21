# Contributing to labelit.ai

## Pull Requests

1. Fork the repository and create your branch from `main`
2. Add tests for new features
3. Update documentation for API changes
4. Ensure all checks pass:
   ```bash
   bun run lint
   bun run format
   bun run test
   bun run typecheck
   ```

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (version 1.1.3+)
- Git

### Installation

```bash
git clone https://github.com/rjoydip/labelit.ai.git
cd labelit.ai
bun install
```

## Code Style

Uses oxlint for linting and oxfmt for formatting.

## Writing Tests

Uses Vitest for testing. Run with `bun run test`.

### Test Structure

```
tests/
├── integration/          # Integration tests for API endpoints and webhooks
│   ├── api.integration.ts
│   ├── webhook.integration.ts
│   └── env.integration.ts
├── unit/                 # Unit tests for individual modules
│   ├── index.unit.ts
│   ├── webhook/
│   │   ├── handler.unit.ts
│   │   └── validation.unit.ts
│   └── services/
│       ├── analyzer/
│       │   ├── pr-analyzer.unit.ts
│       │   └── ticket-analyzer.unit.ts
│       └── feedback.unit.ts
├── services/             # Service-level tests
│   └── analyzer/
│       ├── pull-request.test.ts
│       └── ticket.test.ts
├── ai/                   # AI processor tests
│   └── ai.test.ts
├── utils.test.ts         # Utility function tests
└── vitest-types.ts       # Shared type aliases for tests
```

### Test File Naming

- Unit tests: `*.unit.ts`
- Integration tests: `*.integration.ts`
- General tests: `*.test.ts`

### Type Aliases

Use type aliases from `tests/vitest-types.ts` for consistent typing:

```typescript
import type { TestEnv, TestClassificationResult } from "../vitest-types";
```

### Mocking Guidelines

- Mock external API calls (fetch) to prevent real HTTP requests
- Use `vi.fn()` for function mocks
- Reset mocks in `beforeEach` or `afterEach`
- For classes extending `AIProcessor`, mock the `fetch` global to prevent actual AI API calls

## License

By contributing, you agree your contributions will be licensed under the MIT License.
