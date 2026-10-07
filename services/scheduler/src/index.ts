import mongoose from 'mongoose';
import { queueManager } from '@insta-automation/queue';
import { WorkflowRunModel } from '@insta-automation/database';

export class SchedulerService {
  private timer: NodeJS.Timeout | null = null;

  public start(intervalMs = 10000): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.pollPendingWorkflows(), intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async pollPendingWorkflows(): Promise<number> {
    if (mongoose.connection.readyState !== 1) {
      return 0;
    }

    try {
      const pendingRuns = await WorkflowRunModel.find({
        status: 'WAITING',
      }).limit(50).lean();

      for (const run of pendingRuns) {
        await queueManager.addJob(
          'automation',
          'resume-waiting-workflow',
          {
            jobId: `job_resume_${run.workflowRunId}`,
            tenantId: run.workspaceId.toString(),
            eventId: run.eventId,
            workflowRunId: run.workflowRunId,
            correlationId: run.correlationId,
            executionId: run.executionId,
            data: { workflowRunId: run.workflowRunId },
            timestamp: Date.now(),
          }
        );
      }

      return pendingRuns.length;
    } catch {
      return 0;
    }
  }
}

export const schedulerService = new SchedulerService();
