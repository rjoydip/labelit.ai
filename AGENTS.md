# Labelit.ai Agent Usage Guidelines

This document provides guidelines for AI agents working on the labelit.ai codebase.

## Overview

Labelit.ai is a **monolithic** application using Bun as the package manager. The codebase consists of several modules:

- `src/harness/` - PI tools integration (AI orchestration)
- `src/providers/` - GitHub provider implementations
- `src/webhook/` - Webhook handling with validation, retry, rate limiting
- `src/services/` - Core business logic
- `src/ai/` - AI processing
- `src/types/` - TypeScript types
- `src/utils/` - Utility functions
- `src/config/` - Configuration

## Best Practices

### 1. Understanding the Codebase

Before making changes, agents should:

- Review the README.md for project overview
- Check package.json for dependencies
- Examine existing code patterns in similar modules
- Follow the established code style and patterns

### 2. Making Changes

When modifying code:

- Always read existing files before editing
- Follow the established code style
- Keep changes focused and minimal
- Update tests when modifying functionality
- Ensure type safety with TypeScript

### 3. Running Commands

Standard development workflow:

- Install dependencies: `bun install`
- Run development: `bun run dev`
- Build: `bun run build`
- Lint: `bun run lint`
- Format: `bun run format`
- Type check: `bun run typecheck`
- Run tests: `bun run test`

### 4. Module Guidelines

#### Harness (`src/harness/`)

- Focuses on AI processing and prompt management
- Uses PI tools (@earendil-works/pi-ai, @earendil-works/pi-agent-core) for unified LLM API
- Implements tool definitions for labeling operations

#### Providers (`src/providers/`)

- Contains GitHub provider implementations
- Supports Actions, CLI, and App authentication methods
- Follows factory pattern for provider creation

#### Webhook (`src/webhook/`)

- Cloudflare Worker handling webhook events
- Includes signature verification, retry logic, rate limiting
- Uses Hono framework

#### Services (`src/services/`)

- Contains core business logic
- Includes feedback processing, PR/Ticket analyzers
- Framework-agnostic where possible

### 5. PI Tools Integration

When working with the harness:

- Use `streamSimple` from `@earendil-works/pi-ai` for LLM calls
- Use `Agent` from `@earendil-works/pi-agent-core` for agent runtime
- Define custom tools using the AgentTool interface
- Follow the tool definition pattern in `src/harness/`

Example:

```typescript
import { Agent } from "@earendil-works/pi-agent-core";
import { streamSimple } from "@earendil-works/pi-ai";

const agent = new Agent({
  streamFn: streamSimple,
  getApiKey: (provider) => process.env[`${provider.toUpperCase()}_API_KEY`],
});
```

### 6. Provider Implementation

When adding new providers:

- Follow the interface in `src/providers/github/types.ts`
- Implement authentication method
- Support getIssues, getPullRequests, addLabels, removeLabels

## Limitations and Considerations

- Agents should avoid breaking changes without explicit instruction
- Security-sensitive changes require special attention
- Cross-module changes need coordination
- Always verify that changes don't break existing functionality

## Getting Help

If uncertain about any aspect of the codebase:

- Refer to existing similar implementations
- Check comments and documentation
- When in doubt, ask for clarification before proceeding
