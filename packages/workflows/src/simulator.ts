import type {
  WorkflowGraph,
  WorkflowNode,
  WorkflowEdge,
  ConditionOperator,
} from '@insta-automation/types';
import {
  ExecutionContext,
  createInitialContext,
  resolveTemplateVariables,
  getNestedValue,
  setNestedValue,
} from './variables';

export interface EvaluatedNodeResult {
  nodeId: string;
  type: string;
  name: string;
  status: 'EXECUTED' | 'SKIPPED' | 'FAILED';
  input?: any;
  output?: any;
  durationMs: number;
}

export interface EvaluatedConditionResult {
  nodeId: string;
  operator: ConditionOperator;
  fieldValue: any;
  targetValue: any;
  result: boolean;
  edgeFollowed: string;
}

export interface ExecutedActionResult {
  nodeId: string;
  actionType: string;
  payload: Record<string, any>;
  result: Record<string, any>;
}

export interface SimulationResult {
  status: 'COMPLETED' | 'FAILED';
  executedNodes: EvaluatedNodeResult[];
  evaluatedConditions: EvaluatedConditionResult[];
  executedActions: ExecutedActionResult[];
  context: ExecutionContext;
  goalAchieved: boolean;
  goalName?: string;
  error?: string;
}

export class WorkflowSimulator {
  public simulate(graph: WorkflowGraph, inputEvent: any): SimulationResult {
    const context = createInitialContext(inputEvent, graph);
    const executedNodes: EvaluatedNodeResult[] = [];
    const evaluatedConditions: EvaluatedConditionResult[] = [];
    const executedActions: ExecutedActionResult[] = [];

    let goalAchieved = false;
    let goalName: string | undefined = undefined;

    // 1. Find TRIGGER node
    const triggerNode = graph.nodes.find((n) => n.type === 'TRIGGER');
    if (!triggerNode) {
      return {
        status: 'FAILED',
        executedNodes: [],
        evaluatedConditions: [],
        executedActions: [],
        context,
        goalAchieved: false,
        error: 'Workflow has no TRIGGER node',
      };
    }

    let currentNode: WorkflowNode | undefined = triggerNode;
    const visitedNodes = new Set<string>();

    while (currentNode && !visitedNodes.has(currentNode.id)) {
      visitedNodes.add(currentNode.id);
      const startTime = Date.now();

      // Process current node
      let nextEdgeCondition: string | undefined = undefined;

      try {
        switch (currentNode.type) {
          case 'TRIGGER': {
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: inputEvent,
              output: { matchedTrigger: graph.trigger?.type || currentNode.config?.triggerType },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'CONDITION': {
            const fieldPath = currentNode.config?.field || 'comment.text';
            const operator = currentNode.config?.operator || 'contains';
            const targetVal = currentNode.config?.value;

            const fieldValue = getNestedValue(context, fieldPath);
            const isMatch = this.evaluateCondition(operator, fieldValue, targetVal, currentNode.config, context);

            nextEdgeCondition = isMatch ? 'true' : 'false';

            evaluatedConditions.push({
              nodeId: currentNode.id,
              operator,
              fieldValue,
              targetValue: targetVal,
              result: isMatch,
              edgeFollowed: nextEdgeCondition,
            });

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { fieldPath, fieldValue, operator, targetValue: targetVal },
              output: { result: isMatch, branchTaken: nextEdgeCondition },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'ACTION': {
            const actionType = currentNode.config?.actionType || 'PUBLIC_REPLY';
            const actionOutput = this.executeAction(actionType, currentNode.config, context);

            executedActions.push({
              nodeId: currentNode.id,
              actionType,
              payload: currentNode.config,
              result: actionOutput,
            });

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: currentNode.config,
              output: actionOutput,
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'SET_VARIABLE': {
            const varName = currentNode.config?.variableName || 'custom_var';
            const varVal = resolveTemplateVariables(String(currentNode.config?.variableValue || ''), context) || currentNode.config?.variableValue;

            setNestedValue(context.custom, varName, varVal);

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { varName, varVal },
              output: { updatedCustom: context.custom },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'DELAY': {
            const delayMs = currentNode.config?.delayMs || 1000;
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { delayMs },
              output: { simulatedDelayMs: delayMs },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'BRANCH': {
            const branches = currentNode.config?.branches || [];
            let branchMatch = branches[0]?.id || 'branch_default';

            for (const b of branches) {
              if (b.value && String(context.comment.text).toLowerCase().includes(String(b.value).toLowerCase())) {
                branchMatch = b.id;
                break;
              }
            }

            nextEdgeCondition = branchMatch;

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { branches },
              output: { branchTaken: branchMatch },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'AI_DECISION': {
            const text = context.comment.text.toLowerCase();
            let decision = 'general_inquiry';
            if (text.includes('price') || text.includes('cost') || text.includes('how much')) {
              decision = 'price_inquiry';
            } else if (text.includes('location') || text.includes('where')) {
              decision = 'location_inquiry';
            }

            nextEdgeCondition = decision;

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { prompt: currentNode.config?.prompt },
              output: { aiDecision: decision },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'HTTP_REQUEST': {
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { url: currentNode.config?.httpUrl, method: currentNode.config?.httpMethod || 'GET' },
              output: { statusCode: 200, body: { success: true } },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'WAIT_FOR_EVENT': {
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { eventType: currentNode.config?.eventType || 'REPLY_RECEIVED' },
              output: { status: 'EVENT_RECEIVED' },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'GOAL': {
            goalAchieved = true;
            goalName = currentNode.config?.goalName || currentNode.name;

            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: { goalName },
              output: { goalAchieved: true },
              durationMs: Date.now() - startTime,
            });
            break;
          }

          case 'END': {
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: {},
              output: { terminated: true },
              durationMs: Date.now() - startTime,
            });
            // Terminate graph execution
            currentNode = undefined;
            continue;
          }

          default: {
            executedNodes.push({
              nodeId: currentNode.id,
              type: currentNode.type,
              name: currentNode.name,
              status: 'EXECUTED',
              input: currentNode.config,
              output: {},
              durationMs: Date.now() - startTime,
            });
          }
        }
      } catch (err: any) {
        executedNodes.push({
          nodeId: currentNode.id,
          type: currentNode.type,
          name: currentNode.name,
          status: 'FAILED',
          input: currentNode.config,
          output: { error: err.message },
          durationMs: Date.now() - startTime,
        });

        return {
          status: 'FAILED',
          executedNodes,
          evaluatedConditions,
          executedActions,
          context,
          goalAchieved,
          goalName,
          error: err.message,
        };
      }

      // 2. Find next edge and next node
      const currentId = currentNode.id;
      const outgoingEdges = graph.edges.filter((e) => e.source === currentId);

      let selectedEdge: WorkflowEdge | undefined = undefined;

      if (nextEdgeCondition !== undefined) {
        selectedEdge = outgoingEdges.find((e) => e.condition === nextEdgeCondition);
      }
      if (!selectedEdge && outgoingEdges.length > 0) {
        selectedEdge = outgoingEdges[0];
      }

      if (selectedEdge) {
        currentNode = graph.nodes.find((n) => n.id === selectedEdge!.target);
      } else {
        currentNode = undefined;
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

  private evaluateCondition(
    operator: ConditionOperator,
    fieldValue: any,
    targetValue: any,
    config: any,
    context: ExecutionContext
  ): boolean {
    const valStr = String(fieldValue || '').toLowerCase();
    const targetStr = String(targetValue || '').toLowerCase();

    switch (operator) {
      case 'contains':
        return valStr.includes(targetStr);

      case 'equals':
        return valStr === targetStr;

      case 'startsWith':
        return valStr.startsWith(targetStr);

      case 'regex':
        try {
          const rx = new RegExp(targetValue || '', 'i');
          return rx.test(String(fieldValue || ''));
        } catch {
          return false;
        }

      case 'intent':
        if (targetStr === 'price_inquiry' || targetStr === 'price') {
          return valStr.includes('price') || valStr.includes('cost') || valStr.includes('how much');
        }
        return valStr.includes(targetStr);

      case 'sentiment':
        if (targetStr === 'positive') {
          return valStr.includes('love') || valStr.includes('great') || valStr.includes('awesome') || valStr.includes('thanks');
        }
        if (targetStr === 'negative') {
          return valStr.includes('bad') || valStr.includes('hate') || valStr.includes('worst') || valStr.includes('terrible');
        }
        return true; // neutral default

      case 'customer_tag':
        const targetTag = config?.targetTag || targetValue;
        return context.customer.tags.includes(targetTag);

      case 'lead_score':
        const minScore = config?.minScore || Number(targetValue) || 0;
        return context.customer.score >= minScore;

      default:
        return valStr.includes(targetStr);
    }
  }

  private executeAction(actionType: string, config: any, context: ExecutionContext): Record<string, any> {
    switch (actionType) {
      case 'PUBLIC_REPLY': {
        const text = resolveTemplateVariables(config?.replyText || 'Thank you!', context);
        return { replyId: `sim_reply_${Date.now()}`, replyText: text, channel: 'INSTAGRAM_COMMENT' };
      }

      case 'SEND_MESSAGE': {
        const text = resolveTemplateVariables(config?.messageText || 'Hello from Instagram Automation!', context);
        return { messageId: `sim_msg_${Date.now()}`, messageText: text, channel: 'INSTAGRAM_DM' };
      }

      case 'ADD_TAG': {
        const tagName = config?.tagName || 'lead';
        if (!context.customer.tags.includes(tagName)) {
          context.customer.tags.push(tagName);
        }
        return { tagAdded: tagName, currentTags: context.customer.tags };
      }

      case 'CREATE_LEAD': {
        context.customer.score += 10;
        return { leadId: `sim_lead_${Date.now()}`, status: 'NEW', customerScore: context.customer.score };
      }

      case 'UPDATE_LEAD': {
        const status = config?.leadStatus || 'QUALIFIED';
        return { status, updated: true };
      }

      case 'NOTIFY_TEAM': {
        const msg = resolveTemplateVariables(config?.notificationMessage || 'New lead generated!', context);
        return { notificationSent: true, message: msg };
      }

      case 'CREATE_TASK': {
        const title = resolveTemplateVariables(config?.taskTitle || 'Follow up with customer', context);
        return { taskId: `sim_task_${Date.now()}`, title, status: 'OPEN' };
      }

      default:
        return { actionExecuted: actionType };
    }
  }
}

export const workflowSimulator = new WorkflowSimulator();
