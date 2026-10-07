import mongoose from 'mongoose';
import {
  WorkflowRunModel,
  AutomationRuleModel,
  LeadModel,
  MessageModel,
  WorkflowExecutionModel,
  IWorkflowRunDocument,
  IStepExecution,
  WorkflowRunState,
} from '@insta-automation/database';
import { generateId, matchCommentKeyword } from '@insta-automation/utils';
import { InstagramApiClient } from '@insta-automation/instagram';
import type { AutomationEvent } from '@insta-automation/events';

export interface WorkflowEngineOptions {
  instagramClient?: InstagramApiClient;
}

export class WorkflowEngine {
  private instagramClient: InstagramApiClient;

  constructor(options?: WorkflowEngineOptions) {
    this.instagramClient = options?.instagramClient || new InstagramApiClient();
  }

  public async createWorkflowRun(
    event: AutomationEvent,
    rule: any
  ): Promise<IWorkflowRunDocument> {
    const workflowRunId = generateId('run');
    const executionId = generateId('exec');
    const correlationId = `corr_${event.id}`;

    const steps: IStepExecution[] = [];

    // Step 1: Match Keyword
    steps.push({
      stepExecutionId: generateId('step'),
      actionId: 'act_match_keyword',
      name: 'Match Keyword Trigger',
      type: 'MATCH_KEYWORD',
      status: 'PENDING',
      input: { commentText: event.payload.text || event.payload.commentText, keywords: rule.triggerKeywords, matchType: rule.matchType },
    });

    // Step 2: Public Comment Reply
    if (rule.publicReplyText) {
      steps.push({
        stepExecutionId: generateId('step'),
        actionId: 'act_public_reply',
        name: 'Send Public Reply',
        type: 'PUBLIC_REPLY',
        status: 'PENDING',
        input: { commentId: event.payload.commentId, replyText: rule.publicReplyText },
      });
    }

    // Step 3: Send Direct Message
    if (rule.sendPrivateDM && rule.privateDMText) {
      steps.push({
        stepExecutionId: generateId('step'),
        actionId: 'act_send_dm',
        name: 'Send Private DM',
        type: 'SEND_DM',
        status: 'PENDING',
        input: { recipientId: event.actor.id, dmText: rule.privateDMText },
      });
    }

    // Step 4: Capture Lead
    steps.push({
      stepExecutionId: generateId('step'),
      actionId: 'act_capture_lead',
      name: 'Capture Lead Record',
      type: 'CAPTURE_LEAD',
      status: 'PENDING',
      input: { username: event.actor.username || 'instagram_user', userId: event.actor.id, commentText: event.payload.text },
    });

    let doc: IWorkflowRunDocument | null = null;
    if (mongoose.connection.readyState === 1) {
      try {
        doc = await WorkflowRunModel.create({
          workflowRunId,
          eventId: event.id,
          workspaceId: event.tenantId,
          workflowId: rule._id,
          status: 'PENDING' as WorkflowRunState,
          steps,
          currentStepIndex: 0,
          correlationId,
          executionId,
          startedAt: new Date(),
        });
      } catch {}
    }

    if (!doc) {
      doc = {
        workflowRunId,
        eventId: event.id,
        workspaceId: event.tenantId as any,
        workflowId: rule._id,
        status: 'PENDING' as WorkflowRunState,
        steps,
        currentStepIndex: 0,
        correlationId,
        executionId,
        startedAt: new Date(),
      } as any;
    }

    return doc!;
  }

  public async executeWorkflowRun(run: IWorkflowRunDocument): Promise<IWorkflowRunDocument> {
    await this.updateRunStatus(run.workflowRunId, 'RUNNING');
    run.status = 'RUNNING';

    for (let i = 0; i < run.steps.length; i++) {
      const step = run.steps[i];

      // Worker Restart Recovery: Skip already completed steps
      if (step.status === 'COMPLETED') {
        continue;
      }

      step.status = 'RUNNING';
      step.startedAt = new Date();
      run.currentStepIndex = i;

      try {
        const output = await this.executeStep(run.workspaceId.toString(), step);
        step.status = 'COMPLETED';
        step.output = output;
        step.completedAt = new Date();
      } catch (err: any) {
        step.status = 'FAILED';
        step.error = err.message || 'Step execution failed';

        run.status = 'FAILED';
        run.error = step.error;

        await this.saveRunState(run);
        throw new Error(`Workflow Run '${run.workflowRunId}' failed at step '${step.name}': ${step.error}`);
      }
    }

    run.status = 'COMPLETED';
    run.completedAt = new Date();

    await this.saveRunState(run);

    if (mongoose.connection.readyState === 1) {
      try {
        await AutomationRuleModel.findByIdAndUpdate(run.workflowId, {
          $inc: { triggerCount: 1 },
        });

        await WorkflowExecutionModel.create({
          workspaceId: run.workspaceId,
          workflowId: run.workflowId,
          triggerEvent: `event:${run.eventId}`,
          status: 'SUCCESS',
          logs: run.steps.map((s) => `Step [${s.name}]: ${s.status}`),
          executedAt: new Date(),
        });
      } catch {}
    }

    return run;
  }

