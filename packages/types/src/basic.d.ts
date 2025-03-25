import type { Ai, KVNamespace } from '@cloudflare/workers-types'

// Define the structure for per-type metrics
export interface TypeMetrics {
  total: number
  correct: number
}

// Define the complete metrics structure
export interface MetricsData {
  total: number
  correct: number
  byType: Record<string, TypeMetrics>
}

export interface Bindings {
  KV: KVNamespace<string>
  AI: Ai
}

export interface FeedbackData {
  ticketId: string
  predictedLabel: string
  actualLabel: string
  wasCorrect: boolean
  timestamp: string
  userId: string
}

export interface ClassificationType {
  text: string
  processingTime: number
}

type TicketPredictedLabel = 'Bug' | 'Story' | 'Task' | 'Spike'
type PRPredictedLable = 'Risk' | 'Refactoring' | 'Testing'

export type PredictedLabel = TicketPredictedLabel | PRPredictedLable
export type HandlerSource = 'github' | 'gitlab' | 'jira'
export type HandlerType = 'issue' | 'pr'

export interface ParseResponse {
  predictedLabel: PredictedLabel
  rawText: string
  processingTime: number
}

export interface PromptResponse {
  system: string
  user: string
}
