#!/usr/bin/env bun

import { parseArgs } from "util";
import { ServerManager } from "./server";
import { createAPIClient } from "./client";
import type { CLIOptions } from "./types";

const COMMANDS = {
  start: "Start the local labelit.ai server",
  stop: "Stop the local labelit.ai server",
  status: "Show server status",
  analyze: "Analyze an issue or PR and suggest labels",
  "add-labels": "Add labels to an issue or PR",
  "remove-labels": "Remove labels from an issue or PR",
  help: "Show this help message",
} as const;

type Command = keyof typeof COMMANDS;

const logo = `
╔═══════════════════════════════════════╗
║          labelit.ai CLI               ║
║     AI-powered issue labeling         ║
╚═══════════════════════════════════════╝
`;

async function showHelp() {
  console.log(logo);
  console.log("Usage: labelit <command> [options]\n");
  console.log("Commands:");
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(14)} ${desc}`);
  }
  console.log("\nOptions:");
  console.log("  --api-url <url>    API server URL (default: http://localhost:8787)");
  console.log("  --api-key <key>    API authentication key");
  console.log("  --json             Output as JSON");
  console.log("  --verbose          Verbose output");
}

async function handleStart(_args: string[], options: CLIOptions) {
  const port = parseInt(options.apiUrl?.split(":").pop() || "8787", 10);
  await ServerManager.start({ port });
}

async function handleStop(_args: string[], _options: CLIOptions) {
  await ServerManager.stop();
}

async function handleStatus(_args: string[], options: CLIOptions) {
  const status = await ServerManager.status();

  if (options.json) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (!status.running) {
    console.log("Server is not running");
    return;
  }

  console.log(`Server running at ${status.url}`);
  console.log(`PID: ${status.pid}`);
  console.log(`Started: ${new Date(status.startedAt!).toLocaleString()}`);
}

async function handleAnalyze(args: string[], options: CLIOptions) {
  const target = args[0];
  if (!target) {
    console.error("Error: target required (owner/repo#number)");
    process.exit(1);
  }

  const [ownerRepo, number] = target.split("#");
  if (!ownerRepo || !number) {
    console.error("Error: target must be in format owner/repo#number");
    process.exit(1);
  }

  const title = args[1] || "";
  const body = args[2] || "";

  const client = await createAPIClient(options.apiUrl, options.apiKey);

  try {
    const result = await client.analyze({
      type: target.includes("/pull/") ? "pull_request" : "issue",
      title,
      body,
      target,
    });

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("Suggested labels:", result.labels.join(", "));
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.error("Analysis failed:", error);
    process.exit(1);
  }
}

async function handleAddLabels(args: string[], options: CLIOptions) {
  const target = args[0];
  const labels = args.slice(1);

  if (!target || labels.length === 0) {
    console.error("Error: target and labels required");
    console.error("Usage: labelit add-labels owner/repo#123 label1 label2");
    process.exit(1);
  }

  const client = await createAPIClient(options.apiUrl, options.apiKey);

  try {
    const result = await client.addLabels(target, labels);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Added labels to ${target}: ${labels.join(", ")}`);
    }
  } catch (error) {
    console.error("Failed to add labels:", error);
    process.exit(1);
  }
}

async function handleRemoveLabels(args: string[], options: CLIOptions) {
  const target = args[0];
  const labels = args.slice(1);

  if (!target || labels.length === 0) {
    console.error("Error: target and labels required");
    console.error("Usage: labelit remove-labels owner/repo#123 label1 label2");
    process.exit(1);
  }

  const client = await createAPIClient(options.apiUrl, options.apiKey);

  try {
    const result = await client.removeLabels(target, labels);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Removed labels from ${target}: ${labels.join(", ")}`);
    }
  } catch (error) {
    console.error("Failed to remove labels:", error);
    process.exit(1);
  }
}

const HANDLERS: Record<Command, (args: string[], options: CLIOptions) => Promise<void>> = {
  start: handleStart,
  stop: handleStop,
  status: handleStatus,
  analyze: handleAnalyze,
  "add-labels": handleAddLabels,
  "remove-labels": handleRemoveLabels,
  help: async () => showHelp(),
};

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      "api-url": { type: "string", short: "u" },
      "api-key": { type: "string", short: "k" },
      json: { type: "boolean", short: "j", default: false },
      verbose: { type: "boolean", short: "v", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  const command = (positionals[0] || "help") as Command;
  const args = positionals.slice(1);

  if (values.help) {
    await showHelp();
    return;
  }

  const options: CLIOptions = {
    apiUrl: values["api-url"],
    apiKey: values["api-key"],
    verbose: values.verbose,
    json: values.json,
  };

  if (command === "help") {
    await showHelp();
    return;
  }

  const handler = HANDLERS[command];
  if (!handler) {
    console.error(`Unknown command: ${command}`);
    console.error(`Run 'labelit help' for usage information`);
    process.exit(1);
  }

  await handler(args, options);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
