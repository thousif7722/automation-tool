import { ContentItem, ContentStatus } from '@insta-automation/types';
import { ContentItemModel } from '@insta-automation/database';

export class ContentService {
  private inMemoryItems: Map<string, ContentItem> = new Map();

  public async createIdea(
    workspaceId: string,
    ideaText: string,
    title: string,
    requiresApproval = true
  ): Promise<ContentItem> {
    const item: ContentItem = {
      id: `content_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      title,
      idea: ideaText,
      caption: '',
      hooks: [],
      script: '',
      hashtags: [],
      status: 'IDEA',
      requiresApproval,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.inMemoryItems.set(item.id, item);

    try {
      if (ContentItemModel && ContentItemModel.db && ContentItemModel.db.readyState === 1) {
        await ContentItemModel.create({ ...item, workspaceId });
      }
    } catch {}

    return item;
  }

  public async generateContent(workspaceId: string, contentId: string): Promise<ContentItem> {
    const item = this.inMemoryItems.get(contentId);
    if (!item || item.workspaceId !== workspaceId) {
      throw new Error(`Content item ${contentId} not found`);
    }

    // AI Generation step: hooks, captions, script, hashtags
    item.caption = `🔥 Unlocking ultimate performance with ${item.title}! Check out the link in our bio for exclusive access. #FitnessGoals #Productivity`;
    item.hooks = [
      `Stop scrolling if you want to double your results!`,
      `Here is the #1 secret nobody tells you about ${item.title}...`,
      `Are you making this huge mistake with your routine?`,
    ];
    item.script = `[Hook 3s] -> [Problem Breakdown 10s] -> [Solution Reveal 15s] -> [CTA 5s]`;
    item.hashtags = ['#automation', '#growth', '#instagram', '#productivity', '#ai'];
    item.status = 'GENERATED';
    item.updatedAt = new Date();

    this.inMemoryItems.set(contentId, item);
    return item;
  }

  public async submitForReview(workspaceId: string, contentId: string): Promise<ContentItem> {
    const item = this.inMemoryItems.get(contentId);
    if (!item || item.workspaceId !== workspaceId) {
      throw new Error(`Content item ${contentId} not found`);
    }

    item.status = 'IN_REVIEW';
    item.updatedAt = new Date();
    this.inMemoryItems.set(contentId, item);
    return item;
  }

  public async approveContent(workspaceId: string, contentId: string, approverName: string): Promise<ContentItem> {
    const item = this.inMemoryItems.get(contentId);
    if (!item || item.workspaceId !== workspaceId) {
      throw new Error(`Content item ${contentId} not found`);
    }

    item.status = 'APPROVED';
    item.approvedBy = approverName;
    item.approvedAt = new Date();
    item.updatedAt = new Date();

    this.inMemoryItems.set(contentId, item);
    return item;
  }

  public async scheduleContent(workspaceId: string, contentId: string, scheduledFor: Date): Promise<ContentItem> {
    const item = this.inMemoryItems.get(contentId);
    if (!item || item.workspaceId !== workspaceId) {
      throw new Error(`Content item ${contentId} not found`);
    }

    // MANDATORY APPROVAL GUARD: Sensitive/Unapproved content cannot be scheduled or published automatically
    if (item.requiresApproval && item.status !== 'APPROVED') {
      throw new Error(
        `Approval Policy Violation: Content item ${contentId} requires human approval before scheduling/publishing.`
      );
    }

    item.status = 'SCHEDULED';
    item.scheduledFor = scheduledFor;
    item.updatedAt = new Date();

    this.inMemoryItems.set(contentId, item);
    return item;
  }

  public async publishContent(workspaceId: string, contentId: string): Promise<ContentItem> {
    const item = this.inMemoryItems.get(contentId);
    if (!item || item.workspaceId !== workspaceId) {
      throw new Error(`Content item ${contentId} not found`);
    }

    if (item.requiresApproval && item.status !== 'APPROVED' && item.status !== 'SCHEDULED') {
      throw new Error(
        `Publishing Guard Violation: Unapproved content item ${contentId} cannot be published automatically.`
      );
    }

    item.status = 'PUBLISHED';
    item.publishedAt = new Date();
    item.instagramMediaId = `ig_media_${Date.now()}`;
    item.updatedAt = new Date();

    this.inMemoryItems.set(contentId, item);
    return item;
  }

  public async listCalendarItems(workspaceId: string): Promise<ContentItem[]> {
    return Array.from(this.inMemoryItems.values()).filter(
      (item) => item.workspaceId === workspaceId && (item.status === 'SCHEDULED' || item.status === 'PUBLISHED')
    );
  }

  public async listDrafts(workspaceId: string): Promise<ContentItem[]> {
    return Array.from(this.inMemoryItems.values()).filter(
      (item) => item.workspaceId === workspaceId && item.status !== 'PUBLISHED'
    );
  }
}
