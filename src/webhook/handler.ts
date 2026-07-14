import type { Env } from "../types/env";
import type { PayloadMeta, SyncResult } from "../types/basic";
import { PRAnalyzer, TicketAnalyzer } from "../services";
import { LabelService } from "../services/label.service";
import { createErrorResponse, createSuccessResponse } from "../utils";
import { validateGitHubWebhook } from "./validation";
import { RateLimiter } from "./rate-limit";
import { Queue } from "./queue";
import { DEFAULT_CONFIG } from "../config";

export interface AnalyzeInput {
  type: "issue" | "pull_request";
  title: string;
  body?: string;
  target: string;
}

export interface AnalyzeResult {
  labels: string[];
  confidence: number;
}

export class WebhookHandler {
  private prAnalyzer: PRAnalyzer;
  private ticketAnalyzer: TicketAnalyzer;
  private rateLimiter: RateLimiter;
  private queue: Queue<PayloadMeta>;
  private env: Env;

  constructor(env: Env) {
    this.env = env;
    this.prAnalyzer = new PRAnalyzer(env);
    this.ticketAnalyzer = new TicketAnalyzer(env);
    this.rateLimiter = new RateLimiter(DEFAULT_CONFIG.rateLimit);
    this.queue = new Queue(DEFAULT_CONFIG.retry);
  }

  async analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const userPrompt = `${input.type === "pull_request" ? "PR" : "Issue"} Title: ${input.title}\n${input.body ? `Body: ${input.body}` : ""}`;

    const payload = {
      issue:
        input.type === "issue"
          ? { body: input.body, labels: [], state: "open", title: input.title }
          : undefined,
      pull_request:
        input.type === "pull_request"
          ? { body: input.body, labels: [], state: "open", title: input.title }
          : undefined,
      repository: { name: "", description: "" },
    };

    const promptDetails = this.ticketAnalyzer.getPrompt(userPrompt);
    const classifiedResponse = await this.ticketAnalyzer.classify(promptDetails, payload);
    const response = this.ticketAnalyzer.parseResponse(classifiedResponse);

    return {
      labels: [response.predictedLabel],
      confidence: 0.8,
    };
  }

  private preparePayload(payload: any): PayloadMeta {
    if (Object.hasOwn(payload, "issue")) {
      const {
        action,
        issue: { body, labels, number, state, title },
        repository: { name, full_name, description },
      } = payload;
      return {
        source: "github",
        type: "issue",
        action,
        payload: {
          issue: { body, labels, number, state, title },
          repository: { full_name, name, description },
        },
        userPrompt: "",
      };
    }

    if (Object.hasOwn(payload, "pull_request")) {
      const {
        action,
        pull_request: { body, labels, number, state, title, additions, changed_files, deletions },
        repository: { name, full_name, description },
      } = payload;
      const diffContent = "";
      const calculateDetails = {
        additions: additions || 0,
        changed_files: changed_files || 0,
        deletions: deletions || 0,
        diff_content: diffContent,
        reviewers: [],
      };
      const complexityScore = this.prAnalyzer.calculateComplexity(calculateDetails);
      const riskScore = this.prAnalyzer.calculateRiskScore(calculateDetails);
      return {
        source: "github",
        type: "pull_request",
        action,
        payload: {
          pull_request: { description: body, labels, number, state, title },
          repository: { full_name, name, description },
        },
        userPrompt: `
          Title: ${title}
          Description: ${body}
          PR Analysis:
          - Changed Files: ${changed_files || 0}
          - Additions: ${additions || 0}
          - Deletions: ${deletions || 0}
          - Diff Content: ${diffContent}
          - Complexity Score: ${complexityScore}
          - Risk Score: ${riskScore}
        `,
      };
    }

    return {
      source: "github",
      type: undefined,
      payload: { issue: undefined, repository: undefined },
      userPrompt: "",
    };
  }

  private async validateRequest(req: Request): Promise<boolean> {
    const clientId = req.headers.get("x-forwarded-for") || "unknown";
    const allowed = await this.rateLimiter.isAllowed(clientId);
    if (!allowed) {
      return false;
    }

    const signature = req.headers.get("x-hub-signature-256") ?? null;
    const payload = await req.text();
    const result = await validateGitHubWebhook(
      payload,
      signature,
      process.env.WEBHOOK_SECRET || "",
    );
    return result.valid;
  }

  public async handle(req: Request) {
    try {
      const reqPayload = await req.json();
      const meta: PayloadMeta = this.preparePayload(reqPayload);

      const isValid = await this.validateRequest(req);
      if (!isValid) {
        return createErrorResponse("Rate limit exceeded or invalid signature", 429);
      }

      const promptDetails = this.ticketAnalyzer.getPrompt(meta.userPrompt);
      const classifiedResponse = await this.ticketAnalyzer.classify(promptDetails, meta.payload);
      const response = this.ticketAnalyzer.parseResponse(classifiedResponse);

      let syncResult: SyncResult | undefined;

      if (
        meta.type === "pull_request" &&
        (meta.action === "opened" || meta.action === "synchronize") &&
        this.env.GITHUB_PROVIDER &&
        meta.payload?.pull_request?.number &&
        meta.payload?.repository?.full_name
      ) {
        const [owner, repo] = meta.payload.repository.full_name.split("/");
        const prNumber = meta.payload.pull_request.number;
        const title = meta.payload.pull_request.title;
        const body = meta.payload.pull_request.description || "";

        try {
          const labelService = new LabelService(this.env.GITHUB_PROVIDER, this.env);
          syncResult = await labelService.analyzeAndSyncPR(owner, repo, prNumber, title, body);
        } catch (syncError) {
          console.error("Label sync failed:", syncError);
        }
      }

      return createSuccessResponse({
        ...response,
        syncResult,
      });
    } catch (error) {
      return createErrorResponse(error);
    }
  }
}
