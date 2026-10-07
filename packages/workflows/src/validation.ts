import { WorkflowNode, WorkflowEdge } from '@insta-automation/types';

export interface WorkflowValidationError {
  nodeId?: string;
  code: 'MISSING_TRIGGER' | 'UNREACHABLE_NODE' | 'MISSING_CONFIG' | 'CYCLE_DETECTED' | 'INVALID_CONNECTION';
  message: string;
}

export function validateWorkflowGraph(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowValidationError[] {
  const errors: WorkflowValidationError[] = [];

  // 1. Must have a TRIGGER node
  const triggerNodes = nodes.filter((n) => n.type === 'TRIGGER');
  if (triggerNodes.length === 0) {
    errors.push({
      code: 'MISSING_TRIGGER',
      message: 'Workflow must have at least one Trigger node.',
    });
  }

  // 2. Node Config Check
  for (const node of nodes) {
    if (!node.config) {
      errors.push({
        nodeId: node.id,
        code: 'MISSING_CONFIG',
        message: `Node '${node.id}' is missing configuration data.`,
      });
    }
  }

  // 3. Reachability & Cycle Check (DFS)
  const adjacency = new Map<string, string[]>();

  for (const n of nodes) {
    adjacency.set(n.id, []);
  }
  for (const e of edges) {
    if (adjacency.has(e.source)) {
      adjacency.get(e.source)!.push(e.target);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adjacency.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  // Run DFS from triggers
  let hasCycle = false;
  for (const trigger of triggerNodes) {
    if (dfs(trigger.id)) {
      hasCycle = true;
      break;
    }
  }

  if (hasCycle) {
    errors.push({
      code: 'CYCLE_DETECTED',
      message: 'Workflow graph contains an infinite loop or cycle.',
    });
  }

  // Unreachable nodes check
  for (const node of nodes) {
    if (!visited.has(node.id) && node.type !== 'TRIGGER') {
      errors.push({
        nodeId: node.id,
        code: 'UNREACHABLE_NODE',
        message: `Node '${node.id}' (${node.name || node.type}) is unreachable from any trigger.`,
      });
    }
  }

  return errors;
}
