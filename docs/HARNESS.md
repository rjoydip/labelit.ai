# Harness

PI tools integration for AI-powered labeling with agent runtime and custom tools.

## Overview

The harness provides unified AI orchestration using `@earendil-works/pi-ai` for LLM calls and `@earendil-works/pi-agent-core` for agent runtime.

## Components

### AgentCore

The main agent class for running AI-powered workflows:

```typescript
import { AgentCore } from "./harness";
import { streamSimple } from "@earendil-works/pi-ai";

const agent = new AgentCore({
  tools: [],
  systemPrompt: "You are a labeling assistant",
  getApiKey: (provider) => process.env.PI_API_KEY,
});

await agent.run("Analyze this issue and suggest labels");
```

### PiAI

Configuration class for LLM providers:

```typescript
import { PiAI } from "./harness";

const ai = new PiAI({
  provider: "openai",
  apiKey: process.env.PI_API_KEY,
  model: "gpt-4o-mini",
});

ai.createStreamFn(); // Returns streamSimple
```

## Custom Tools

### createAddLabelsTool

Creates a tool for adding labels to issues or PRs:

```typescript
import { createAddLabelsTool, AgentCore } from "./harness";

const addTool = createAddLabelsTool(async (target, labels) => {
  console.log(`Adding ${labels} to ${target}`);
});

const agent = new AgentCore({
  tools: [addTool],
});
```

**Parameters:**
- `target` (string): Issue/PR identifier in format `owner/repo#number`
- `labels` (string[]): Labels to add

**Returns:**
```typescript
{
  content: [{ type: "text", text: '{"success": true, "target": "...", "labels": [...] }],
  details: { success: true, target: "...", labels: [...] }
}
```

### createRemoveLabelsTool

Creates a tool for removing labels from issues or PRs:

```typescript
import { createRemoveLabelsTool } from "./harness";

const removeTool = createRemoveLabelsTool(async (target, labels) => {
  console.log(`Removing ${labels} from ${target}`);
});
```

**Parameters:**
- `target` (string): Issue/PR identifier
- `labels` (string[]): Labels to remove

### createAnalyzeContentTool

Creates a tool that analyzes content and suggests labels based on keywords:

```typescript
import { createAnalyzeContentTool } from "./harness";

const analyzeTool = createAnalyzeContentTool();
```

**Parameters:**
- `title` (string): Issue or PR title
- `body` (string, optional): Issue or PR body
- `type` ("issue" | "pull_request"): Content type

**Label Rules:**

| Keyword | Label |
|---------|-------|
| bug, fix, error, crash | type:bug |
| feat, add, implement | type:feature |
| refactor | type:refactoring |
| test, coverage | type:test |
| doc, readme | type:documentation |
| critical, urgent | priority:high |
| low priority | priority:low |
| breaking, major (PR only) | breaking:yes |

**Default:** priority:medium

## Agent Events

Subscribe to agent lifecycle events:

```typescript
const agent = new AgentCore({ tools: [] });

agent.subscribe((event, signal) => {
  if (event.type === "agent_end") {
    console.log("Agent finished with", event.messages.length, "messages");
  }
  if (event.type === "tool_execution_end") {
    console.log("Tool", event.toolName, "completed");
  }
});
```

**Event Types:**
- `agent_start` - Agent begins processing
- `agent_end` - Agent finishes (includes final messages)
- `turn_start` - New turn begins
- `turn_end` - Turn completes
- `message_start` - Message begins
- `message_update` - Message updates (streaming)
- `message_end` - Message completes
- `tool_execution_start` - Tool execution begins
- `tool_execution_end` - Tool execution completes

## Configuration

```typescript
interface AIConfig {
  provider: "openai" | "anthropic" | "google" | "local";
  apiKey: string;
  model?: string;
  baseURL?: string;
}
```

## Supported Providers

| Provider | API Endpoint | Models |
|----------|--------------|--------|
| OpenAI | `api.openai.com/v1` | GPT-4, GPT-3.5, o1, o3 |
| Anthropic | `api.anthropic.com/v1` | Claude 3.5, Claude 3, Opus |
| Google | `generativelanguage.googleapis.com/v1` | Gemini 1.5, Gemini 2.0 |
| Local | Custom | vLLM, Ollama |

## Example Usage

```typescript
import { AgentCore, createAddLabelsTool, createRemoveLabelsTool, createAnalyzeContentTool } from "./harness";

const agent = new AgentCore({
  tools: [
    createAnalyzeContentTool(),
    createAddLabelsTool(async (target, labels) => {
      // Add labels via provider
    }),
    createRemoveLabelsTool(async (target, labels) => {
      // Remove labels via provider
    }),
  ],
  systemPrompt: "You are a helpful labeling assistant.",
  getApiKey: (provider) => process.env.PI_API_KEY,
});

await agent.run("Please analyze this issue and add appropriate labels:");
```

## Stream Function

The harness uses `streamSimple` from PI tools for LLM communication:

```typescript
import { streamSimple } from "@earendil-works/pi-ai";

// Used internally by AgentCore
const streamFn = streamSimple;
```

## State Management

Access agent state:

```typescript
const agent = new AgentCore({ ... });

console.log(agent.state.messages); // Conversation history
console.log(agent.state.tools);      // Available tools
console.log(agent.state.isStreaming); // Processing status
```

## Abort Control

Cancel ongoing operations:

```typescript
const agent = new AgentCore({ ... });

// Start processing
agent.run("...");

// Cancel
agent.abort();

// Wait for cleanup
await agent.waitForIdle();
```