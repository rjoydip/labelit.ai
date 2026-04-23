# Architecture Overview

This document provides a detailed overview of the labelit.ai architecture.

## System Components

### 1. Webhook Service (packages/worker)

- Receives incoming webhooks from GitHub, GitLab, and Jira
- Verifies webhook signatures for security
- Places validated events onto a queue for processing
- Built with Hono framework on Cloudflare Workers

### 2. Queue System

- Internal queue mechanism for decoupling webhook reception from processing
- Provides buffering during traffic spikes
- Ensures reliable event delivery

### 3. Cache Layer

- Redis-compatible cache for storing frequently accessed data
- Reduces load on external APIs and databases
- Stores user preferences, repository metadata, and rate limit information

### 4. AI Processing Service (packages/ai)

- Processes issue/PR descriptions and metadata
- Uses Cloudflare Workers AI for text understanding
- Generates relevant labels based on content analysis
- Applies confidence scoring to label suggestions

### 5. Aggregator Service (packages/services)

- Combines multiple signals (AI suggestions, repository patterns, user history)
- Resolves conflicts between different labeling approaches
- Applies business rules and constraints
- Outputs final label recommendations

### 6. Labeling Service

- Applies labels to issues and pull requests
- Respects repository-specific label configurations
- Handles rate limiting and error conditions
- Provides feedback on labeling operations

### 7. Storage Layer

- Primary database for persistent storage of events, labels, and metadata
- Model training data repository for improving AI accuracy
- Backup and archival systems

### 8. API Service

- RESTful interface for external integrations
- Dashboard data provision
- Administrative functions
- Webhook management interface

## Data Flow

1. External system (GitHub/GitLab/Jira) sends webhook event
2. Cloudflare Worker receives and validates webhook
3. Validated event placed in queue
4. Worker processes event from queue
5. Event data sent to AI Processing Service
6. AI service analyzes content and suggests labels
7. Aggregator service combines signals and applies business rules
8. Labeling service applies final labels to issue/PR
9. Results stored in database for analytics and model improvement
10. Feedback loop improves future AI predictions

## Security Considerations

- Webhook signature verification prevents spoofing
- Rate limiting protects against abuse
- Input validation prevents injection attacks
- Secure headers and CSP mitigate client-side attacks
- Principle of least privilege for service accounts
- Regular security audits and dependency updates

## Scalability Features

- Horizontal scaling via Cloudflare Workers global distribution
- Queue buffering handles traffic spikes
- Caching reduces redundant computation
- Database connection pooling
- CDN caching for static assets
- Lazy loading of non-critical features

## Monitoring and Observability

- Structured logging with correlation IDs
- Metrics collection (latency, error rates, throughput)
- Distributed tracing for cross-service requests
- Health check endpoints for all services
- Alerting on anomaly detection
- Performance dashboards

## Failure Handling

- Retry mechanisms with exponential backoff
- Circuit breaker pattern for external dependencies
- Dead letter queues for repeatedly failing items
- Graceful degradation when non-critical services fail
- Backup and disaster recovery procedures
- Chaos engineering for resilience testing

## Technology Choices

### Cloudflare Workers

- Global edge network for low latency
- Automatic scaling without server management
- Generous free tier for development
- Built-in KV storage and R2 object storage
- Workers AI for accessible machine learning

### Turborepo + Bun

- Fast monorepo management
- Efficient package installation and linking
- Parallel task execution
- Consistent development experience

### TypeScript

- Static type safety reduces runtime errors
- Excellent IDE support and refactoring tools
- Self-documenting codebases
- Gradual adoption from JavaScript

### Hono Framework

- Minimal bundle size for fast cold starts
- Middleware architecture for cross-cutting concerns
- Built-in content type handling
- Excellent TypeScript integration

### Vitest

- Fast test execution
- Built-in coverage reporting
- Excellent ESM support
- Compatible with testing-library patterns

### oxlint + oxfmt

- Blazing fast linting and formatting
- Zero-configuration defaults
- Modern JavaScript/TypeScript support
- Consistent code style enforcement
