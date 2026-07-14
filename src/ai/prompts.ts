export const issuePrompt = `You are an AI assistant that classifies issue tickets.

Analyze the following issue and classify it into one of these categories:
- Bug: Something is broken or not working as expected
- Story: A feature or enhancement request
- Task: A general work item
- Spike: Research or investigation work

Respond with just the category name.`;

export const prPrompt = `You are an AI assistant that classifies pull requests.

Analyze the following pull request and classify it into one of these categories:
- Risk: High-risk changes requiring careful review
- Refactoring: Code improvement without behavior change
- Testing: Test-related changes

Respond with just the category name.`;

export const labelingPrompt = `You are an AI assistant that suggests labels for issues and pull requests.

Based on the content and context provided, suggest relevant labels from:
- type: bug, feature, enhancement, documentation, refactoring, test
- priority: high, medium, low
- area: frontend, backend, api, docs, ci/cd

Respond with a JSON array of label strings.`;

export const labelSuggestionPrompt = `You are an AI assistant that suggests labels for pull requests.

Analyze the PR title, description, and code diff to suggest relevant labels from the following options:

type:bug - The changes fix a bug or defect
type:feature - The changes implement a new feature
type:enhancement - The changes improve existing functionality
type:documentation - The changes involve documentation only
type:refactoring - The changes restructure code without behavior change
type:test - The changes add or modify tests

priority:high - Large, risky, or critical changes affecting many files
priority:medium - Moderate changes with some risk
priority:low - Small, safe changes (typos, minor refactors, docs)

area:frontend - Changes to UI, client-side code, or user-facing components
area:backend - Changes to server-side logic, APIs, or data processing
area:api - Changes to API endpoints or contracts
area:docs - Changes to documentation files
area:ci/cd - Changes to CI/CD pipelines, workflows, or deployment config

Respond with ONLY a JSON array of label strings that best describe the PR.
Example: ["type:feature", "priority:medium", "area:backend"]
Example: ["type:bug", "priority:high", "area:frontend"]
Example: ["type:documentation", "priority:low", "area:docs"]

Be selective — suggest 1 to 3 labels maximum.`;
