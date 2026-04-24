# Code Quality Dashboard

Labelit.ai provides a code quality dashboard to monitor the health of the codebase. This document explains how to use the dashboard and interpret its results.

## Overview

The code quality dashboard provides insights into:

- Test results and coverage
- Type checking status
- Linting results
- Overall code health

## Usage

To run the code quality dashboard, execute:

```bash
bun run scripts/dashboard.sh
```

This will run:

1. Test suite (`bun run test`)
2. Type checking (`bun run typecheck`)
3. Linting (`bun run lint`)
4. Display coverage information if available

## Metrics Explained

### Test Results

Shows whether tests are passing, failing, or if there were issues running the test suite.

### Type Checking

Indicates if there are any TypeScript type errors in the codebase.

### Linting

Shows if the code follows the established code style rules (using oxlint).

### Coverage

If tests have been run with coverage enabled, shows the location of coverage reports.

## Interpreting Results

Each section will show:

- ✅ Success: The check passed
- ⚠️ Warnings: The check completed but had issues
- ❌ Failure: The check failed

## Generating Coverage Reports

To generate detailed coverage reports:

```bash
# For the services package (where most tests are located)
cd packages/services
bun run test -- --coverage
```

Coverage reports will be available in:

- `packages/services/coverage/` directory
- Multiple formats: text, JSON, and HTML

## Integrating with CI

The dashboard mirrors what runs in the CI pipeline:

- Tests run on every push and pull request
- Type checking ensures type safety
- Linting maintains code quality standards
- Coverage helps identify untested code paths

## Customization

The dashboard script (`./scripts/code-quality.ts`) can be modified to:

- Add additional quality checks
- Change output formatting
- Integrate with external quality metrics tools
- Adjust which packages are checked

## Best Practices

1. Run the dashboard before submitting pull requests
2. Address any failures warnings before merging code
3. Monitor trends in test coverage over time
4. Keep linting and type checking clean to maintain code quality

## Troubleshooting

If the dashboard shows errors:

1. Check that all dependencies are installed: `bun install`
2. Verify you're running from the repository root
3. Check individual commands for more specific error messages
4. Consult the CONTRIBUTING.md for development setup instructions

## Related Documentation

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Architecture](./ARCHITECTURE.md)
- [Development Setup](./CONTRIBUTING.md#development-setup)
