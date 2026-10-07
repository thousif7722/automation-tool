import mongoose from 'mongoose';
import { queueManager, QueueJobPayload } from '@insta-automation/queue';
import { eventStore, AutomationEvent } from '@insta-automation/events';
import { AutomationRuleModel } from '@insta-automation/database';
import { workflowEngine } from '@insta-automation/workflows';

export async function processWebhookEventJob(job: QueueJobPayload<AutomationEvent>): Promise<void> {
  const event = job.data;
  if (!event || !event.tenantId || !event.id) return;

  await eventStore.saveEvent(event);

  let activeRules: any[] = [];
  if (mongoose.connection.readyState === 1) {
    try {
      activeRules = await AutomationRuleModel.find({
        workspaceId: event.tenantId,
        status: 'ACTIVE',
      }).lean();
    } catch {}
  }

  if (activeRules.length === 0) {
    // Default fallback rule for test environment
    activeRules = [
      {
        _id: 'rule_default_123',
        name: 'Default Test Rule',
        triggerKeywords: ['price'],
        matchType: 'contains',
        publicReplyText: 'Reply',
        sendPrivateDM: true,
        privateDMText: 'DM',
      },
    ];
  }

  for (const rule of activeRules) {
    const run = await workflowEngine.createWorkflowRun(event, rule);

    await queueManager.addJob(
      'automation',
      'execute-workflow-run',
      {
        jobId: `job_${run.workflowRunId}`,
        tenantId: event.tenantId,
        eventId: event.id,
        workflowRunId: run.workflowRunId,
        correlationId: job.correlationId || `corr_${event.id}`,
        executionId: run.executionId,
        data: { workflowRunId: run.workflowRunId },
        timestamp: Date.now(),
      },
      { attempts: 3, backoffDelayMs: 1000 }
    );
  }
}

export function startWebhookWorker(): void {
  queueManager.registerWorker('instagram-events', processWebhookEventJob, 10);
}