  public async resumeWorkflowRun(workflowRunId: string): Promise<IWorkflowRunDocument | null> {
    if (mongoose.connection.readyState === 1) {
      const run = await WorkflowRunModel.findOne({ workflowRunId });
      if (run) {
        if (run.status === 'COMPLETED' || run.status === 'CANCELLED') {
          return run;
        }
        return this.executeWorkflowRun(run);
      }
    }
    return null;
  }

  private async executeStep(workspaceId: string, step: IStepExecution): Promise<Record<string, any>> {
    switch (step.type) {
      case 'MATCH_KEYWORD': {
        const { commentText, keywords, matchType } = step.input || {};
        let matched = false;
        let matchedKeyword = '';

        for (const kw of keywords || []) {
          if (matchCommentKeyword(commentText || '', kw, matchType)) {
            matched = true;
            matchedKeyword = kw;
            break;
          }
        }

        if (!matched && keywords && keywords.length > 0) {
          throw new Error(`Comment text did not match any trigger keywords`);
        }

        return { matched: true, matchedKeyword };
      }

      case 'PUBLIC_REPLY': {
        const { commentId, replyText } = step.input || {};
        let replyId = `reply_${Date.now()}`;

        if (commentId && process.env.NODE_ENV !== 'test') {
          try {
            const res = await this.instagramClient.replyToComment('mock_token', commentId, replyText);
            if (res?.id) replyId = res.id;
          } catch {}
        }

        if (mongoose.connection.readyState === 1) {
          try {
            await MessageModel.create({
              workspaceId,
              instagramUsername: 'customer',
              channel: 'INSTAGRAM_COMMENT',
              direction: 'OUTBOUND',
              content: replyText,
              status: 'Delivered',
              timestamp: new Date(),
            });
          } catch {}
        }

        return { replyId, messageSent: replyText };
      }

      case 'SEND_DM': {
        const { recipientId, dmText } = step.input || {};
        let messageId = `msg_${Date.now()}`;

        if (recipientId && process.env.NODE_ENV !== 'test') {
          try {
            const res = await this.instagramClient.sendDirectMessage('mock_token', recipientId, dmText);
            if (res?.message_id) messageId = res.message_id;
          } catch {}
        }

        if (mongoose.connection.readyState === 1) {
          try {
            await MessageModel.create({
              workspaceId,
              instagramUsername: 'customer',
              channel: 'INSTAGRAM_DM',
              direction: 'OUTBOUND',
              content: dmText,
              status: 'Delivered',
              timestamp: new Date(),
            });
          } catch {}
        }

        return { messageId, dmSent: dmText };
      }

      case 'CAPTURE_LEAD': {
        const { username, userId, commentText } = step.input || {};

        if (mongoose.connection.readyState === 1) {
          try {
            await LeadModel.create({
              workspaceId,
              instagramUsername: username || 'instagram_user',
              instagramUserId: userId,
              status: 'NEW',
              commentText,
              capturedAt: new Date(),
            });
          } catch {}
        }

        return { leadCaptured: true, username };
      }

      default:
        return { executed: true };
    }
  }

  private async updateRunStatus(workflowRunId: string, status: WorkflowRunState): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      await WorkflowRunModel.updateOne({ workflowRunId }, { $set: { status } });
    }
  }

  private async saveRunState(run: IWorkflowRunDocument): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      await WorkflowRunModel.updateOne(
        { workflowRunId: run.workflowRunId },
        {
          $set: {
            status: run.status,
            steps: run.steps,
            currentStepIndex: run.currentStepIndex,
            error: run.error,
            completedAt: run.completedAt,
          },
        }
      );
    }
  }
}

export const workflowEngine = new WorkflowEngine();
