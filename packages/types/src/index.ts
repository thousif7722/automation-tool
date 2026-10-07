import type { Types } from 'mongoose';

export type ObjectId = Types.ObjectId | string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EDITOR' | 'VIEWER';

export interface WorkspaceMember {
  userId: ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface Workspace extends Timestamps {
  id: string;
  name: string;
  slug: string;
  ownerId: ObjectId;
  members: WorkspaceMember[];
  logoUrl?: string;
}

export type GlobalRole = 'user' | 'admin' | 'superadmin';
export type PlanSlug = 'free' | 'starter' | 'growth' | 'pro' | 'business' | 'enterprise';

export interface User extends Timestamps {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  isEmailVerified: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface TenantContext {
  workspaceId: string;
  workspaceName: string;
  userRole: WorkspaceRole;
  planSlug: PlanSlug;
}

export type ResourceAction =
  | 'workflow:read'
  | 'workflow:create'
  | 'workflow:update'
  | 'workflow:delete'
  | 'lead:read'
  | 'lead:create'
  | 'lead:update'
  | 'lead:delete'
  | 'customer:read'
  | 'customer:update'
  | 'message:read'
  | 'message:send'
  | 'message:write'
  | 'ai:read'
  | 'ai:update'
  | 'content:read'
  | 'content:create'
  | 'instagram:read'
  | 'instagram:connect'
  | 'instagram:disconnect'
  | 'analytics:read'
  | 'member:read'
  | 'member:invite'
  | 'billing:read'
  | 'billing:update'
  | 'workspace:update'
  | 'workspace:delete';

export type EventType =
  | 'COMMENT_CREATED'
  | 'MESSAGE_RECEIVED'
  | 'MENTION_CREATED'
  | 'STORY_REPLY'
  | 'MEDIA_EVENT';

export interface NormalizedEvent<T = any> {
  eventId: string;
  workspaceId: string;
  accountId: string;
  timestamp: Date;
  eventType: EventType;
  payload: T;
}

export interface MetaWebhookCommentEvent {
  eventId: string;
  workspaceId: string;
  commentId: string;
  mediaId: string;
  commentText: string;
  fromUserId: string;
  fromUsername: string;
  timestamp: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  globalRole: GlobalRole;
}

export type AccountStatus = 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'REVOKED' | 'ERROR' | 'PENDING';

export interface InstagramAccountMetadata {
  followersCount?: number;
  mediaCount?: number;
  website?: string;
  biography?: string;
  name?: string;
  profilePicUrl?: string;
}

// ==========================================
// CORE WORKFLOW ENGINE TYPES
// ==========================================

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
  branches?: Array<{ id: string; name: string; condition: string; value: any }>;
  prompt?: string;
  decisionOutputs?: string[];
  variableName?: string;
  variableValue?: any;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  httpUrl?: string;
  httpHeaders?: Record<string, string>;
  httpBody?: any;
  goalName?: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  config: WorkflowNodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowTrigger {
  type: InstagramTriggerType;
  config?: Record<string, any>;
}

export interface WorkflowGraph {
  workflowKey: string;
  name: string;
  description?: string;
  version: number;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
}

// ==========================================
// CUSTOMER-FACING INSTAGRAM AI AGENT TYPES
// ==========================================

export interface BusinessProduct {
  name: string;
  description: string;
  price: number;
  category?: string;
}

export interface BusinessService {
  name: string;
  description: string;
  price?: number;
}

export interface BusinessPolicy {
  category: string;
  rule: string;
}

export interface BusinessProfile {
  brandName: string;
  description: string;
  industry: string;
  tone: 'professional' | 'casual' | 'friendly' | 'witty' | 'luxurious';
  languages: string[];
  businessHours: string;
  locations: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  products: BusinessProduct[];
  services: BusinessService[];
  pricing: string;
  policies: BusinessPolicy[];
}

export type KnowledgeDocumentType = 'FAQ' | 'PDF' | 'DOCUMENT' | 'WEBSITE' | 'PRODUCT_INFO' | 'POLICY';

export interface KnowledgeItem {
  id: string;
  workspaceId: string;
  title: string;
  documentType: KnowledgeDocumentType;
  content: string;
  tags: string[];
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerIntent =
  | 'sales'
  | 'support'
  | 'pricing'
  | 'availability'
  | 'booking'
  | 'complaint'
  | 'refund'
  | 'general_question'
  | 'human_request'
  | 'spam'
  | 'unknown';

export type EscalationReason =
  | 'LOW_CONFIDENCE'
  | 'HUMAN_REQUESTED'
  | 'HIGH_RISK_COMPLAINT'
  | 'POLICY_REQUIRES_HUMAN'
  | 'UNRELIABLE_ANSWER';

export type AIConversationStatus = 'AI_HANDLING' | 'HUMAN_TAKEOVER' | 'ESCALATED';

export interface AIResponsePipelineResult {
  customerId: string;
  customerUsername: string;
  conversationId: string;
  classifiedIntent: CustomerIntent;
  intentConfidence: number;
  retrievedKnowledge: Array<{
    id: string;
    title: string;
    documentType: KnowledgeDocumentType;
    snippet: string;
    score: number;
  }>;
  policyEvaluated: boolean;
  decision: 'SEND_REPLY' | 'ESCALATE' | 'BLOCK';
  generatedResponse?: string;
  escalationReason?: EscalationReason;
  safetyPassed: boolean;
  platformCapabilityPassed: boolean;
  leadScoreDelta?: number;
  tagsAdded?: string[];
}

export interface UnifiedInboxMessage {
  id: string;
  sender: 'CUSTOMER' | 'AI' | 'HUMAN_AGENT';
  content: string;
  timestamp: Date;
  intent?: CustomerIntent;
  escalationReason?: EscalationReason;
}

export interface UnifiedInboxConversation {
  conversationId: string;
  workspaceId: string;
  customer: {
    username: string;
    name?: string;
    avatarUrl?: string;
    leadScore: number;
    tags: string[];
    email?: string;
    phone?: string;
  };
  aiStatus: AIConversationStatus;
  currentIntent: CustomerIntent;
  lastMessage: string;
  lastMessageTimestamp: Date;
  unreadCount: number;
  messages: UnifiedInboxMessage[];
}

// ==========================================
// CUSTOMER & LEAD MANAGEMENT SYSTEM TYPES
// ==========================================

export type LeadState = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'HOT' | 'CONVERTED' | 'LOST';

export type ScoringSignal =
  | 'price_question'
  | 'availability_question'
  | 'location_provided'
  | 'contact_info_provided'
  | 'product_selected'
  | 'purchase_intent'
  | 'repeat_engagement';

export interface ScoringRule {
  id: string;
  signal: ScoringSignal;
  points: number;
  description: string;
  isEnabled: boolean;
}

export interface CustomerRecord {
  id: string;
  workspaceId: string;
  instagramUsername: string;
  name: string;
  location?: string;
  language: string;
  tags: string[];
  intent: CustomerIntent;
  lastInteraction: Date;
  conversationHistory: Array<{ sender: string; content: string; timestamp: Date }>;
  leadScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadRecord {
  id: string;
  workspaceId: string;
  customerId: string;
  instagramUsername: string;
  source: string;
  product?: string;
  status: LeadState;
  score: number;
  owner?: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadEventRecord {
  id: string;
  workspaceId: string;
  leadId: string;
  signal: ScoringSignal;
  pointsAwarded: number;
  previousScore: number;
  newScore: number;
  timestamp: Date;
}

export interface TagRecord {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  customerCount: number;
}

export interface TaskRecord {
  id: string;
  workspaceId: string;
  leadId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: Date;
  assignee?: string;
  createdAt: Date;
}

export interface NoteRecord {
  id: string;
  workspaceId: string;
  leadId: string;
  author: string;
  content: string;
  createdAt: Date;
}

export interface CRMAnalytics {
  totalCustomers: number;
  totalLeads: number;
  leadsByStatus: Record<LeadState, number>;
  conversionRate: number;
  totalPipelineValue: number;
  averageLeadScore: number;
  intentBreakdown: Record<string, number>;
}

// ==========================================
// CONTENT & ANALYTICS PLATFORM TYPES
// ==========================================

export type ContentStatus =
  | 'IDEA'
  | 'GENERATED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'REJECTED';

export interface ContentItem {
  id: string;
  workspaceId: string;
  title: string;
  idea: string;
  caption: string;
  hooks: string[];
  script?: string;
  hashtags: string[];
  status: ContentStatus;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  scheduledFor?: Date;
  publishedAt?: Date;
  instagramMediaId?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REEL';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformAnalytics {
  reach: number;
  engagement: number;
  comments: number;
  messages: number;
  leads: number;
  qualifiedLeads: number;
  conversions: number;
  automationExecutions: number;
  aiResponses: number;
  humanEscalations: number;
  leadsGenerated: number;
  conversionRate: number;
  avgResponseTimeSeconds: number;
  aiResolutionRate: number;
  humanTakeoverRate: number;
  automationSuccessRate: number;
}

export interface AIAnalyticsQueryResponse {
  question: string;
  answer: string;
  evidence: Record<string, any>;
  confidence: number;
}

// ==========================================
// COMMERCIAL SAAS LAYER & ENTITLEMENT TYPES
// ==========================================

export type SubscriptionPlanSlug = 'free' | 'starter' | 'growth' | 'pro' | 'business' | 'enterprise';

export type MeteredResource =
  | 'instagramAccounts'
  | 'teamMembers'
  | 'automationRuns'
  | 'aiUsage'
  | 'conversations'
  | 'contacts'
  | 'knowledgeStorage'
  | 'analyticsRetention';

export interface PlanLimits {
  maxInstagramAccounts: number; // e.g. 1, 3, 10, 25, 100, Infinity
  maxTeamMembers: number; // e.g. 1, 2, 5, 15, 50, Infinity
  maxAutomationRunsPerMonth: number; // e.g. 1000, 5000, 25000, 100000, 500000, Infinity
  maxAIResponsesPerMonth: number; // e.g. 100, 1000, 5000, 25000, 100000, Infinity
  maxConversationsPerMonth: number;
  maxContacts: number;
  maxKnowledgeStorageMB: number;
  analyticsRetentionDays: number;
  featureFlags: {
    aiAgentEnabled: boolean;
    crmEnabled: boolean;
    contentStudioEnabled: boolean;
    agencyModeEnabled: boolean;
    whiteLabelEnabled: boolean;
    customDomainEnabled: boolean;
    prioritySupport: boolean;
  };
}

export type BillingStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'PAUSED';

export interface SubscriptionRecord {
  id: string;
  workspaceId: string;
  planSlug: SubscriptionPlanSlug;
  status: BillingStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageRecord {
  workspaceId: string;
  instagramAccounts: number;
  teamMembers: number;
  automationRunsThisMonth: number;
  aiResponsesThisMonth: number;
  conversationsThisMonth: number;
  contactsCount: number;
  knowledgeStorageMB: number;
}

export interface InvoiceRecord {
  id: string;
  workspaceId: string;
  amountDue: number; // in cents
  amountPaid: number;
  currency: string;
  status: 'PAID' | 'OPEN' | 'VOID' | 'UNCOLLECTIBLE';
  pdfUrl?: string;
  createdAt: Date;
}

export interface AgencyRecord {
  id: string;
  agencyName: string;
  ownerWorkspaceId: string;
  clients: Array<{
    clientId: string;
    clientWorkspaceId: string;
    clientName: string;
    role: 'CLIENT_ADMIN' | 'CLIENT_VIEWER';
    joinedAt: Date;
  }>;
  createdAt: Date;
}

export interface WhiteLabelConfig {
  workspaceId: string;
  enabled: boolean;
  customDomain?: string;
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailSenderName?: string;
  emailSenderAddress?: string;
}
