import { ProcessedEventModel } from '@insta-automation/database';

export class EventDeduplicator {
  private memoryCache: Set<string> = new Set();
  private maxMemorySize = 10000;
  private redisClient: any = null;

  constructor(redisClient?: any) {
    if (redisClient) this.redisClient = redisClient;
  }

  public setRedisClient(redis: any): void {
    this.redisClient = redis;
  }

  public async isDuplicate(workspaceId: string, eventId: string): Promise<boolean> {
    const cacheKey = `dedup:${workspaceId}:${eventId}`;

    if (this.memoryCache.has(cacheKey)) {
      return true;
    }

    if (this.redisClient) {
      try {
        const exists = await this.redisClient.get(cacheKey);
        if (exists) {
          this.addToMemory(cacheKey);
          return true;
        }
      } catch (err) {
        // Fall through to DB check
      }
    }

    try {
      const existing = await ProcessedEventModel.findOne({ workspaceId, eventId }).lean();
      if (existing) {
        this.addToMemory(cacheKey);
        return true;
      }
    } catch (err: any) {
      // Fall through
    }

    return false;
  }

  public async markProcessed(
    workspaceId: string,
    eventId: string,
    accountId: string,
    eventType: string
  ): Promise<boolean> {
    const cacheKey = `dedup:${workspaceId}:${eventId}`;
    this.addToMemory(cacheKey);

    if (this.redisClient) {
      try {
        const setOk = await this.redisClient.set(cacheKey, '1', 'EX', 86400, 'NX');
        if (!setOk) {
          return false;
        }
      } catch (err) {
        // Fall through
      }
    }

    try {
      await ProcessedEventModel.create({
        workspaceId,
        eventId,
        accountId,
        eventType,
        processedAt: new Date(),
      });
      return true;
    } catch (err: any) {
      if (err.code === 11000) {
        return false;
      }
      return true;
    }
  }

  public clearMemory(): void {
    this.memoryCache.clear();
  }

  private addToMemory(key: string): void {
    if (this.memoryCache.size >= this.maxMemorySize) {
      const first = this.memoryCache.values().next().value;
      if (first) this.memoryCache.delete(first);
    }
    this.memoryCache.add(key);
  }
}

export const eventDeduplicator = new EventDeduplicator();
