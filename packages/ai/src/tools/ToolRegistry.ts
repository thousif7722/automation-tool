import { z } from 'zod';
import { ToolDefinition, ToolRiskLevel, ToolExecutionContext } from '../types';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  private registerDefaultTools(): void {
    // 1. instagram.getProfile
    this.registerTool({
      name: 'instagram.getProfile',
      description: 'Fetches public profile details for an Instagram user.',
      inputSchema: z.object({ username: z.string() }),
      outputSchema: z.object({ username: z.string(), followerCount: z.number(), isBusinessAccount: z.boolean() }),
      riskLevel: 'LOW',
      requiredPermissions: ['instagram:read'],
      handler: async (input: { username: string }) => ({
        username: input.username,
        followerCount: 15200,
        isBusinessAccount: false,
      }),
    });

    // 2. instagram.getMedia
    this.registerTool({
      name: 'instagram.getMedia',
      description: 'Retrieves media posts for a connected Instagram account.',
      inputSchema: z.object({ mediaId: z.string().optional(), limit: z.number().default(10) }),
      outputSchema: z.object({ media: z.array(z.object({ id: z.string(), caption: z.string(), mediaType: z.string() })) }),
      riskLevel: 'LOW',
      requiredPermissions: ['instagram:read'],
      handler: async () => ({
        media: [{ id: 'm_101', caption: 'Check out our new products!', mediaType: 'IMAGE' }],
      }),
    });

    // 3. instagram.getComments
    this.registerTool({
      name: 'instagram.getComments',
      description: 'Retrieves comments on a specific Instagram media post.',
      inputSchema: z.object({ mediaId: z.string() }),
      outputSchema: z.object({ comments: z.array(z.object({ id: z.string(), text: z.string(), username: z.string() })) }),
      riskLevel: 'LOW',
      requiredPermissions: ['instagram:read'],
      handler: async () => ({
        comments: [{ id: 'c_201', text: 'How much does this cost?', username: 'sarah_shopper' }],
      }),
    });

    // 4. instagram.replyComment
    this.registerTool({
      name: 'instagram.replyComment',
      description: 'Posts a public comment reply under a user comment.',
      inputSchema: z.object({ commentId: z.string(), replyText: z.string() }),
      outputSchema: z.object({ success: z.boolean(), replyId: z.string() }),
      riskLevel: 'MEDIUM',
      requiredPermissions: ['instagram:write'],
      handler: async () => ({ success: true, replyId: `rep_${Date.now()}` }),
    });

    // 5. instagram.sendMessage
    this.registerTool({
      name: 'instagram.sendMessage',
      description: 'Sends an automated direct message to an Instagram user.',
      inputSchema: z.object({ recipientUsername: z.string(), messageText: z.string() }),
      outputSchema: z.object({ success: z.boolean(), messageId: z.string() }),
      riskLevel: 'MEDIUM',
      requiredPermissions: ['instagram:messages'],
      handler: async () => ({ success: true, messageId: `msg_${Date.now()}` }),
    });

    // 6. instagram.getInsights
    this.registerTool({
      name: 'instagram.getInsights',
      description: 'Fetches engagement and reach analytics for an account.',
      inputSchema: z.object({ timeframeDays: z.number().default(30) }),
      outputSchema: z.object({ impressions: z.number(), reach: z.number(), engagementRate: z.number() }),
      riskLevel: 'LOW',
      requiredPermissions: ['instagram:read'],
      handler: async () => ({ impressions: 45000, reach: 32000, engagementRate: 4.8 }),
    });

    // 7. customer.get
    this.registerTool({
      name: 'customer.get',
      description: 'Retrieves customer profile and tag history.',
      inputSchema: z.object({ username: z.string() }),
      outputSchema: z.object({ username: z.string(), tags: z.array(z.string()), score: z.number() }),
      riskLevel: 'LOW',
      requiredPermissions: ['customer:read'],
      handler: async (input: { username: string }) => ({ username: input.username, tags: ['prospect'], score: 15 }),
    });

    // 8. customer.update
    this.registerTool({
      name: 'customer.update',
      description: 'Updates customer profile information.',
      inputSchema: z.object({ username: z.string(), metadata: z.record(z.string(), z.any()) }),
      outputSchema: z.object({ success: z.boolean() }),
      riskLevel: 'MEDIUM',
      requiredPermissions: ['customer:write'],
      handler: async () => ({ success: true }),
    });

    // 9. customer.addTag
    this.registerTool({
      name: 'customer.addTag',
      description: 'Appends a segmentation tag to customer record.',
      inputSchema: z.object({ username: z.string(), tag: z.string() }),
      outputSchema: z.object({ success: z.boolean(), updatedTags: z.array(z.string()) }),
      riskLevel: 'LOW',
      requiredPermissions: ['customer:write'],
      handler: async (input: { username: string; tag: string }) => ({ success: true, updatedTags: ['prospect', input.tag] }),
    });

    // 10. lead.create
    this.registerTool({
      name: 'lead.create',
      description: 'Creates a new qualified sales lead in database.',
      inputSchema: z.object({ instagramUsername: z.string(), status: z.string().default('NEW') }),
      outputSchema: z.object({ success: z.boolean(), leadId: z.string() }),
      riskLevel: 'MEDIUM',
      requiredPermissions: ['lead:write'],
      handler: async () => ({ success: true, leadId: `lead_${Date.now()}` }),
    });

    // 11. lead.update
    this.registerTool({
      name: 'lead.update',
      description: 'Updates existing lead record status or details.',
      inputSchema: z.object({ leadId: z.string(), status: z.string() }),
      outputSchema: z.object({ success: z.boolean() }),
      riskLevel: 'MEDIUM',
      requiredPermissions: ['lead:write'],
      handler: async () => ({ success: true }),
    });

    // 12. lead.score
    this.registerTool({
      name: 'lead.score',
      description: 'Adjusts lead qualification score.',
      inputSchema: z.object({ instagramUsername: z.string(), scoreDelta: z.number() }),
      outputSchema: z.object({ success: z.boolean(), newScore: z.number() }),
      riskLevel: 'LOW',
      requiredPermissions: ['lead:write'],
      handler: async (input: { instagramUsername: string; scoreDelta: number }) => ({ success: true, newScore: 25 + input.scoreDelta }),
    });

    // 13. workflow.create
    this.registerTool({
      name: 'workflow.create',
      description: 'Creates a draft automation workflow specification.',
      inputSchema: z.object({ name: z.string(), spec: z.record(z.string(), z.any()) }),
      outputSchema: z.object({ success: z.boolean(), workflowKey: z.string() }),
      riskLevel: 'HIGH',
      requiredPermissions: ['workflow:write'],
      handler: async () => ({ success: true, workflowKey: `wf_${Date.now()}` }),
    });

    // 14. workflow.update
    this.registerTool({
      name: 'workflow.update',
      description: 'Modifies an existing draft workflow specification.',
      inputSchema: z.object({ workflowKey: z.string(), spec: z.record(z.string(), z.any()) }),
      outputSchema: z.object({ success: z.boolean() }),
      riskLevel: 'HIGH',
      requiredPermissions: ['workflow:write'],
      handler: async () => ({ success: true }),
    });

    // 15. workflow.test
    this.registerTool({
      name: 'workflow.test',
      description: 'Runs workflow simulation test suite.',
      inputSchema: z.object({ workflowKey: z.string(), sampleText: z.string() }),
      outputSchema: z.object({ status: z.string(), stepsExecuted: z.number() }),
      riskLevel: 'LOW',
      requiredPermissions: ['workflow:read'],
      handler: async () => ({ status: 'COMPLETED', stepsExecuted: 5 }),
    });

    // 16. analytics.get
    this.registerTool({
      name: 'analytics.get',
      description: 'Fetches automation engine runtime analytics.',
      inputSchema: z.object({ timeframe: z.string().default('24h') }),
      outputSchema: z.object({ totalEvents: z.number(), successRate: z.number() }),
      riskLevel: 'LOW',
      requiredPermissions: ['analytics:read'],
      handler: async () => ({ totalEvents: 1420, successRate: 99.8 }),
    });
  }
}
