# Labelit.ai Agent Usage Guidelines

This document provides guidelines for using AI agents (like myself) to work on the labelit.ai codebase.

## Overview

Labelit.ai is a monorepo using Turborepo with Bun as the package manager. The codebase consists of several packages:

- `packages/ai` - AI processing service
- `packages/config` - Shared configuration
- `packages/services` - Core services
- `packages/types` - Shared TypeScript types
- `packages/utils` - Utility functions
- `packages/worker` - Cloudflare Worker service

## Best Practices for Agent Work

### 1. Understanding the Codebase

Before making changes, agents should:

- Review the README.md for project overview
- Check package.json files to understand dependencies
- Examine existing code patterns in similar packages
- Follow the existing import/export conventions

### 2. Making Changes

When modifying code:

- Always read existing files before editing
- Follow the established code style and patterns
- Keep changes focused and minimal
- Update tests when modifying functionality
- Ensure type safety with TypeScript

### 3. Running Commands

Standard development workflow:

- Install dependencies: `bun install`
- Run development: `bun run dev`
- Build packages: `bun run build`
- Lint code: `bun run lint` (after migration to oxlint)
- Type check: `bun run typecheck`
- Run tests: `bun run test`

### 4. Git Practices

- Create descriptive commit messages
- Keep commits focused on single changes
- Follow existing branch naming conventions
- Ensure pre-commit hooks pass before pushing

### 5. Documentation

- Update README.md when adding significant features
- Add JSDoc comments to new functions and classes
- Document complex logic with clear comments
- Keep documentation in sync with code changes

## Package-Specific Guidelines

### AI Package (`packages/ai`)

- Focuses on AI processing and prompt management
- Uses Workers AI provider
- Follows functional programming patterns where appropriate

### Worker Package (`packages/worker`)

- Cloudflare Worker handling webhook events
- Uses Hono framework
- Implements secure headers and JSON formatting

### Services Package (`packages/services`)

- Contains core business logic
- Includes services like feedback processing
- Should be framework-agnostic where possible

### Types Package (`packages/types`)

- Contains shared TypeScript interfaces and types
- Should be kept minimal and focused
- Changes should be backward compatible when possible

### Utils Package (`packages/utils`)

- Utility functions used across packages
- Should be pure functions with no side effects
- Well-tested utility functions

### Config Package (`packages/config`)

- Shared ESLint, TypeScript, and other configurations
- Changes affect all packages, so test thoroughly

## Limitations and Considerations

- Agents should avoid making breaking changes without explicit instruction
- Security-sensitive changes (authentication, validation) require special attention
- Performance-critical code should be reviewed carefully
- Cross-package changes need coordination
- Always verify that changes don't break existing functionality

## Getting Help

If uncertain about any aspect of the codebase:

- Refer to existing similar implementations
- Check comments and documentation
- When in doubt, ask for clarification before proceeding
