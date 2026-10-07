import {
  AutomationRuleModel,
  LeadModel,
  MessageModel,
  WorkflowExecutionModel,
} from '@insta-automation/database';
import { matchCommentKeyword } from '@insta-automation/utils';
import type { MetaWebhookCommentEvent } from '@insta-automation/types';
import { InstagramClient } from '../integrations/meta/instagram';
import { AIAutomationService } from '../integrations/ai';
import { logger } from '../lib/logger';

export interface CommentExecutionResult {
  success: boolean;
  ruleMatched?: string;
  publicReplyId?: string;
  privateMessageId?: string;
  leadCaptured?: boolean;
  error?: string;
}

export class CommentAutomationEngine {
  private instagramClient: InstagramClient;
  private aiService: AIAutomationService;

  constructor() {
    this.instagramClient = new InstagramClient();
    this.aiService = new AIAutomationService();
  }

  public async processCommentEvent(
    event: MetaWebhookCommentEvent
  ): Promise<CommentExecutionResult> {
    const startTime = Date.now();
    const { workspaceId, commentId, commentText, fromUsername, fromUserId } = event;

    logger.info(`[CommentEngine] Processing comment event for workspace '${workspaceId}'`, {
      workspaceId,
      commentId,
      fromUsername,
    });

    try {
      const activeRules = await AutomationRuleModel.find({
        workspaceId,
        status: 'ACTIVE',
      }).lean();

      let matchedRule: any = null;
      let matchedKeyword = '';

      for (const rule of activeRules) {
        for (const kw of rule.triggerKeywords || []) {
          if (matchCommentKeyword(commentText, kw, rule.matchType as any)) {
            matchedRule = rule;
            matchedKeyword = kw;
            break;
          }
        }
        if (matchedRule) break;
      }

      if (matchedRule) {
        await AutomationRuleModel.findByIdAndUpdate(matchedRule._id, {
          $inc: { triggerCount: 1 },
        });

        let replyTextToUse = matchedRule.publicReplyText || '';
        if (
          matchedRule.publicReplyVariations &&
          matchedRule.publicReplyVariations.length > 0
        ) {
          const variations = matchedRule.publicReplyVariations.filter((v: string) => v && v.trim());
          if (variations.length > 0) {
            replyTextToUse = variations[Math.floor(Math.random() * variations.length)];
          }
        }

        let publicReplyRes: { success: boolean; replyId: string } = {
          success: true,
          replyId: `reply_${Date.now()}`,
        };

        if (replyTextToUse) {
          publicReplyRes = await this.instagramClient.replyToComment(commentId, replyTextToUse);

          await MessageModel.create({
            workspaceId,
            instagramUsername: fromUsername,
            channel: 'INSTAGRAM_COMMENT',
            direction: 'OUTBOUND',
            content: replyTextToUse,
            status: 'Delivered',
            timestamp: new Date(),
          });
        }

        let privateMsgRes: { success: boolean; messageId: string } | null = null;
        if (matchedRule.sendPrivateDM && matchedRule.privateDMText) {
          privateMsgRes = await this.instagramClient.sendDirectMessage(fromUserId, matchedRule.privateDMText);

          await MessageModel.create({
            workspaceId,
            instagramUsername: fromUsername,
            channel: 'INSTAGRAM_DM',
            direction: 'OUTBOUND',
            content: matchedRule.privateDMText,
            status: 'Delivered',
            timestamp: new Date(),
          });
        }

        await LeadModel.create({
          workspaceId,
          instagramUsername: fromUsername,
          instagramUserId: fromUserId,
          status: 'NEW',
          keywordTriggered: matchedKeyword,
          commentText,
          source: 'COMMENT_KEYWORD',
          capturedAt: new Date(),
        });

        await WorkflowExecutionModel.create({
          workspaceId,
          workflowId: matchedRule._id,
          triggerEvent: `comment:${commentId}`,
          status: 'SUCCESS',
          logs: [
            `Matched keyword '${matchedKeyword}' on rule '${matchedRule.name}'`,
            `Sent public reply: ${publicReplyRes.replyId}`,
            privateMsgRes ? `Sent DM: ${privateMsgRes.messageId}` : 'DM disabled',
          ],
          durationMs: Date.now() - startTime,
          executedAt: new Date(),
        });

        return {
          success: true,
          ruleMatched: matchedRule.name,
          publicReplyId: publicReplyRes.replyId,
          privateMessageId: privateMsgRes?.messageId,
          leadCaptured: true,
        };
      }

      const aiFallbackRule = activeRules.find((r: any) => r.aiFallbackEnabled);
      if (aiFallbackRule) {
        const aiReply = await this.aiService.generateSmartReply(commentText);
        const publicReplyRes = await this.instagramClient.replyToComment(commentId, aiReply);

        await WorkflowExecutionModel.create({
          workspaceId,
          workflowId: aiFallbackRule._id,
          triggerEvent: `comment:${commentId}`,
          status: 'SUCCESS',
          logs: [`No keyword match — executed AI Fallback smart reply`],
          durationMs: Date.now() - startTime,
          executedAt: new Date(),
        });

        return {
          success: true,
          ruleMatched: 'AI_FALLBACK',
          publicReplyId: publicReplyRes.replyId,
          leadCaptured: false,
        };
      }

      return {
        success: false,
        error: 'No matching keyword rule found for this workspace',
      };
    } catch (err: any) {
      logger.error(`[CommentEngine] Execution failed for comment '${commentId}'`, {
        workspaceId,
        error: err.message,
      });

      return {
        success: false,
        error: err.message,
      };
    }
  }
}
