export type WorkflowNodeType =
  | 'TRIGGER'
  | 'CONDITION'
  | 'ACTION'
  | 'DELAY'
  | 'BRANCH'
  | 'AI_DECISION'
  | 'SET_VARIABLE'
  | 'HTTP_REQUEST'
  | 'WAIT_FOR_EVENT'
  | 'GOAL'
  | 'END';

export type InstagramTriggerType =
  | 'COMMENT_CREATED'
  | 'MESSAGE_RECEIVED'
  | 'MENTION_CREATED'
  | 'STORY_REPLY';

export type WorkflowActionType =
  | 'PUBLIC_REPLY'
  | 'SEND_MESSAGE'
  | 'ADD_TAG'
  | 'CREATE_LEAD'
  | 'UPDATE_LEAD'
  | 'NOTIFY_TEAM'
  | 'CREATE_TASK';

export type ConditionOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'regex'
  | 'intent'
  | 'sentiment'
  | 'customer_tag'
  | 'lead_score';

export type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface WorkflowNodeConfig {
  triggerType?: InstagramTriggerType;
  field?: string;
  operator?: ConditionOperator;
  value?: any;
  targetTag?: string;
  minScore?: number;
  actionType?: WorkflowActionType;
  replyText?: string;
  messageText?: string;
  tagName?: string;
  leadStatus?: string;
  notificationMessage?: string;
  taskTitle?: string;
  delayMs?: number;
  branches?: Array<{ id: string; name: string; value: any }>;
  prompt?: string;
  variableName?: string;
  variableValue?: any;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  httpUrl?: string;
  goalName?: string;
  [key: string]: any;
}

export interface WorkflowNodeData {
  label: string;
  nodeType: WorkflowNodeType;
  config: WorkflowNodeConfig;
  status?: 'IDLE' | 'EXECUTING' | 'EXECUTED' | 'FAILED';
  [key: string]: any;
}

export interface WorkflowVersion {
  version: number;
  status: WorkflowStatus;
  publishedAt?: string;
  nodesCount: number;
  createdAt: string;
  graphData: {
    nodes: any[];
    edges: any[];
  };
}

export interface ValidationError {
  id: string;
  nodeId?: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface SimulationStep {
  nodeId: string;
  nodeType: WorkflowNodeType;
  nodeName: string;
  status: 'EXECUTED' | 'FAILED';
  input?: any;
  output?: any;
}

export interface SimulationResult {
  status: 'COMPLETED' | 'FAILED';
  executedNodes: SimulationStep[];
  evaluatedConditions: Array<{
    nodeId: string;
    operator: string;
    fieldValue: any;
    result: boolean;
    edgeFollowed: string;
  }>;
  executedActions: Array<{
    actionType: string;
    payload: any;
    result: any;
  }>;
  context: {
    customer: { username: string; tags: string[]; score: number };
    comment: { text: string };
    custom: Record<string, any>;
  };
  goalAchieved: boolean;
  goalName?: string;
  error?: string;
}
