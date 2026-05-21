# Integration Test Plan for labelit.ai

## Overview

This document outlines a comprehensive testing strategy for the labelit.ai codebase, focusing on integration tests and identifying gaps in unit test coverage.

## Integration Test Plan

### 1. API Endpoint Integration Tests

Create tests in `tests/integration/api.integration.ts`:

**Endpoints to test:**

- `GET /api/status` - Basic health check
- `POST /api/labels/add` - Adding labels to GitHub resources
- `POST /api/labels/remove` - Removing labels from GitHub resources
- `POST /api/analyze` - Analyzing issues/PRs for label suggestions
- `POST /webhook/events` - Main webhook endpoint (most critical)
- `GET /` - Root endpoint

**Test scenarios per endpoint:**

- Valid requests with expected responses
- Invalid/missing payloads (400 errors)
- Authentication/authorization failures (401/403)
- Provider not configured errors (500)
- External service failures (500 from GitHub provider)
- Rate limiting scenarios (429)
- Signature validation failures

### 2. Webhook Integration Tests

Create tests in `tests/integration/webhook.integration.ts`:

**Focus areas:**

- Full webhook processing flow from request to analysis
- Different event types (issues, pull_requests)
- Various GitHub webhook payloads
- Rate limiting integration
- Signature validation integration
- Queue processing for retries

### 3. Environment Integration Tests

Test in `tests/integration/env.integration.ts`:

**Focus areas:**

- Environment variable handling
- Missing required variables
- Configuration validation
- Different environment scenarios (dev, test, prod)

## Missing Unit Test Coverage

### 1. Webhook Handler (`src/webhook/handler.ts`)

**Missing tests:**

- `analyze()` method edge cases:
  - Empty title/body
  - Very long inputs
  - Special characters in inputs
  - Different type values (issue vs pull_request)
- `preparePayload()` method:
  - Malformed payloads
  - Missing repository information
  - Unknown event types
  - Null/undefined values in payload
- `validateRequest()` method:
  - Rate limiter edge cases (exactly at limit, burst traffic)
  - Missing headers
  - Various signature formats
- `handle()` method:
  - Invalid JSON payloads
  - Network errors during processing
  - Timeout scenarios

### 2. Webhook Validation (`src/webhook/validation.ts`)

**Missing tests:**

- `validateGitHubWebhook()`:
  - Empty payload
  - Empty secret
  - Various signature formats (sha256=, sha1=, etc.)
  - Timing attack safety
  - Different hash algorithms

### 3. Main Application (`src/index.ts`)

**Missing tests:**

- Route handler error boundaries
- Middleware execution order
- CORS handling
- Content-Type validation
- Request size limits

### 4. Services Layer

**Missing tests in PR/Ticket analyzers:**

- Edge cases in classification logic
- Confidence score calculations
- Fallback behaviors when AI service fails
- Cache hits/misses scenarios

## Specific Edge Cases to Cover

### Input Validation Edge Cases:

1. Extremely long strings (DoS protection)
2. Unicode and special characters
3. SQL injection attempts (though not directly applicable)
4. XSS attempt strings
5. Null bytes in strings
6. Array instead of string inputs
7. Deeply nested objects

### Business Logic Edge Cases:

1. Concurrent webhook processing
2. Duplicate event handling
3. Partial GitHub API responses
4. Network timeouts during GitHub calls
5. AI service unavailable scenarios
6. Rate limit recovery scenarios
7. Webhook secret rotation

### State Management Edge Cases:

1. KV storage failures
2. Cache corruption scenarios
3. Memory leaks in long-running processes
4. Graceful degradation when dependencies fail

## Recommended Test Structure

```
tests/
├── integration/
│   ├── api.integration.ts
│   ├── webhook.integration.ts
│   └── env.integration.ts
├── unit/
│   ├── webhook/
│   │   ├── handler.unit.ts
│   │   └── validation.unit.ts
│   ├── services/
│   │   ├── analyzer/
│   │   │   ├── pr-analyzer.unit.ts
│   │   │   └── ticket-analyzer.unit.ts
│   │   └── feedback.unit.ts
│   └── index.unit.ts
└── fixtures/
    ├── webhook-payloads/
    │   ├── issues/
    │   └── pull-requests/
    └── github-responses/
```

## Implementation Priority

1. **High Priority**: Webhook handler unit tests (core functionality)
2. **Medium Priority**: API integration tests (user-facing functionality)
3. **Low Priority**: Edge case unit tests in analyzers (refinement)

This plan ensures comprehensive coverage while focusing on the most critical paths first. The integration tests will catch system-level issues, while the unit tests will ensure individual components handle edge cases correctly.
