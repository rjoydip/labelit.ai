import { sleep, exponentialBackoff } from "../utils";

export interface QueueConfig {
  maxAttempts: number;
  backoffMs: number;
}

export interface QueuedItem<T> {
  id: string;
  data: T;
  attempts: number;
  lastAttempt?: number;
}

export class Queue<T> {
  private config: QueueConfig;
  private items: Map<string, QueuedItem<T>>;
  private dlq: Map<string, QueuedItem<T>>;

  constructor(config: QueueConfig) {
    this.config = config;
    this.items = new Map();
    this.dlq = new Map();
  }

  async enqueue(id: string, data: T): Promise<void> {
    const item: QueuedItem<T> = {
      id,
      data,
      attempts: 0,
    };
    this.items.set(id, item);
  }

  async process(
    id: string,
    handler: (data: T) => Promise<void>,
  ): Promise<{ success: boolean; error?: string }> {
    const item = this.items.get(id);
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    try {
      await handler(item.data);
      this.items.delete(id);
      return { success: true };
    } catch {
      item.attempts += 1;
      item.lastAttempt = Date.now();

      if (item.attempts >= this.config.maxAttempts) {
        this.items.delete(id);
        this.dlq.set(id, item);
        return { success: false, error: "Max attempts reached" };
      }

      const delay = exponentialBackoff(item.attempts - 1, this.config.backoffMs);
      await sleep(delay);

      return this.process(id, handler);
    }
  }

  getDLQ(): QueuedItem<T>[] {
    return Array.from(this.dlq.values());
  }

  retryFromDLQ(id: string): boolean {
    const item = this.dlq.get(id);
    if (item) {
      item.attempts = 0;
      this.dlq.delete(id);
      this.items.set(id, item);
      return true;
    }
    return false;
  }

  size(): number {
    return this.items.size;
  }

  dlqSize(): number {
    return this.dlq.size;
  }
}
