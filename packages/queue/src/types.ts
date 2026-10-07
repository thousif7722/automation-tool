export type QueueName =
  | 'instagram-events'
  | 'automation'
  | 'actions'
  | 'messages'
  | 'ai'
  | 'publishing'
  | 'analytics'
  | 'notifications'
  | 'dead-letter';

export interface QueueJobPayload<T = any> {
  jobId: string;
  tenantId: string;
  eventId: string;
  workflowRunId?: string;
  stepExecutionId?: string;
  actionId?: string;
  correlationId: string;
  executionId: string;
  data: T;
  timestamp: number;
}

export interface QueueJobOptions {
  attempts?: number;
  backoffDelayMs?: number;
  timeoutMs?: number;
  priority?: number;
}

export type JobHandler<T = any> = (job: QueueJobPayload<T>) => Promise<any>;
