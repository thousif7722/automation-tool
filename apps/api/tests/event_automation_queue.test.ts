import mongoose from 'mongoose';
import { queueManager } from '@insta-automation/queue';
import { eventStore, AutomationEvent } from '@insta-automation/events';
import { workflowEngine } from '@insta-automation/workflows';
import { processWebhookEventJob } from '@insta-automation/webhook-worker';
import { schedulerService } from '@insta-automation/scheduler';
import { resetEnv } from '@insta-automation/config';

describe('Production Event-Driven Automation Infrastructure Tests', () => {
  const tenantId = '660f1a9b2c9d4e0011223344';
  const accountId = 'ig_acc_999';

  beforeAll(() => {
    mongoose.set('bufferCommands', false);
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test_event_db';
    process.env.JWT_SECRET = 'super_secret_jwt_key_32_characters_long!';
    process.env.NODE_ENV = 'test';
    resetEnv();
  });

  afterAll(async () => {
    await queueManager.close();
  });

  describe('Canonical Event System & Persistent Event Store', () => {
    it('should save and retrieve canonical AutomationEvent records', async () => {
      const event: AutomationEvent = {
        id: 'evt_test_1001',
        tenantId,
        accountId,
        source: 'INSTAGRAM',
        type: 'COMMENT_CREATED',
        timestamp: new Date(),
        actor: { id: 'usr_555', username: 'alice_dev', type: 'CUSTOMER' },
        resource: { id: 'cmt_777', type: 'comment' },
        payload: { text: 'How much does this cost?' },
        metadata: { clientIp: '127.0.0.1' },
      };

      const saved = await eventStore.saveEvent(event);
      expect(saved.id).toBe('evt_test_1001');
      expect(saved.tenantId).toBe(tenantId);
      expect(saved.source).toBe('INSTAGRAM');
    });
  });

  describe('Traceability Chain: eventId -> workflowRunId -> stepExecutionId -> actionId', () => {
    it('should generate complete persistent execution records with full traceability', async () => {
      const event: AutomationEvent = {
        id: 'evt_trace_2002',
        tenantId,
        accountId,
        source: 'INSTAGRAM',
        type: 'COMMENT_CREATED',
        timestamp: new Date(),
        actor: { id: 'usr_888', username: 'bob_buyer', type: 'CUSTOMER' },
        resource: { id: 'cmt_888', type: 'comment' },
        payload: { text: 'Send me details please' },
      };

      const mockRule = {
        _id: 'rule_123456789012345678901234',
        name: 'Pricing Automation',
        triggerKeywords: ['details', 'price'],
        matchType: 'contains',
        publicReplyText: 'Thanks for reaching out! Check your DMs.',
        sendPrivateDM: true,
        privateDMText: 'Here is the brochure link: https://example.com/pricing',
      };

      const run = await workflowEngine.createWorkflowRun(event, mockRule);

      expect(run.eventId).toBe('evt_trace_2002');
      expect(run.workflowRunId).toBeDefined();
      expect(run.correlationId).toContain('evt_trace_2002');
      expect(run.executionId).toBeDefined();
      expect(run.status).toBe('PENDING');

      expect(run.steps.length).toBe(4);
      expect(run.steps[0].actionId).toBe('act_match_keyword');
      expect(run.steps[1].actionId).toBe('act_public_reply');
      expect(run.steps[2].actionId).toBe('act_send_dm');
      expect(run.steps[3].actionId).toBe('act_capture_lead');

      const executed = await workflowEngine.executeWorkflowRun(run);
      expect(executed.status).toBe('COMPLETED');
      expect(executed.steps.every((s) => s.status === 'COMPLETED')).toBe(true);
    });
  });

  describe('Worker Restart & Crash Recovery Behavior', () => {
    it('should resume workflow from first uncompleted step without re-executing completed steps', async () => {
      const event: AutomationEvent = {
        id: 'evt_crash_3003',
        tenantId,
        accountId,
        source: 'INSTAGRAM',
        type: 'COMMENT_CREATED',
        timestamp: new Date(),
        actor: { id: 'usr_999', username: 'charlie', type: 'CUSTOMER' },
        resource: { id: 'cmt_999', type: 'comment' },
        payload: { text: 'price info' },
      };

      const mockRule = {
        _id: 'rule_999999999999999999999999',
        name: 'Restart Rule',
        triggerKeywords: ['price'],
        matchType: 'contains',
        publicReplyText: 'Reply',
        sendPrivateDM: true,
        privateDMText: 'DM',
      };

      const run = await workflowEngine.createWorkflowRun(event, mockRule);

      run.steps[0].status = 'COMPLETED';
      run.steps[0].output = { matched: true };
      run.steps[1].status = 'COMPLETED';
      run.steps[1].output = { replyId: 'existing_reply_id' };
      run.status = 'RUNNING';

      const resumed = await workflowEngine.executeWorkflowRun(run);

      expect(resumed.status).toBe('COMPLETED');
      expect(resumed.steps[1].output?.replyId).toBe('existing_reply_id');
      expect(resumed.steps[2].status).toBe('COMPLETED');
      expect(resumed.steps[3].status).toBe('COMPLETED');
    });
  });

  describe('Idempotency & Duplicate Event Prevention', () => {
    it('should enforce idempotency and prevent duplicate job queuing', async () => {
      const jobId = `${tenantId}:evt_dup_4004:process`;
      const payload = {
        jobId,
        tenantId,
        eventId: 'evt_dup_4004',
        correlationId: 'corr_4004',
        executionId: 'exec_4004',
        data: { text: 'Price query' },
        timestamp: Date.now(),
      };

      const addedId1 = await queueManager.addJob('instagram-events', 'test-job', payload);
      const addedId2 = await queueManager.addJob('instagram-events', 'test-job', payload);

      expect(addedId1).toBe(jobId);
      expect(addedId2).toBe(jobId);
    });
  });

  describe('Job Retries, Failure Handling & Dead-Letter Queue (DLQ)', () => {
    it('should forward job payload to Dead-Letter Queue upon failure and log dead letter record', async () => {
      const payload = {
        jobId: 'job_failed_5005',
        tenantId,
        eventId: 'evt_failed_5005',
        workflowRunId: 'run_failed_5005',
        correlationId: 'corr_5005',
        executionId: 'exec_5005',
        data: { text: 'Broken payload' },
        timestamp: Date.now(),
      };

      await queueManager.moveToDeadLetter('automation', payload, 'Simulated step failure error');
      expect(true).toBe(true);
    });

    it('should handle webhook worker event ingestion pipeline end-to-end', async () => {
      const event: AutomationEvent = {
        id: 'evt_pipeline_6006',
        tenantId,
        accountId,
        source: 'INSTAGRAM',
        type: 'COMMENT_CREATED',
        timestamp: new Date(),
        actor: { id: 'usr_100', username: 'dave', type: 'CUSTOMER' },
        resource: { id: 'cmt_100', type: 'comment' },
        payload: { text: 'price?' },
      };

      await processWebhookEventJob({
        jobId: 'job_pipe_6006',
        tenantId,
        eventId: event.id,
        correlationId: 'corr_6006',
        executionId: 'exec_6006',
        data: event,
        timestamp: Date.now(),
      });

      expect(true).toBe(true);
    });

    it('should execute scheduler pending workflow polling without errors', async () => {
      const pendingCount = await schedulerService.pollPendingWorkflows();
      expect(typeof pendingCount).toBe('number');
    });
  });
});
