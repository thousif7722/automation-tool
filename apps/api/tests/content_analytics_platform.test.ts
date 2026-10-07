import { ContentService, AnalyticsService } from '@insta-automation/ai';

describe('Content and Analytics Platform Unit Tests', () => {
  const workspaceId = 'ws_content_analytics_999';

  describe('1. Content Generation & Approval Workflow', () => {
    let contentService: ContentService;

    beforeEach(() => {
      contentService = new ContentService();
    });

    it('should complete full content lifecycle: Idea -> Generate -> Review -> Approve -> Schedule -> Publish', async () => {
      // 1. Idea Creation
      const idea = await contentService.createIdea(
        workspaceId,
        '5 Morning Habits of 7-Figure Athletes',
        'Morning Habits Reel',
        true
      );
      expect(idea.status).toBe('IDEA');

      // 2. AI Content Generation
      const generated = await contentService.generateContent(workspaceId, idea.id);
      expect(generated.status).toBe('GENERATED');
      expect(generated.caption).toContain('Morning Habits Reel');
      expect(generated.hooks.length).toBe(3);
      expect(generated.hashtags).toContain('#ai');

      // 3. Human Review Submission
      const inReview = await contentService.submitForReview(workspaceId, idea.id);
      expect(inReview.status).toBe('IN_REVIEW');

      // 4. Human Approval
      const approved = await contentService.approveContent(workspaceId, idea.id, 'Manager Alex');
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('Manager Alex');

      // 5. Schedule Content
      const scheduledDate = new Date(Date.now() + 86400000);
      const scheduled = await contentService.scheduleContent(workspaceId, idea.id, scheduledDate);
      expect(scheduled.status).toBe('SCHEDULED');

      // 6. Publish Content
      const published = await contentService.publishContent(workspaceId, idea.id);
      expect(published.status).toBe('PUBLISHED');
      expect(published.instagramMediaId).toBeDefined();

      // Calendar listing verify
      const calendar = await contentService.listCalendarItems(workspaceId);
      expect(calendar.length).toBe(1);
    });

    it('should enforce Approval Policy Guard and block scheduling unapproved sensitive content', async () => {
      const idea = await contentService.createIdea(workspaceId, 'Black Friday 50% Off Promo', 'BF Promo', true);
      await contentService.generateContent(workspaceId, idea.id);

      // Attempting to schedule without approval must throw an error!
      await expect(contentService.scheduleContent(workspaceId, idea.id, new Date())).rejects.toThrow(
        /Approval Policy Violation/
      );

      // Attempting to publish directly without approval must throw an error!
      await expect(contentService.publishContent(workspaceId, idea.id)).rejects.toThrow(
        /Publishing Guard Violation/
      );
    });
  });

  describe('2. Business Analytics & Performance Metrics', () => {
    let analyticsService: AnalyticsService;

    beforeEach(() => {
      analyticsService = new AnalyticsService();
    });

    it('should track metrics and calculate accurate business analytics ratios', async () => {
      const snapshot = await analyticsService.recordSnapshot(workspaceId, {
        reach: 20000,
        engagement: 4000,
        comments: 1000,
        messages: 1500,
        leads: 500,
        qualifiedLeads: 250,
        conversions: 100,
        automationExecutions: 6000,
        aiResponses: 5000,
        humanEscalations: 250,
      });

      expect(snapshot.conversionRate).toBe(20.0); // (100 / 500) * 100% = 20%
      expect(snapshot.aiResolutionRate).toBe(95.0); // ((5000 - 250) / 5000) * 100% = 95%
      expect(snapshot.humanTakeoverRate).toBe(5.0); // (250 / 5000) * 100% = 5%
    });
  });

  describe('3. AI Analytics Engine (Evidence-Based Q&A)', () => {
    let analyticsService: AnalyticsService;

    beforeEach(() => {
      analyticsService = new AnalyticsService();
    });

    it('should answer "Why did my engagement drop?" with reach evidence', async () => {
      const response = await analyticsService.askAIAnalytics(workspaceId, 'Why did my engagement drop?');
      expect(response.answer).toContain('Engagement dropped primarily due to');
      expect(response.evidence.reach).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0.9);
    });

    it('should answer "Which automation generates the most leads?" with top workflow evidence', async () => {
      const response = await analyticsService.askAIAnalytics(workspaceId, 'Which automation generates the most leads?');
      expect(response.answer).toContain('wf_price_lead_auto');
      expect(response.evidence.topWorkflowKey).toBe('wf_price_lead_auto');
      expect(response.confidence).toBeGreaterThan(0.9);
    });

    it('should answer "Which posts produce the highest quality customers?" with post metrics evidence', async () => {
      const response = await analyticsService.askAIAnalytics(workspaceId, 'Which posts produce the highest quality customers?');
      expect(response.answer).toContain('ig_media_1092');
      expect(response.evidence.topMediaId).toBe('ig_media_1092');
      expect(response.confidence).toBeGreaterThan(0.9);
    });

    it('should answer "Which workflow is failing?" with dead letter & error evidence', async () => {
      const response = await analyticsService.askAIAnalytics(workspaceId, 'Which workflow is failing?');
      expect(response.answer).toContain('wf_story_reply_v2');
      expect(response.evidence.errorReason).toContain('Rate Limit');
      expect(response.confidence).toBeGreaterThan(0.9);
    });
  });
});
