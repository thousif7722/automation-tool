import { queueManager, QueueJobPayload } from '@insta-automation/queue';
import { workflowEngine } from '@insta-automation/workflows';

export async function processAutomationJob(job: QueueJobPayload<{ workflowRunId: string }>): Promise<void> {
  const { workflowRunId } = job.data || {};
  if (!workflowRunId) return;

  const run = await workflowEngine.resumeWorkflowRun(workflowRunId);
  if (!run) {
    throw new Error(`Workflow run '${workflowRunId}' not found`);
  }

  if (run.status === 'FAILED') {
    throw new Error(`Workflow run '${workflowRunId}' failed: ${run.error}`);
  }
}

export function startAutomationWorker(): void {
  queueManager.registerWorker('automation', processAutomationJob, 10);
}
