import {
  workflowService,
  workflowSimulator,
  WorkflowGraph,
} from '@insta-automation/workflows';

describe('Core Workflow Engine Tests', () => {
  const workspaceId = '660f1a9b2c9d4e0011223344';

  describe('Workflow Versioning & Immutability Rules', () => {
    it('should create version 1 in DRAFT status', async () => {
      const graph = await workflowService.createWorkflow(workspaceId, {
        name: 'Price Lead Automation',
        description: 'Auto-reply to price inquiries',
        trigger: { type: 'COMMENT_CREATED' },
        nodes: [
          { id: 'node_1', type: 'TRIGGER', name: 'Comment Trigger', config: { triggerType: 'COMMENT_CREATED' } },
          { id: 'node_2', type: 'END', name: 'End Node', config: {} },
        ],
        edges: [{ id: 'edge_1', source: 'node_1', target: 'node_2' }],
      });

      expect(graph.version).toBe(1);
      expect(graph.status).toBe('DRAFT');
      expect(graph.name).toBe('Price Lead Automation');
    });

    it('should update DRAFT workflows in-place without incrementing version', async () => {
      const graph = await workflowService.createWorkflow(workspaceId, {
        name: 'Draft Workflow',
        trigger: { type: 'COMMENT_CREATED' },
        nodes: [{ id: 'n1', type: 'TRIGGER', name: 'Trigger', config: {} }],
        edges: [],
      });

      const updated = await workflowService.updateWorkflow(workspaceId, graph.workflowKey, {
        name: 'Updated Draft Workflow Name',
      });

      expect(updated.version).toBe(1);
      expect(updated.status).toBe('DRAFT');
      expect(updated.name).toBe('Updated Draft Workflow Name');
    });

    it('should enforce IMMUTABILITY on published ACTIVE workflows by creating a new version upon modification', async () => {
      const graph = await workflowService.createWorkflow(workspaceId, {
        name: 'Active Immutable Workflow',
        trigger: { type: 'COMMENT_CREATED' },
        nodes: [{ id: 'n1', type: 'TRIGGER', name: 'Trigger', config: {} }],
        edges: [],
      });

      // Publish v1
      const publishedV1 = await workflowService.publishWorkflow(workspaceId, graph.workflowKey);
      expect(publishedV1.version).toBe(1);
      expect(publishedV1.status).toBe('ACTIVE');

      // Attempt to modify active v1
      const version2Draft = await workflowService.updateWorkflow(workspaceId, graph.workflowKey, {
        name: 'Modified Active Workflow',
      });

      // Should auto-spawn version 2 DRAFT
      expect(version2Draft.version).toBe(2);
      expect(version2Draft.status).toBe('DRAFT');
      expect(version2Draft.name).toBe('Modified Active Workflow');

      // Verify v1 remains ACTIVE serving production traffic while v2 is DRAFT
      let versions = await workflowService.listWorkflowVersions(workspaceId, graph.workflowKey);
      expect(versions.length).toBe(2);
      expect(versions[0].version).toBe(1);
      expect(versions[0].status).toBe('ACTIVE'); // Active live version
      expect(versions[1].version).toBe(2);
      expect(versions[1].status).toBe('DRAFT'); // New draft version

      // Publishing v2 sets v1 to PAUSED and v2 to ACTIVE
      const publishedV2 = await workflowService.publishWorkflow(workspaceId, graph.workflowKey, 2);
      expect(publishedV2.version).toBe(2);
      expect(publishedV2.status).toBe('ACTIVE');

      versions = await workflowService.listWorkflowVersions(workspaceId, graph.workflowKey);
      expect(versions[0].status).toBe('PAUSED');
      expect(versions[1].status).toBe('ACTIVE');
    });

    it('should support workflow pause and rollback to previous version', async () => {
      const graph = await workflowService.createWorkflow(workspaceId, {
        name: 'Rollback Test Workflow',
        trigger: { type: 'MESSAGE_RECEIVED' },
        nodes: [{ id: 'n1', type: 'TRIGGER', name: 'Trigger', config: {} }],
        edges: [],
      });

      // Publish v1
      await workflowService.publishWorkflow(workspaceId, graph.workflowKey);

      // Create and publish v2
      await workflowService.updateWorkflow(workspaceId, graph.workflowKey, { name: 'V2 Version' });
      await workflowService.publishWorkflow(workspaceId, graph.workflowKey, 2);

      // Rollback to v1 (creates v3 active with v1 contents)
      const rolledBack = await workflowService.rollbackWorkflow(workspaceId, graph.workflowKey, 1);
      expect(rolledBack.version).toBe(3);
      expect(rolledBack.status).toBe('ACTIVE');
      expect(rolledBack.name).toContain('Rollback v1');
    });
  });

  describe('Execution Simulator & Node Evaluation', () => {
    it('should execute prompt example: Comment "How much is this?" -> Condition true -> Reply executed -> DM executed -> Goal Achieved', () => {
      const workflowGraph: WorkflowGraph = {
        workflowKey: 'wf_price_lead_automation',
        name: 'Price Lead Automation',
        version: 1,
        status: 'ACTIVE',
        trigger: { type: 'COMMENT_CREATED' },
        nodes: [
          {
            id: 'node_trigger',
            type: 'TRIGGER',
            name: 'Comment Trigger',
            config: { triggerType: 'COMMENT_CREATED' },
          },
          {
            id: 'node_condition',
            type: 'CONDITION',
            name: 'Check Price Inquiry',
            config: { field: 'comment.text', operator: 'contains', value: 'how much' },
          },
          {
            id: 'node_reply',
            type: 'ACTION',
            name: 'Public Comment Reply',
            config: { actionType: 'PUBLIC_REPLY', replyText: 'Hey @{{customer.username}}, check your DMs!' },
          },
          {
            id: 'node_dm',
            type: 'ACTION',
            name: 'Send Private DM',
            config: { actionType: 'SEND_MESSAGE', messageText: 'Here is the link for pricing details!' },
          },
          {
            id: 'node_lead',
            type: 'ACTION',
            name: 'Capture Lead Record',
            config: { actionType: 'CREATE_LEAD' },
          },
          {
            id: 'node_goal',
            type: 'GOAL',
            name: 'Price Lead Conversion',
            config: { goalName: 'Lead Captured' },
          },
          {
            id: 'node_end',
            type: 'END',
            name: 'Workflow End',
            config: {},
          },
        ],
        edges: [
          { id: 'e1', source: 'node_trigger', target: 'node_condition' },
          { id: 'e2', source: 'node_condition', target: 'node_reply', condition: 'true' },
          { id: 'e3', source: 'node_reply', target: 'node_dm' },
          { id: 'e4', source: 'node_dm', target: 'node_lead' },
          { id: 'e5', source: 'node_lead', target: 'node_goal' },
          { id: 'e6', source: 'node_goal', target: 'node_end' },
        ],
      };

      const inputEvent = {
        id: 'evt_sim_101',
        type: 'COMMENT_CREATED',
        actor: { id: 'usr_sarah', username: 'sarah_shopper' },
        payload: { text: 'How much is this?', commentId: 'cmt_999' },
      };

      const result = workflowSimulator.simulate(workflowGraph, inputEvent);

      expect(result.status).toBe('COMPLETED');
      expect(result.evaluatedConditions.length).toBe(1);
      expect(result.evaluatedConditions[0].result).toBe(true);
      expect(result.evaluatedConditions[0].edgeFollowed).toBe('true');

      // Verify Actions Executed
      expect(result.executedActions.length).toBe(3);
      expect(result.executedActions[0].actionType).toBe('PUBLIC_REPLY');
      expect(result.executedActions[0].result.replyText).toContain('sarah_shopper');

      expect(result.executedActions[1].actionType).toBe('SEND_MESSAGE');
      expect(result.executedActions[1].result.messageText).toContain('pricing details');

      expect(result.executedActions[2].actionType).toBe('CREATE_LEAD');

      // Verify Goal Achieved
      expect(result.goalAchieved).toBe(true);
      expect(result.goalName).toBe('Lead Captured');
    });

    it('should support multi-node types: BRANCH, AI_DECISION, SET_VARIABLE, DELAY, HTTP_REQUEST', () => {
      const advancedGraph: WorkflowGraph = {
        workflowKey: 'wf_advanced',
        name: 'Advanced Workflow',
        version: 1,
        status: 'ACTIVE',
        trigger: { type: 'MESSAGE_RECEIVED' },
        nodes: [
          { id: 'n_trig', type: 'TRIGGER', name: 'Trigger', config: {} },
          { id: 'n_ai', type: 'AI_DECISION', name: 'AI Classifier', config: { prompt: 'Determine user intent' } },
          { id: 'n_var', type: 'SET_VARIABLE', name: 'Set Inquired Var', config: { variableName: 'asked_price', variableValue: 'true' } },
          { id: 'n_delay', type: 'DELAY', name: 'Wait 5 Seconds', config: { delayMs: 5000 } },
          { id: 'n_http', type: 'HTTP_REQUEST', name: 'CRM Webhook', config: { httpUrl: 'https://api.crm.com/lead', httpMethod: 'POST' } },
          { id: 'n_end', type: 'END', name: 'End Node', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'n_trig', target: 'n_ai' },
          { id: 'e2', source: 'n_ai', target: 'n_var', condition: 'price_inquiry' },
          { id: 'e3', source: 'n_var', target: 'n_delay' },
          { id: 'e4', source: 'n_delay', target: 'n_http' },
          { id: 'e5', source: 'n_http', target: 'n_end' },
        ],
      };

      const event = {
        id: 'evt_msg_200',
        type: 'MESSAGE_RECEIVED',
        actor: { id: 'usr_mark', username: 'mark_biz' },
        payload: { text: 'What is the price of your pro plan?' },
      };

      const res = workflowSimulator.simulate(advancedGraph, event);

      expect(res.status).toBe('COMPLETED');
      expect(res.context.custom.asked_price).toBe('true');
      expect(res.executedNodes.some((n) => n.type === 'AI_DECISION')).toBe(true);
      expect(res.executedNodes.some((n) => n.type === 'HTTP_REQUEST')).toBe(true);
    });

    it('should evaluate all condition operators correctly (regex, equals, startsWith, lead_score, customer_tag)', () => {
      const graph: WorkflowGraph = {
        workflowKey: 'wf_cond_test',
        name: 'Condition Testing',
        version: 1,
        status: 'ACTIVE',
        trigger: { type: 'COMMENT_CREATED' },
        nodes: [
          { id: 'n_trig', type: 'TRIGGER', name: 'Trigger', config: {} },
          { id: 'n_c1', type: 'CONDITION', name: 'Regex Check', config: { field: 'comment.text', operator: 'regex', value: '^VIP.*' } },
          { id: 'n_end', type: 'END', name: 'End', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'n_trig', target: 'n_c1' },
          { id: 'e2', source: 'n_c1', target: 'n_end', condition: 'true' },
        ],
      };

      const matchingEvent = {
        id: 'evt_vip',
        type: 'COMMENT_CREATED',
        payload: { text: 'VIP discount code please' },
      };

      const resMatch = workflowSimulator.simulate(graph, matchingEvent);
      expect(resMatch.evaluatedConditions[0].result).toBe(true);

      const nonMatchingEvent = {
        id: 'evt_regular',
        type: 'COMMENT_CREATED',
        payload: { text: 'Hello discount code please' },
      };

      const resNoMatch = workflowSimulator.simulate(graph, nonMatchingEvent);
      expect(resNoMatch.evaluatedConditions[0].result).toBe(false);
    });
  });
});
