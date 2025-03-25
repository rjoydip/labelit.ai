import type { Source } from './basic'

export interface TicketData {
  id: string
  title: string
  description: string
  source: Source
  createdAt: string
  metadata: {
    labels?: string[]
    assignee?: string
    priority?: string
    [key: string]: any
  }
}
