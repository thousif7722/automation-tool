import { CRMService, LeadScoringEngine } from '@insta-automation/ai';
import { LeadState } from '@insta-automation/types';

describe('Customer & Lead Management System Unit Tests', () => {
  const workspaceId = 'ws_crm_test_456';
  let crmService: CRMService;

  beforeEach(() => {
    crmService = new CRMService();
  });

  describe('1. Customer Profile & Lead Entity Management', () => {
    it('should create and retrieve customer profile with default fields', async () => {
      const customer = await crmService.getOrCreateCustomer(workspaceId, 'sarah_fitness', {
        name: 'Sarah Jenkins',
        location: 'Chicago, IL',
        language: 'en',
        tags: ['vip_lead'],
      });

      expect(customer.instagramUsername).toBe('sarah_fitness');
      expect(customer.name).toBe('Sarah Jenkins');
      expect(customer.location).toBe('Chicago, IL');
      expect(customer.tags).toContain('vip_lead');
      expect(customer.leadScore).toBe(0);
    });

    it('should create and associate lead record with initial value and status', async () => {
      const lead = await crmService.getOrCreateLead(
        workspaceId,
        'sarah_fitness',
        'INSTAGRAM_DM',
        'Pro Power Hoodie',
        150
      );

      expect(lead.instagramUsername).toBe('sarah_fitness');
      expect(lead.product).toBe('Pro Power Hoodie');
      expect(lead.status).toBe('NEW');
      expect(lead.value).toBe(150);
    });
  });

  describe('2. Pipeline State Transitions', () => {
    it('should update lead status through lifecycle states', async () => {
      const lead = await crmService.getOrCreateLead(workspaceId, 'mike_runner', 'COMMENT', 'Ultra Leggings', 120);
      expect(lead.status).toBe('NEW');

      // State transition 1: CONTACTED
      const contacted = await crmService.updateLeadStatus(workspaceId, lead.id, 'CONTACTED');
      expect(contacted.status).toBe('CONTACTED');

      // State transition 2: QUALIFIED
      const qualified = await crmService.updateLeadStatus(workspaceId, lead.id, 'QUALIFIED');
      expect(qualified.status).toBe('QUALIFIED');

      // State transition 3: CONVERTED
      const converted = await crmService.updateLeadStatus(workspaceId, lead.id, 'CONVERTED');
      expect(converted.status).toBe('CONVERTED');
    });
  });

  describe('3. Configurable Lead Scoring Engine', () => {
    it('should detect signals and auto-promote lead score and state', async () => {
      const message = 'How much does this cost? I live in New York and want to buy it!';
      const result = await crmService.processCustomerMessageForScoring(workspaceId, 'buyer_alex', message);

      expect(result.signalsDetected).toContain('price_question');
      expect(result.signalsDetected).toContain('location_provided');
      expect(result.signalsDetected).toContain('purchase_intent');
      expect(result.scoreDelta).toBe(15 + 20 + 40); // 75 points
      expect(result.lead.score).toBe(75);
      expect(result.lead.status).toBe('QUALIFIED'); // >= 60 triggers QUALIFIED status
    });

    it('should allow business to dynamically customize scoring rules', async () => {
      const engine = new LeadScoringEngine();

      // Customize price_question rule from 15 points to 35 points
      const updatedRules = await engine.updateScoringRule(workspaceId, 'rule_price', { points: 35 });
      const priceRule = updatedRules.find((r) => r.signal === 'price_question');
      expect(priceRule?.points).toBe(35);

      const signals = engine.detectSignals('What is the price of your product?');
      const score = engine.calculateScoreIncrement(signals, updatedRules);
      expect(score).toBe(35);
    });
  });

  describe('4. Tasks, Notes & Tag Management', () => {
    it('should create tasks and notes attached to a lead', async () => {
      const lead = await crmService.getOrCreateLead(workspaceId, 'david_fit', 'INSTAGRAM_DM', 'Styling Session', 200);

      // Create Task
      const task = await crmService.createTask(
        workspaceId,
        lead.id,
        'Send custom catalog PDF',
        'Customer asked for product PDF',
        new Date(Date.now() + 86400000),
        'sales_rep_1'
      );
      expect(task.title).toBe('Send custom catalog PDF');
      expect(task.status).toBe('PENDING');

      const tasksList = await crmService.listTasks(workspaceId, lead.id);
      expect(tasksList.length).toBe(1);

      // Add Note
      const note = await crmService.addNote(
        workspaceId,
        lead.id,
        'Agent Sarah',
        'David prefers evening phone calls.'
      );
      expect(note.author).toBe('Agent Sarah');

      const notesList = await crmService.listNotes(workspaceId, lead.id);
      expect(notesList.length).toBe(1);
    });

    it('should create and list tags for workspace', async () => {
      const tag = await crmService.createTag(workspaceId, 'VIP Customer', '#ec4899');
      expect(tag.name).toBe('VIP Customer');
      expect(tag.color).toBe('#ec4899');

      const tags = await crmService.listTags(workspaceId);
      expect(tags.length).toBe(1);
    });
  });

  describe('5. CRM Analytics & Pipeline Insights', () => {
    it('should calculate conversion rate, pipeline value, and leads by status', async () => {
      // Setup leads in various states
      const lead1 = await crmService.getOrCreateLead(workspaceId, 'user_1', 'DM', 'Item 1', 100);
      const lead2 = await crmService.getOrCreateLead(workspaceId, 'user_2', 'DM', 'Item 2', 200);
      const lead3 = await crmService.getOrCreateLead(workspaceId, 'user_3', 'DM', 'Item 3', 300);

      await crmService.updateLeadStatus(workspaceId, lead1.id, 'QUALIFIED');
      await crmService.updateLeadStatus(workspaceId, lead2.id, 'CONVERTED');

      const analytics = await crmService.getCRMAnalytics(workspaceId);

      expect(analytics.totalLeads).toBe(3);
      expect(analytics.leadsByStatus.CONVERTED).toBe(1);
      expect(analytics.leadsByStatus.QUALIFIED).toBe(1);
      expect(analytics.totalPipelineValue).toBe(600);
      expect(analytics.conversionRate).toBeCloseTo(33.3, 1);
    });
  });
});
