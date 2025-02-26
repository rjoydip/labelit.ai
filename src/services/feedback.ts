import type { FeedbackData, MetricsData } from '@/types'
import type { KVNamespace } from '@cloudflare/workers-types'

export class FeedbackService {
  private kv: KVNamespace

  constructor(kv: KVNamespace) {
    this.kv = kv
  }

  async submitFeedback(data: FeedbackData): Promise<void> {
    const key = `feedback:${data.ticketId}`
    await this.kv.put(key, JSON.stringify(data))

    // Update accuracy metrics
    await this.updateAccuracyMetrics(data)

    // If prediction was wrong, store for retraining
    if (!data.wasCorrect) {
      await this.storeForRetraining(data)
    }
  }

  private async updateAccuracyMetrics(data: FeedbackData): Promise<void> {
    const metricsKey = `metrics:${new Date().toISOString().split('T')[0]}`
    const metrics: MetricsData = await this.kv.get(metricsKey, 'json') || {
      total: 0,
      correct: 0,
      byType: {} as Record<string, { total: number, correct: number }>,
    }

    metrics.total += 1
    if (data.wasCorrect)
      metrics.correct += 1

    // Update per-type metrics
    if (!metrics.byType[data.actualLabel]) {
      metrics.byType[data.actualLabel] = { total: 0, correct: 0 }
    }
    metrics.byType[data.actualLabel].total += 1
    if (data.wasCorrect) {
      metrics.byType[data.actualLabel].correct += 1
    }

    await this.kv.put(metricsKey, JSON.stringify(metrics))
  }

  private async storeForRetraining(data: FeedbackData): Promise<void> {
    const retrainingKey = `retraining:${data.ticketId}`
    await this.kv.put(retrainingKey, JSON.stringify(data))
  }
}
