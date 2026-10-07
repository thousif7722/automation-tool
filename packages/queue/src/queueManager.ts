import mongoose from 'mongoose';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { getEnv } from '@insta-automation/config';
import { DeadLetterJobModel } from '@insta-automation/database';
import type { QueueName, QueueJobPayload, QueueJobOptions, JobHandler } from './types';

export class QueueManager {
  private queues: Map<QueueName, Queue> = new Map();
  private workers: Map<QueueName, Worker> = new Map();
  private inMemoryJobs: Map<QueueName, QueueJobPayload[]> = new Map();
  private memoryHandlers: Map<QueueName, JobHandler> = new Map();
  private isMemoryMode = false;
  private redisConnection: any = null;

  constructor() {
    let host = '';
    let port = 6379;
    let password: string | undefined = undefined;

    try {
      if (process.env.NODE_ENV === 'test') {
        this.isMemoryMode = true;
        return;
      }
      const env = getEnv();
      host = env.REDIS_HOST;
      port = env.REDIS_PORT;
      password = env.REDIS_PASSWORD;
    } catch {
      this.isMemoryMode = true;
      return;
    }

    if (!host || host === 'localhost_disabled') {
      this.isMemoryMode = true;
    } else {
      try {
        this.redisConnection = new Redis({
          host,
          port,
          password,
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        });
        this.redisConnection.on('error', () => {
          this.isMemoryMode = true;
        });
      } catch {
        this.isMemoryMode = true;
      }
    }
  }

  public async addJob<T = any>(
    queueName: QueueName,
    name: string,
    payload: QueueJobPayload<T>,
    opts?: QueueJobOptions
  ): Promise<string> {
    const jobId = payload.jobId || `${payload.tenantId}:${payload.eventId}:${name}`;
    payload.jobId = jobId;

    if (this.isMemoryMode) {
      if (!this.inMemoryJobs.has(queueName)) {
        this.inMemoryJobs.set(queueName, []);
      }
      const queueList = this.inMemoryJobs.get(queueName)!;

      if (!queueList.some((j) => j.jobId === jobId)) {
        queueList.push(payload);
        setImmediate(() => this.processMemoryJobs(queueName));
      }
      return jobId;
    }

    try {
      let queue = this.queues.get(queueName);
      if (!queue) {
        queue = new Queue(queueName, { connection: this.redisConnection });
        this.queues.set(queueName, queue);
      }

      const attempts = opts?.attempts ?? 3;
      const backoffDelay = opts?.backoffDelayMs ?? 1000;

      await queue.add(name, payload, {
        jobId,
        attempts,
        backoff: {
          type: 'exponential',
          delay: backoffDelay,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });

      return jobId;
    } catch {
      this.isMemoryMode = true;
      return this.addJob(queueName, name, payload, opts);
    }
  }

  public registerWorker<T = any>(
    queueName: QueueName,
    handler: JobHandler<T>,
    concurrency = 5
  ): void {
    this.memoryHandlers.set(queueName, handler);

    if (!this.isMemoryMode && this.redisConnection) {
      try {
        const worker = new Worker(
          queueName,
          async (job) => {
            return handler(job.data);
          },
          {
            connection: this.redisConnection,
            concurrency,
          }
        );

        worker.on('failed', async (job, err) => {
          if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
            await this.moveToDeadLetter(queueName, job.data, err.message, err.stack);
          }
        });

        this.workers.set(queueName, worker);
      } catch {
        this.isMemoryMode = true;
      }
    }
  }

  public async moveToDeadLetter(
    queueName: QueueName,
    payload: QueueJobPayload,
    failedReason: string,
    stackTrace?: string
  ): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      try {
        await DeadLetterJobModel.create({
          jobId: payload.jobId,
          queueName,
          workspaceId: payload.tenantId,
          eventId: payload.eventId,
          workflowRunId: payload.workflowRunId,
          payload: payload.data || payload,
          failedReason,
          stackTrace,
          failedAt: new Date(),
        });
      } catch {
        // Ignore if database error in mock mode
      }
    }

    if (queueName !== 'dead-letter') {
      await this.addJob('dead-letter', 'dead-letter-job', payload);
    }
  }

  private async processMemoryJobs(queueName: QueueName): Promise<void> {
    const jobs = this.inMemoryJobs.get(queueName);
    const handler = this.memoryHandlers.get(queueName);

    if (!jobs || jobs.length === 0 || !handler) return;

    const job = jobs.shift();
    if (!job) return;

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let lastError: any = null;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        await handler(job);
        success = true;
      } catch (err: any) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 50));
      }
    }

    if (!success && lastError) {
      await this.moveToDeadLetter(queueName, job, lastError.message || 'Job execution failed', lastError.stack);
    }
  }

  public async close(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
    if (this.redisConnection && typeof this.redisConnection.quit === 'function') {
      await this.redisConnection.quit();
    }
  }
}

export const queueManager = new QueueManager();
