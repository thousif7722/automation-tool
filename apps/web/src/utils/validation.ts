import { ValidationError } from '../types/workflow';

export function validateWorkflowGraph(nodes: any[], edges: any[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Check for Trigger node
  const triggerNodes = nodes.filter((n) => n.data?.nodeType === 'TRIGGER');
  if (triggerNodes.length === 0) {
    errors.push({
      id: 'err_no_trigger',
      severity: 'ERROR',
      message: 'A workflow cannot publish without a trigger node.',
    });
  }

  // 2. Validate Node Configurations & Connections
  for (const node of nodes) {
    const type = node.data?.nodeType;
    const config = node.data?.config || {};
    const label = node.data?.label || node.id;

    // Trigger validation
    if (type === 'TRIGGER' && !config.triggerType) {
      errors.push({
        id: `err_trigger_${node.id}`,
        nodeId: node.id,
        severity: 'ERROR',
        message: `Trigger node "${label}" requires an Instagram trigger type.`,
      });
    }

    // Condition validation
    if (type === 'CONDITION') {
      if (!config.value && config.operator !== 'sentiment') {
        errors.push({
          id: `err_condition_${node.id}`,
          nodeId: node.id,
          severity: 'ERROR',
          message: `Condition node "${label}" requires a match value.`,
        });
      }
    }

    // Action validation
    if (type === 'ACTION') {
      const actionType = config.actionType || 'PUBLIC_REPLY';
      if (actionType === 'PUBLIC_REPLY' && !config.replyText) {
        errors.push({
          id: `err_action_reply_${node.id}`,
          nodeId: node.id,
          severity: 'ERROR',
          message: `Action node "${label}" requires a public reply text.`,
        });
      }
      if (actionType === 'SEND_MESSAGE' && !config.messageText) {
        errors.push({
          id: `err_action_msg_${node.id}`,
          nodeId: node.id,
          severity: 'ERROR',
          message: `Action node "${label}" requires a private DM message text.`,
        });
      }
    }

    // Connection validation
    const incomingEdges = edges.filter((e) => e.target === node.id);
    const outgoingEdges = edges.filter((e) => e.source === node.id);

    if (type === 'TRIGGER' && incomingEdges.length > 0) {
      errors.push({
        id: `err_trigger_incoming_${node.id}`,
        nodeId: node.id,
        severity: 'ERROR',
        message: `Trigger node "${label}" cannot have incoming connections.`,
      });
    }

    if ((type === 'END' || type === 'GOAL') && outgoingEdges.length > 0) {
      errors.push({
        id: `err_end_outgoing_${node.id}`,
        nodeId: node.id,
        severity: 'WARNING',
        message: `End/Goal node "${label}" has outgoing edges that will not be executed.`,
      });
    }

    if (type !== 'TRIGGER' && incomingEdges.length === 0) {
      errors.push({
        id: `err_unreachable_${node.id}`,
        nodeId: node.id,
        severity: 'WARNING',
        message: `Node "${label}" has no incoming connections and is unreachable.`,
      });
    }
  }

  // 3. Cycle Detection via DFS
  if (triggerNodes.length > 0) {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function detectCycle(nodeId: string): boolean {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const out = edges.filter((e) => e.source === nodeId);
      for (const edge of out) {
        if (detectCycle(edge.target)) return true;
      }

      recStack.delete(nodeId);
      return false;
    }

    let hasCycle = false;
    for (const tNode of triggerNodes) {
      if (detectCycle(tNode.id)) {
        hasCycle = true;
        break;
      }
    }

    if (hasCycle) {
      errors.push({
        id: 'err_cycle',
        severity: 'WARNING',
        message: 'Cycle detected in workflow graph! Loops may execute repeatedly.',
      });
    }
  }

  return errors;
}

export function estimateExecutionPath(nodes: any[], edges: any[]): string[] {
  const triggerNode = nodes.find((n) => n.data?.nodeType === 'TRIGGER');
  if (!triggerNode) return [];

  const path: string[] = [];
  let currId: string | undefined = triggerNode.id;
  const visited = new Set<string>();

  while (currId && !visited.has(currId)) {
    visited.add(currId);
    path.push(currId);

    const outEdge = edges.find((e) => e.source === currId && (e.sourceHandle === 'true' || !e.sourceHandle));
    currId = outEdge ? outEdge.target : undefined;
  }

  return path;
}
