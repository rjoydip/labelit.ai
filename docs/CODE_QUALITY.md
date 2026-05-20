# Code Quality

## Commands

```bash
bun run lint       # Lint code (oxlint)
bun run format     # Format code (oxfmt)
bun run test       # Run tests (Vitest)
bun run typecheck  # Type check (TypeScript)
bun run knip       # Check unused dependencies
```

## Checks

| Check        | Command             | Status        |
| ------------ | ------------------- | ------------- |
| Linting      | `bun run lint`      | ✅ oxlint     |
| Formatting   | `bun run format`    | ✅ oxfmt      |
| Tests        | `bun run test`      | ✅ Vitest     |
| Type Check   | `bun run typecheck` | ✅ TypeScript |
| Dependencies | `bun run knip`      | ✅ knip       |

## Best Practices

1. Run all checks before submitting PRs
2. Address any failures before merging
3. Keep linting and type checking clean

## Troubleshooting

1. Dependencies: `bun install`
2. Run from repository root
3. Check individual commands for errors
4. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup
