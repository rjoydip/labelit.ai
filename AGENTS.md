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

<!-- CODEGRAPH_START -->

## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question                                      | Tool                |
| --------------------------------------------- | ------------------- |
| "Where is X defined?" / "Find symbol named X" | `codegraph_search`  |
| "What calls function Y?"                      | `codegraph_callers` |
| "What does Y call?"                           | `codegraph_callees` |
| "What would break if I changed Z?"            | `codegraph_impact`  |
| "Show me Y's signature / source / docstring"  | `codegraph_node`    |
| "Give me focused context for a task/area"     | `codegraph_context` |
| "Survey an unfamiliar module/topic"           | `codegraph_explore` |
| "What files exist under path/"                | `codegraph_files`   |
| "Is the index healthy?"                       | `codegraph_status`  |

### Rules of thumb

- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **`codegraph_explore` is the heavy hitter** for unfamiliar areas — it returns full source from all relevant files in one call, but is token-heavy. If your harness supports parallel subagents (e.g., Claude Code's Task tool), spawn one for explore-class questions to keep main session context clean.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: _"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"_

<!-- CODEGRAPH_END -->
