# labelit.ai Architectural Decisions

This document records significant architectural decisions made for the labelit.ai project.

## Decision Record Template

Each decision record follows this format:

### [Decision ID] - [Short Title]

- **Status**: [proposed | accepted | rejected | superseded]
- **Date**: [YYYY-MM-DD]
- **Context**: [What issue or problem motivated this decision]
- **Decision**: [What we decided to do]
- **Consequences**: [What became easier or harder as a result]
- **Alternatives Considered**: [Other options we evaluated]

---

### ADR-001 - Monorepo Structure with Turborepo

- **Status**: accepted
- **Date**: 2026-04-20
- **Context**: Need to manage multiple related packages (AI service, worker, shared types, etc.) with shared dependencies and consistent tooling.
- **Decision**: Use Turborepo to create a monorepo structure with Bun as the package manager.
- **Consequences**:
  - Simplified dependency management across packages
  - Faster installation with Bun's efficient package handling
  - Shared configuration through workspace packages
  - Complex initial setup but better long-term maintainability
- **Alternatives Considered**:
  - Multiple separate repositories (rejected due to duplication of effort)
  - Lerna with npm/yarn (rejected in favor of Turborepo + Bun for better performance)
  - Nx (rejected due to steeper learning curve for current needs)

### ADR-002 - Cloudflare Workers for Webhook Ingestion

- **Status**: accepted
- **Date**: 2026-04-20
- **Context**: Need a scalable, low-latency solution for handling webhook events from various sources (GitHub, GitLab, Jira).
- **Decision**: Use Cloudflare Workers as the primary webhook ingestion layer.
- **Consequences**:
  - Global distribution with low latency
  - Automatic scaling to handle traffic spikes
  - Cost-effective for variable workloads
  - Limited execution time (50ms CPU time on free tier)
  - Vendor lock-in to Cloudflare platform
- **Alternatives Considered**:
  - Traditional Node.js servers (rejected due to scaling complexity)
  - AWS Lambda (rejected due to cold start times and complexity)
  - Firebase Functions (rejected due to ecosystem limitations)
  - Self-managed Kubernetes (rejected due to operational overhead)

### ADR-003 - TypeScript for Type Safety

- **Status**: accepted
- **Date**: 2026-04-20
- **Context**: Need to maintain code quality and prevent runtime errors in a growing codebase.
- **Decision**: Use TypeScript strictly across all packages with strict type checking enabled.
- **Consequences**:
  - Improved developer experience with IDE autocomplete
  - Reduced runtime errors through compile-time type checking
  - Better documentation through type definitions
  - Initial development overhead for type definitions
  - Need for build step before execution
- **Alternatives Considered**:
  - JavaScript with JSDoc (rejected due to weaker type safety)
  - Flow (rejected due to lesser adoption and tooling)
  - No types (rejected due to maintenance concerns at scale)

### ADR-004 - Hono Framework for Worker Services

- **Status**: accepted
- **Date**: 2026-04-20
- **Context**: Need a lightweight, efficient framework for building Cloudflare Worker applications.
- **Decision**: Use Hono framework for all Cloudflare Worker services.
- **Consequences**:
  - Minimal bundle size for faster cold starts
  - Excellent TypeScript support
  - Middleware architecture for cross-cutting concerns
  - Built-in support for various content types
  - Smaller community compared to Express.js
- **Alternatives Considered**:
  - Express.js (rejected due to larger bundle size)
  - Bare Cloudflare Workers API (rejected due to more boilerplate)
  - Fastify (rejected due to larger bundle size than Hono)
  - SvelteKit (rejected due to over-engineering for API services)

### ADR-005 - Workers AI for AI Processing

- **Status**: accepted
- **Date**: 2026-04-20
- **Context**: Need to process text for issue labeling without managing external AI infrastructure.
- **Decision**: Use Cloudflare Workers AI for all AI processing tasks.
- **Consequences**:
  - Seamless integration with Cloudflare Workers
  - No infrastructure to manage
  - Automatic scaling based on demand
  - Predictable pricing model
  - Limited to models available in Workers AI catalog
  - Potential vendor lock-in
- **Alternatives Considered**:
  - External API calls to OpenAI/Anthropic (rejected due to latency and key management)
  - Self-hosted models on Cloudflare Workers (rejected due to resource constraints)
  - AWS SageMaker integration (rejected due to complexity)
  - Google Vertex AI (rejected due to similar external API concerns)

### ADR-006 - Migration from ESLint to oxlint

- **Status**: accepted
- **Date**: 2026-04-23
- **Context**: Current ESLint setup with @antfu/eslint-config is functional but oxlint offers better performance and modern JavaScript/TypeScript support.
- **Decision**: Migrate all packages from ESLint to oxlint for linting, and introduce oxfmt for code formatting.
- **Consequences**:
  - Significantly faster linting performance (especially in large codebases)
  - Modern parser supporting latest TypeScript features
  - Zero-configuration approach similar to @antfu/eslint-config
  - Need to migrate custom ESLint rules (if any exist)
  - oxfmt provides consistent formatting with minimal configuration
- **Alternatives Considered**:
  - Keep current ESLint setup (rejected due to performance concerns)
  - Migrate to ESLint with Flat Config (rejected due to oxlint's superior performance)
  - Use Biome (rejected due to oxlint's better TypeScript integration)
  - Use Prettier + ESLint combination (rejected due to oxfmt + oxlint being more integrated)

### ADR-007 - actions-up for GitHub Actions Management

- **Status**: accepted
- **Date**: 2026-04-23
- **Context**: Need to manage GitHub Actions workflows efficiently as the project grows.
- **Decision**: Integrate actions-up for centralized GitHub Actions workflow management.
- **Consequences**:
  - Single source of truth for workflow definitions
  - Easy synchronization across multiple repositories (if needed)
  - Reduced duplication in workflow files
  - Learning curve for new team members
  - Additional dependency to maintain
- **Alternatives Considered**:
  - Manual workflow management (rejected due to maintenance overhead)
  - GitHub Actions templates (rejected due to less flexibility)
  - Custom workflow generation scripts (rejected due to actions-up being more mature)
  - Dependabot for workflow updates (rejected due to different use case)

## Future Decisions

These are decisions that need to be made in the near future:

- [ ] Database selection for persistent storage
- [ ] Caching strategy (Redis vs Cloudflare KV vs custom)
- [ ] Authentication and authorization approach
- [ ] API versioning strategy
- [ ] Deployment strategy (staging/production environments)
- [ ] Monitoring and observability stack
- [ ] Security audit and penetration testing approach
- [ ] Backup and disaster recovery plan

## How to Add a New Decision

1. Create a new decision record following the template above
2. Use the next sequential ID (ADR-XXX)
3. Add it to the appropriate section (accepted decisions or future decisions)
4. Update the date to the current date when the decision is made
5. Clearly state the status as "accepted" when the decision is finalized

## References

- [Architectural Decision Records](https://adr.github.io/)
- [MADR (Markdown Architectural Decision Records)](https://adr.github.io/madr/)
- [Template for Architectural Decision Records](https://github.com/joelparkerhenderson/architecture_decision_record)

_Last Updated: April 2026_
