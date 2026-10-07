import { SimulationResult, SimulationStep } from '../types/workflow';

export function runInBrowserSimulation(nodes: any[], edges: any[], sampleInputText: string, sampleUsername = 'sarah_shopper'): SimulationResult {
  const executedNodes: SimulationStep[] = [];
  const evaluatedConditions: Array<{ nodeId: string; operator: string; fieldValue: any; result: boolean; edgeFollowed: string }> = [];
  const executedActions: Array<{ actionType: string; payload: any; result: any }> = [];

  const context = {
    customer: { username: sampleUsername, tags: ['prospect'], score: 10 },
    comment: { text: sampleInputText },
    custom: {} as Record<string, any>,
  };

  let goalAchieved = false;
  let goalName: string | undefined = undefined;

  const triggerNode = nodes.find((n) => n.data?.nodeType === 'TRIGGER');
  if (!triggerNode) {
    return {
      status: 'FAILED',
      executedNodes: [],
      evaluatedConditions: [],
      executedActions: [],
      context,
      goalAchieved: false,
      error: 'Workflow contains no trigger node.',
    };
  }

  let currNode: any = triggerNode;
  const visited = new Set<string>();

  while (currNode && !visited.has(currNode.id)) {
    visited.add(currNode.id);
    const type = currNode.data?.nodeType;
    const config = currNode.data?.config || {};
    const label = currNode.data?.label || currNode.id;

    let nextConditionEdge: string | undefined = undefined;

    switch (type) {
      case 'TRIGGER': {
        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { text: sampleInputText, username: sampleUsername },
          output: { matchedTrigger: config.triggerType || 'COMMENT_CREATED' },
        });
        break;
      }

      case 'CONDITION': {
        const val = sampleInputText.toLowerCase();
        const matchVal = String(config.value || 'how much').toLowerCase();
        const operator = config.operator || 'contains';
        let isMatch = val.includes(matchVal);

        if (operator === 'startsWith') isMatch = val.startsWith(matchVal);
        if (operator === 'equals') isMatch = val === matchVal;
        if (operator === 'regex') {
          try {
            isMatch = new RegExp(matchVal, 'i').test(val);
          } catch {
            isMatch = false;
          }
        }

        nextConditionEdge = isMatch ? 'true' : 'false';

        evaluatedConditions.push({
          nodeId: currNode.id,
          operator,
          fieldValue: sampleInputText,
          result: isMatch,
          edgeFollowed: nextConditionEdge,
        });

        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { fieldValue: sampleInputText, operator, matchVal },
          output: { result: isMatch, branchTaken: nextConditionEdge },
        });
        break;
      }

      case 'ACTION': {
        const actionType = config.actionType || 'PUBLIC_REPLY';
        let actionResult: any = { status: 'executed' };

        if (actionType === 'PUBLIC_REPLY') {
          const text = (config.replyText || 'Thanks @{{customer.username}}!').replace('{{customer.username}}', sampleUsername);
          actionResult = { replyId: `sim_rep_${Date.now()}`, replyText: text };
        } else if (actionType === 'SEND_MESSAGE') {
          const text = (config.messageText || 'Check details here!').replace('{{customer.username}}', sampleUsername);
          actionResult = { messageId: `sim_msg_${Date.now()}`, messageText: text };
        } else if (actionType === 'CREATE_LEAD') {
          context.customer.score += 10;
          actionResult = { leadId: `lead_${Date.now()}`, newScore: context.customer.score };
        } else if (actionType === 'ADD_TAG') {
          const tag = config.tagName || 'lead';
          if (!context.customer.tags.includes(tag)) context.customer.tags.push(tag);
          actionResult = { tagAdded: tag };
        }

        executedActions.push({
          actionType,
          payload: config,
          result: actionResult,
        });

        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: config,
          output: actionResult,
        });
        break;
      }

      case 'AI_DECISION': {
        const val = sampleInputText.toLowerCase();
        let decision = 'general';
        if (val.includes('cost') || val.includes('price') || val.includes('how much')) {
          decision = 'price_inquiry';
        }

        nextConditionEdge = decision;

        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { prompt: config.prompt || 'Classify customer message' },
          output: { aiDecision: decision },
        });
        break;
      }

      case 'SET_VARIABLE': {
        const varName = config.variableName || 'price_inquired';
        context.custom[varName] = config.variableValue || true;

        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { varName, val: config.variableValue },
          output: { updatedCustom: context.custom },
        });
        break;
      }

      case 'DELAY': {
        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { delayMs: config.delayMs || 1000 },
          output: { simulatedDelayMs: config.delayMs || 1000 },
        });
        break;
      }

      case 'GOAL': {
        goalAchieved = true;
        goalName = config.goalName || label;

        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: { goalName },
          output: { goalAchieved: true },
        });
        break;
      }

      case 'END': {
        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          input: {},
          output: { terminated: true },
        });
        currNode = undefined;
        continue;
      }

      default: {
        executedNodes.push({
          nodeId: currNode.id,
          nodeType: type,
          nodeName: label,
          status: 'EXECUTED',
          output: {},
        });
      }
    }

    // Find next edge
    const outgoing = edges.filter((e) => e.source === currNode.id);
    let selectedEdge = undefined;

    if (nextConditionEdge) {
      selectedEdge = outgoing.find((e) => e.sourceHandle === nextConditionEdge || e.data?.condition === nextConditionEdge);
    }
    if (!selectedEdge && outgoing.length > 0) {
      selectedEdge = outgoing[0];
    }

    if (selectedEdge) {
      currNode = nodes.find((n) => n.id === selectedEdge.target);
    } else {
      currNode = undefined;
    }
  }

  return {
    status: 'COMPLETED',
    executedNodes,
    evaluatedConditions,
    executedActions,
    context,
    goalAchieved,
    goalName,
  };
}
