#!/usr/bin/env bash
# Setup script for labelit.ai development environment

set -euo pipefail

echo "Setting up labelit.ai development environment..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: bun is not installed. Please install bun first:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
bun install

# Verify installation
echo "Verifying installation..."
bun run typecheck
echo "Type check passed!"

echo "Setup complete! You can now run:"
echo "  bun run dev    # Start development server"
echo "  bun run lint   # Run linter"
echo "  bun run test   # Run tests"