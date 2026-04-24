# Contributing to labelit.ai

Thank you for considering contributing to labelit.ai! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible.

### Suggesting Features

Feature requests are welcome. Please make sure your suggestion aligns with the project's goals and roadmap.

### Pull Requests

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints (using `bun run lint`).
6. Format your code (using `bun run format`).
7. Issue that pull request!

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (version 1.1.3 or later)
- Node.js 18+ (for compatibility)
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/labelit.ai.git
   cd labelit.ai
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

### Development Commands

- `bun run dev` - Start development mode for all packages
- `bun run lint` - Run linter
- `bun run format` - Format code
- `bun run test` - Run tests
- `bun run typecheck` - Type check all packages

## Code Style

labelit.ai uses oxlint for linting and oxfmt for formatting. Please make sure your code passes both checks before submitting a pull request.

### Linting

Run the linter with:

```bash
bun run lint
```

### Formatting

Format your code with:

```bash
bun run format
```

## Writing Tests

We use Vitest for testing. When adding new features, please include appropriate test coverage.

To run tests:

```bash
bun run test
```

## Documentation

Please update the documentation when adding or modifying features. Documentation lives in the `/docs` directory.

## License

By contributing to labelit.ai, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue or reach out to the maintainers if you have any questions.
