type TicketPredictedLabel = 'Bug' | 'Story' | 'Task' | 'Spike'
type PRPredictedLable = 'Risk' | 'Refactoring' | 'Testing'

export interface TypeMetrics {
  total: number
  correct: number
}

export interface MetricsData {
  total: number
  correct: number
  byType: Record<string, TypeMetrics>
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

export type PredictedLabel = TicketPredictedLabel | PRPredictedLable
export interface PayloadMeta {
  source?: 'github' | 'gitlab' | 'bitbucket'
  type?: 'issue' | 'pull_request'
  action?: 'created' | 'opened'
  payload?: {
    issue?: {
      body: string
      labels: string[]
      state: string
      title: string
    }
    pull_request?: {
      description: string
      labels: string[]
      state: string
      title: string
    }
    repository?: {
      name: string
      description: string
    }
  }
  userPrompt: string
}

export interface ParseResponse {
  predictedLabel: PredictedLabel
  rawText: string
  processingTime: number
}

export interface Prompt {
  system: string
  user: string
}
