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

## License

By contributing, you agree your contributions will be licensed under the MIT License.