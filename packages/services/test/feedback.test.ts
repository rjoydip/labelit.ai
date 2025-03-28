import type { FeedbackData } from '@labelit/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedbackService } from '../src/feedback'

describe('feedbackService', () => {
  let feedbackService: FeedbackService
  let mockKV: any

  beforeEach(() => {
    mockKV = {
      put: vi.fn(),
      get: vi.fn(),
    }
    feedbackService = new FeedbackService(mockKV)
  })

  it('should submit feedback correctly', async () => {
    const feedback: FeedbackData = {
      ticketId: '123',
      predictedLabel: 'Bug',
      actualLabel: 'Story',
      wasCorrect: false,
      timestamp: new Date().toISOString(),
      userId: 'user1',
    }

    await feedbackService.submitFeedback(feedback)
    expect(mockKV.put).toHaveBeenCalled()
  })
})
