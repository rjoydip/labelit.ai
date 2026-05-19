import { Hono } from "hono";
import type { Env } from "./types/env";
import { WebhookHandler } from "./webhook/handler";

const app = new Hono<{ Bindings: Env }>();

app.post("/webhook/events", async (c) => {
  const handler = new WebhookHandler(c.env);
  return handler.handle(c.req.raw);
});

app.get("/", () => new Response("labelit.ai - AI-powered issue labeling"));

export default app;

export {
  AgentCore,
  PiAI,
  createAddLabelsTool,
  createRemoveLabelsTool,
  createAnalyzeContentTool,
} from "./harness";
export type { AgentEvent } from "@earendil-works/pi-agent-core";
export type { Message, Tool } from "@earendil-works/pi-ai";
export type { AIConfig } from "./harness";

export { WebhookHandler } from "./webhook";
export * from "./webhook/validation";
export * from "./webhook/rate-limit";
export * from "./webhook/queue";

export { createGitHubProvider } from "./providers/github";
export type { GitHubProvider } from "./providers/github/types";

export * from "./services";
export * from "./ai/processor";
export { issuePrompt, prPrompt, labelingPrompt } from "./ai/prompts";
export * from "./utils";
export * from "./types";
export * from "./config";