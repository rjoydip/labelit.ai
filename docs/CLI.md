# CLI

Command-line interface for labelit.ai to manage labels on GitHub issues and pull requests.

## Installation

```bash
bun install
bun link
```

## Commands

| Command         | Description                         |
| --------------- | ----------------------------------- |
| `start`         | Start local labelit.ai server       |
| `stop`          | Stop local server                   |
| `status`        | Show server status                  |
| `analyze`       | Analyze issue/PR and suggest labels |
| `add-labels`    | Add labels to issue/PR              |
| `remove-labels` | Remove labels from issue/PR         |

## Usage

### Start Server

```bash
labelit start
# Or with custom port
labelit start --api-url http://localhost:9000
```

### Analyze

```bash
labelit analyze owner/repo#123 --title "Bug in login" --body "Fixes the login issue"
```

### Add Labels

```bash
labelit add-labels owner/repo#123 bug priority:high
```

### Remove Labels

```bash
labelit remove-labels owner/repo#123 wontfix
```

## Options

| Option          | Description            | Default                 |
| --------------- | ---------------------- | ----------------------- |
| `--api-url, -u` | API server URL         | `http://localhost:8787` |
| `--api-key, -k` | API authentication key | -                       |
| `--json, -j`    | Output as JSON         | `false`                 |
| `--verbose, -v` | Verbose output         | `false`                 |

## Environment Variables

| Variable          | Description            |
| ----------------- | ---------------------- |
| `LABELIT_API_URL` | API server URL         |
| `LABELIT_API_KEY` | API authentication key |

## GitHub Actions

```yaml
- name: Analyze issue
  uses: rjoydip/labelit.ai/labelit@v0.0.2
  with:
    action: analyze
    target: owner/repo#123
  env:
    LABELIT_API_KEY: ${{ secrets.LABELIT_API_KEY }}
```

## GitHub CLI Extension

After installing the extension:

```bash
gh labelit analyze owner/repo#123
gh labelit add-labels owner/repo#123 bug
```
