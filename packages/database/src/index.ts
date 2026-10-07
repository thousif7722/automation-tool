import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  GlobalRole,
  AccountStatus,
  InstagramAccountMetadata,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTrigger,
  WorkflowStatus,
  BusinessProfile,
  KnowledgeDocumentType,
  CustomerIntent,
  AIConversationStatus,
  EscalationReason,
  LeadState,
  ScoringSignal,
  SubscriptionPlanSlug,
  BillingStatus,
} from '@insta-automation/types';

export interface IUserDocument extends Document {
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  globalRole: GlobalRole;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String },
    globalRole: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel: Model<IUserDocument> =
  (mongoose.models.User as Model<IUserDocument>) ?? mongoose.model<IUserDocument>('User', UserSchema);

export interface IWorkspaceDocument extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  members: Array<{ userId: mongoose.Types.ObjectId; role: string; joinedAt: Date }>;
  logoUrl?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ userId: { type: Schema.Types.ObjectId, ref: 'User' }, role: String, joinedAt: Date }],
    logoUrl: { type: String },
    settings: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const WorkspaceModel: Model<IWorkspaceDocument> =
  (mongoose.models.Workspace as Model<IWorkspaceDocument>) ?? mongoose.model<IWorkspaceDocument>('Workspace', WorkspaceSchema);

export interface IInstagramAccountDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  instagramUserId: string;
  username: string;
  profilePicUrl?: string;
  accountMetadata?: InstagramAccountMetadata;
  accessTokenEncrypted?: string;
  accessTokenIV?: string;
  accessTokenTag?: string;
  status: AccountStatus;
  connectedAt?: Date;
  tokenExpiresAt?: Date;
  permissions?: string[];
  lastSuccessfulApiRequest?: Date;
  lastWebhookEvent?: Date;
  lastHealthCheckAt?: Date;
  healthError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstagramAccountSchema = new Schema<IInstagramAccountDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    instagramUserId: { type: String, required: true, index: true },
    username: { type: String, required: true },
    profilePicUrl: { type: String },
    accountMetadata: { type: Schema.Types.Mixed },
    accessTokenEncrypted: { type: String, select: false },
    accessTokenIV: { type: String, select: false },
    accessTokenTag: { type: String, select: false },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED', 'REVOKED', 'ERROR', 'PENDING'],
      default: 'DISCONNECTED',
      index: true,
    },
    connectedAt: { type: Date },
    tokenExpiresAt: { type: Date },
    permissions: [{ type: String }],
    lastSuccessfulApiRequest: { type: Date },
    lastWebhookEvent: { type: Date },
    lastHealthCheckAt: { type: Date },
    healthError: { type: String },
  },
  { timestamps: true }
);
InstagramAccountSchema.index({ workspaceId: 1, instagramUserId: 1 }, { unique: true });

export const InstagramAccountModel: Model<IInstagramAccountDocument> =
  (mongoose.models.InstagramAccount as Model<IInstagramAccountDocument>) ?? mongoose.model<IInstagramAccountDocument>('InstagramAccount', InstagramAccountSchema);

export interface IProcessedEventDocument extends Document {
  eventId: string;
  workspaceId: mongoose.Types.ObjectId;
  accountId: string;
  eventType: string;
  processedAt: Date;
}

const ProcessedEventSchema = new Schema<IProcessedEventDocument>(
  {
    eventId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    accountId: { type: String, required: true },
    eventType: { type: String, required: true },
    processedAt: { type: Date, default: Date.now, expires: 604800 },
  },
  { timestamps: true }
);
ProcessedEventSchema.index({ workspaceId: 1, eventId: 1 }, { unique: true });

export const ProcessedEventModel: Model<IProcessedEventDocument> =
  (mongoose.models.ProcessedEvent as Model<IProcessedEventDocument>) ?? mongoose.model<IProcessedEventDocument>('ProcessedEvent', ProcessedEventSchema);

export interface IAutomationEventDocument extends Document {
  eventId: string;
  tenantId: mongoose.Types.ObjectId;
  accountId: string;
  source: string;
  type: string;
  timestamp: Date;
  actor: { id: string; username?: string; type: string };
  resource: { id: string; type: string };
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AutomationEventSchema = new Schema<IAutomationEventDocument>(
  {
    eventId: { type: String, required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    accountId: { type: String, required: true, index: true },
    source: { type: String, required: true, default: 'INSTAGRAM' },
    type: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    actor: {
      id: { type: String, required: true },
      username: { type: String },
      type: { type: String, default: 'CUSTOMER' },
    },
    resource: {
      id: { type: String, required: true },
      type: { type: String, required: true },
    },
    payload: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);
AutomationEventSchema.index({ tenantId: 1, eventId: 1 }, { unique: true });

export const AutomationEventModel: Model<IAutomationEventDocument> =
  (mongoose.models.AutomationEvent as Model<IAutomationEventDocument>) ?? mongoose.model<IAutomationEventDocument>('AutomationEvent', AutomationEventSchema);

export type WorkflowRunState = 'PENDING' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type StepExecutionState = 'PENDING' | 'RUNNING' | 'WAITING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface IStepExecution {
  stepExecutionId: string;
  actionId: string;
  name: string;
  type: string;
  status: StepExecutionState;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IWorkflowRunDocument extends Document {
  workflowRunId: string;
  eventId: string;
  workspaceId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  status: WorkflowRunState;
  steps: IStepExecution[];
  currentStepIndex: number;
  correlationId: string;
  executionId: string;
  error?: string;
  retryCount: number;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowRunSchema = new Schema<IWorkflowRunDocument>(
  {
    workflowRunId: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    steps: [
      {
        stepExecutionId: { type: String, required: true },
        actionId: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        status: {
          type: String,
          enum: ['PENDING', 'RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'SKIPPED'],
          default: 'PENDING',
        },
        input: { type: Schema.Types.Mixed },
        output: { type: Schema.Types.Mixed },
        error: { type: String },
        startedAt: { type: Date },
        completedAt: { type: Date },
      },
    ],
    currentStepIndex: { type: Number, default: 0 },
    correlationId: { type: String, required: true, index: true },
    executionId: { type: String, required: true, index: true },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const WorkflowRunModel: Model<IWorkflowRunDocument> =
  (mongoose.models.WorkflowRun as Model<IWorkflowRunDocument>) ?? mongoose.model<IWorkflowRunDocument>('WorkflowRun', WorkflowRunSchema);

export interface IDeadLetterJobDocument extends Document {
  jobId: string;
  queueName: string;
  workspaceId: string;
  eventId: string;
  workflowRunId?: string;
  payload: Record<string, any>;
  failedReason: string;
  stackTrace?: string;
  failedAt: Date;
}

const DeadLetterJobSchema = new Schema<IDeadLetterJobDocument>(
  {
    jobId: { type: String, required: true, index: true },
    queueName: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    eventId: { type: String, required: true, index: true },
    workflowRunId: { type: String },
    payload: { type: Schema.Types.Mixed, required: true },
    failedReason: { type: String, required: true },
    stackTrace: { type: String },
    failedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const DeadLetterJobModel: Model<IDeadLetterJobDocument> =
  (mongoose.models.DeadLetterJob as Model<IDeadLetterJobDocument>) ?? mongoose.model<IDeadLetterJobDocument>('DeadLetterJob', DeadLetterJobSchema);

export interface IWorkflowDefinitionDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  workflowKey: string;
  name: string;
  description?: string;
  version: number;
  status: WorkflowStatus;
  isLatest: boolean;
  publishedAt?: Date;
  trigger: WorkflowTrigger;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinitionDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    workflowKey: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    version: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    isLatest: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date },
    trigger: {
      type: { type: String, required: true },
      config: { type: Schema.Types.Mixed, default: {} },
    },
    nodes: [{ type: Schema.Types.Mixed, required: true }],
    edges: [{ type: Schema.Types.Mixed, required: true }],
    variables: { type: Schema.Types.Mixed, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

WorkflowDefinitionSchema.index({ workspaceId: 1, workflowKey: 1, version: 1 }, { unique: true });

export const WorkflowDefinitionModel: Model<IWorkflowDefinitionDocument> =
  (mongoose.models.WorkflowDefinition as Model<IWorkflowDefinitionDocument>) ??
  mongoose.model<IWorkflowDefinitionDocument>('WorkflowDefinition', WorkflowDefinitionSchema);

// ==========================================
// AI AUDIT LOG MODEL & SCHEMA
// ==========================================

export interface IAIAuditLogDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  agentId: string;
  modelName: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  input: Record<string, any>;
  output: Record<string, any>;
  toolCalls: Array<{
    toolName: string;
    input: Record<string, any>;
    riskLevel: string;
    status: string;
    executionDurationMs: number;
    error?: string;
  }>;
  untrustedInputFlagged: boolean;
  timestamp: Date;
}

const AIAuditLogSchema = new Schema<IAIAuditLogDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    agentId: { type: String, required: true, index: true },
    modelName: { type: String, required: true },
    provider: { type: String, required: true },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: Schema.Types.Mixed },
    toolCalls: [
      {
        toolName: { type: String, required: true },
        input: { type: Schema.Types.Mixed },
        riskLevel: { type: String, required: true },
        status: { type: String, required: true },
        executionDurationMs: { type: Number, default: 0 },
        error: { type: String },
      },
    ],
    untrustedInputFlagged: { type: Boolean, default: false, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AIAuditLogModel: Model<IAIAuditLogDocument> =
  (mongoose.models.AIAuditLog as Model<IAIAuditLogDocument>) ??
  mongoose.model<IAIAuditLogDocument>('AIAuditLog', AIAuditLogSchema);

// ==========================================
// BUSINESS PROFILE MODEL & SCHEMA
// ==========================================

export interface IBusinessProfileDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  brandName: string;
  description: string;
  industry: string;
  tone: string;
  languages: string[];
  businessHours: string;
  locations: string[];
  contactInfo: { email?: string; phone?: string; website?: string };
  products: Array<{ name: string; description: string; price: number }>;
  services: Array<{ name: string; description: string; price?: number }>;
  pricing: string;
  policies: Array<{ category: string; rule: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessProfileSchema = new Schema<IBusinessProfileDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true, index: true },
    brandName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    industry: { type: String, default: 'General' },
    tone: { type: String, default: 'professional' },
    languages: [{ type: String, default: 'en' }],
    businessHours: { type: String, default: 'Mon-Fri 9am-6pm' },
    locations: [{ type: String }],
    contactInfo: { type: Schema.Types.Mixed, default: {} },
    products: [{ type: Schema.Types.Mixed, default: [] }],
    services: [{ type: Schema.Types.Mixed, default: [] }],
    pricing: { type: String, default: '' },
    policies: [{ type: Schema.Types.Mixed, default: [] }],
  },
  { timestamps: true }
);

export const BusinessProfileModel: Model<IBusinessProfileDocument> =
  (mongoose.models.BusinessProfile as Model<IBusinessProfileDocument>) ??
  mongoose.model<IBusinessProfileDocument>('BusinessProfile', BusinessProfileSchema);

// ==========================================
// KNOWLEDGE ITEM MODEL & SCHEMA
// ==========================================

export interface IKnowledgeItemDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  title: string;
  documentType: KnowledgeDocumentType;
  content: string;
  tags: string[];
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeItemSchema = new Schema<IKnowledgeItemDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    documentType: {
      type: String,
      enum: ['FAQ', 'PDF', 'DOCUMENT', 'WEBSITE', 'PRODUCT_INFO', 'POLICY'],
      required: true,
      index: true,
    },
    content: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    sourceUrl: { type: String },
  },
  { timestamps: true }
);
KnowledgeItemSchema.index({ workspaceId: 1, title: 1 });

export const KnowledgeItemModel: Model<IKnowledgeItemDocument> =
  (mongoose.models.KnowledgeItem as Model<IKnowledgeItemDocument>) ??
  mongoose.model<IKnowledgeItemDocument>('KnowledgeItem', KnowledgeItemSchema);

// ==========================================
// UNIFIED INBOX & AI CONVERSATION MODEL
// ==========================================

export interface IAIConversationDocument extends Document {
  conversationId: string;
  workspaceId: mongoose.Types.ObjectId;
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
  messages: Array<{
    id: string;
    sender: 'CUSTOMER' | 'AI' | 'HUMAN_AGENT';
    content: string;
    timestamp: Date;
    intent?: CustomerIntent;
    escalationReason?: EscalationReason;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversationDocument>(
  {
    conversationId: { type: String, required: true, unique: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    customer: {
      username: { type: String, required: true, index: true },
      name: { type: String },
      avatarUrl: { type: String },
      leadScore: { type: Number, default: 0 },
      tags: [{ type: String }],
      email: { type: String },
      phone: { type: String },
    },
    aiStatus: {
      type: String,
      enum: ['AI_HANDLING', 'HUMAN_TAKEOVER', 'ESCALATED'],
      default: 'AI_HANDLING',
      index: true,
    },
    currentIntent: { type: String, default: 'general_question', index: true },
    lastMessage: { type: String, default: '' },
    lastMessageTimestamp: { type: Date, default: Date.now },
    unreadCount: { type: Number, default: 0 },
    messages: [
      {
        id: { type: String, required: true },
        sender: { type: String, enum: ['CUSTOMER', 'AI', 'HUMAN_AGENT'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        intent: { type: String },
        escalationReason: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const AIConversationModel: Model<IAIConversationDocument> =
  (mongoose.models.AIConversation as Model<IAIConversationDocument>) ??
  mongoose.model<IAIConversationDocument>('AIConversation', AIConversationSchema);

// ==========================================
// CUSTOMER CRM MODEL
// ==========================================

export interface ICustomerDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
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

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    instagramUsername: { type: String, required: true, index: true },
    name: { type: String, required: true },
    location: { type: String },
    language: { type: String, default: 'en' },
    tags: [{ type: String }],
    intent: { type: String, default: 'general_question' },
    lastInteraction: { type: Date, default: Date.now },
    conversationHistory: [
      {
        sender: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    leadScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);
CustomerSchema.index({ workspaceId: 1, instagramUsername: 1 }, { unique: true });

export const CustomerModel: Model<ICustomerDocument> =
  (mongoose.models.Customer as Model<ICustomerDocument>) ??
  mongoose.model<ICustomerDocument>('Customer', CustomerSchema);

// ==========================================
// LEAD CRM MODEL
// ==========================================

export interface ILeadDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  instagramUsername: string;
  instagramUserId?: string;
  keywordTriggered?: string;
  commentText?: string;
  source: string;
  product?: string;
  status: LeadState;
  score: number;
  owner?: string;
  value: number;
  capturedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILeadDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    instagramUsername: { type: String, required: true, index: true },
    instagramUserId: { type: String },
    keywordTriggered: { type: String },
    commentText: { type: String },
    source: { type: String, default: 'INSTAGRAM_DM' },
    product: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'CONVERTED', 'LOST'],
      default: 'NEW',
      index: true,
    },
    score: { type: Number, default: 0 },
    owner: { type: String },
    value: { type: Number, default: 0 },
    capturedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LeadModel: Model<ILeadDocument> =
  (mongoose.models.Lead as Model<ILeadDocument>) ?? mongoose.model<ILeadDocument>('Lead', LeadSchema);

// ==========================================
// LEAD EVENT MODEL
// ==========================================

export interface ILeadEventDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  leadId: string;
  signal: ScoringSignal;
  pointsAwarded: number;
  previousScore: number;
  newScore: number;
  timestamp: Date;
}

const LeadEventSchema = new Schema<ILeadEventDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    leadId: { type: String, required: true, index: true },
    signal: { type: String, required: true },
    pointsAwarded: { type: Number, required: true },
    previousScore: { type: Number, required: true },
    newScore: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LeadEventModel: Model<ILeadEventDocument> =
  (mongoose.models.LeadEvent as Model<ILeadEventDocument>) ?? mongoose.model<ILeadEventDocument>('LeadEvent', LeadEventSchema);

// ==========================================
// TASK & NOTE & TAG MODELS
// ==========================================

export interface ITaskDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  leadId: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  assignee?: string;
  createdAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    leadId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    dueDate: { type: Date },
    assignee: { type: String },
  },
  { timestamps: true }
);

export const TaskModel: Model<ITaskDocument> =
  (mongoose.models.Task as Model<ITaskDocument>) ?? mongoose.model<ITaskDocument>('Task', TaskSchema);

export interface INoteDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  leadId: string;
  author: string;
  content: string;
  createdAt: Date;
}

const NoteSchema = new Schema<INoteDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    leadId: { type: String, required: true, index: true },
    author: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const NoteModel: Model<INoteDocument> =
  (mongoose.models.Note as Model<INoteDocument>) ?? mongoose.model<INoteDocument>('Note', NoteSchema);

export interface ITagDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  customerCount: number;
}

const TagSchema = new Schema<ITagDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true },
    color: { type: String, default: '#6366f1' },
    customerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
TagSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const TagModel: Model<ITagDocument> =
  (mongoose.models.Tag as Model<ITagDocument>) ?? mongoose.model<ITagDocument>('Tag', TagSchema);

// ==========================================
// SCORING RULE MODEL
// ==========================================

export interface IScoringRuleDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  ruleId: string;
  signal: ScoringSignal;
  points: number;
  description: string;
  isEnabled: boolean;
}

const ScoringRuleSchema = new Schema<IScoringRuleDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    ruleId: { type: String, required: true },
    signal: { type: String, required: true },
    points: { type: Number, required: true },
    description: { type: String, required: true },
    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);
ScoringRuleSchema.index({ workspaceId: 1, ruleId: 1 }, { unique: true });

export const ScoringRuleModel: Model<IScoringRuleDocument> =
  (mongoose.models.ScoringRule as Model<IScoringRuleDocument>) ?? mongoose.model<IScoringRuleDocument>('ScoringRule', ScoringRuleSchema);

export interface IAutomationRuleDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: string;
  triggerKeywords: string[];
  matchType: string;
  publicReplyText: string;
  sendPrivateDM: boolean;
  privateDMText: string;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRuleDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'DRAFT'], default: 'DRAFT', index: true },
    triggerKeywords: [{ type: String, trim: true }],
    matchType: { type: String, default: 'contains' },
    publicReplyText: { type: String, default: '' },
    sendPrivateDM: { type: Boolean, default: true },
    privateDMText: { type: String, default: '' },
    triggerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AutomationRuleModel: Model<IAutomationRuleDocument> =
  (mongoose.models.AutomationRule as Model<IAutomationRuleDocument>) ?? mongoose.model<IAutomationRuleDocument>('AutomationRule', AutomationRuleSchema);

export interface IMessageDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  instagramUsername: string;
  channel: string;
  direction: string;
  content: string;
  status: string;
  timestamp: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    instagramUsername: { type: String, required: true },
    channel: { type: String, default: 'INSTAGRAM_DM' },
    direction: { type: String, default: 'OUTBOUND' },
    content: { type: String, required: true },
    status: { type: String, default: 'Delivered' },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const MessageModel: Model<IMessageDocument> =
  (mongoose.models.Message as Model<IMessageDocument>) ?? mongoose.model<IMessageDocument>('Message', MessageSchema);

export interface ISubscriptionDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  planSlug: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true, index: true },
    planSlug: { type: String, default: 'free' },
    status: { type: String, default: 'ACTIVE' },
    billingCycle: { type: String, default: 'monthly' },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 86_400_000) },
    cancelAtPeriodEnd: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SubscriptionModel: Model<ISubscriptionDocument> =
  (mongoose.models.Subscription as Model<ISubscriptionDocument>) ?? mongoose.model<ISubscriptionDocument>('Subscription', SubscriptionSchema);

export interface IUsageDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  dmCount: number;
  leadCount: number;
  workflowCount: number;
  connectedAccountCount: number;
}

const UsageSchema = new Schema<IUsageDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    periodStart: { type: Date, default: Date.now },
    periodEnd: { type: Date, default: () => new Date(Date.now() + 30 * 86_400_000) },
    dmCount: { type: Number, default: 0 },
    leadCount: { type: Number, default: 0 },
    workflowCount: { type: Number, default: 0 },
    connectedAccountCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UsageModel: Model<IUsageDocument> =
  (mongoose.models.Usage as Model<IUsageDocument>) ?? mongoose.model<IUsageDocument>('Usage', UsageSchema);

export interface IAuditLogDocument extends Document {
  workspaceId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource?: string;
  result: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String },
    result: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AuditLogModel: Model<IAuditLogDocument> =
  (mongoose.models.AuditLog as Model<IAuditLogDocument>) ?? mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);

export interface IWorkflowExecutionDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  workflowId: mongoose.Types.ObjectId;
  triggerEvent: string;
  status: string;
  logs: string[];
  durationMs?: number;
  executedAt: Date;
}

const WorkflowExecutionSchema = new Schema<IWorkflowExecutionDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true, index: true },
    triggerEvent: { type: String, required: true },
    status: { type: String, default: 'SUCCESS' },
    logs: [{ type: String }],
    durationMs: { type: Number },
    executedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WorkflowExecutionModel: Model<IWorkflowExecutionDocument> =
  (mongoose.models.WorkflowExecution as Model<IWorkflowExecutionDocument>) ?? mongoose.model<IWorkflowExecutionDocument>('WorkflowExecution', WorkflowExecutionSchema);

// ==========================================
// CONTENT ITEM MODEL & SCHEMA
// ==========================================

export interface IContentItemDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  title: string;
  idea: string;
  caption: string;
  hooks: string[];
  script?: string;
  hashtags: string[];
  status: string;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  scheduledFor?: Date;
  publishedAt?: Date;
  instagramMediaId?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContentItemSchema = new Schema<IContentItemDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    title: { type: String, required: true, trim: true },
    idea: { type: String, required: true },
    caption: { type: String, default: '' },
    hooks: [{ type: String }],
    script: { type: String },
    hashtags: [{ type: String }],
    status: {
      type: String,
      enum: ['IDEA', 'GENERATED', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED'],
      default: 'IDEA',
      index: true,
    },
    requiresApproval: { type: Boolean, default: true },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    scheduledFor: { type: Date },
    publishedAt: { type: Date },
    instagramMediaId: { type: String },
    mediaUrl: { type: String },
    mediaType: { type: String, default: 'IMAGE' },
  },
  { timestamps: true }
);

export const ContentItemModel: Model<IContentItemDocument> =
  (mongoose.models.ContentItem as Model<IContentItemDocument>) ?? mongoose.model<IContentItemDocument>('ContentItem', ContentItemSchema);

// ==========================================
// ANALYTICS SNAPSHOT MODEL & SCHEMA
// ==========================================

export interface IAnalyticsSnapshotDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
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
  date: Date;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshotDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    automationExecutions: { type: Number, default: 0 },
    aiResponses: { type: Number, default: 0 },
    humanEscalations: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AnalyticsSnapshotModel: Model<IAnalyticsSnapshotDocument> =
  (mongoose.models.AnalyticsSnapshot as Model<IAnalyticsSnapshotDocument>) ??
  mongoose.model<IAnalyticsSnapshotDocument>('AnalyticsSnapshot', AnalyticsSnapshotSchema);

// ==========================================
// INVOICE, AGENCY, & WHITE LABEL MODELS
// ==========================================

export interface IInvoiceDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: string;
  pdfUrl?: string;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoiceDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    amountDue: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    currency: { type: String, default: 'usd' },
    status: { type: String, enum: ['PAID', 'OPEN', 'VOID', 'UNCOLLECTIBLE'], default: 'OPEN' },
    pdfUrl: { type: String },
  },
  { timestamps: true }
);

export const InvoiceModel: Model<IInvoiceDocument> =
  (mongoose.models.Invoice as Model<IInvoiceDocument>) ?? mongoose.model<IInvoiceDocument>('Invoice', InvoiceSchema);

export interface IAgencyDocument extends Document {
  agencyName: string;
  ownerWorkspaceId: mongoose.Types.ObjectId;
  clients: Array<{
    clientId: string;
    clientWorkspaceId: mongoose.Types.ObjectId;
    clientName: string;
    role: string;
    joinedAt: Date;
  }>;
  createdAt: Date;
}

const AgencySchema = new Schema<IAgencyDocument>(
  {
    agencyName: { type: String, required: true },
    ownerWorkspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    clients: [
      {
        clientId: { type: String, required: true },
        clientWorkspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
        clientName: { type: String, required: true },
        role: { type: String, enum: ['CLIENT_ADMIN', 'CLIENT_VIEWER'], default: 'CLIENT_ADMIN' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const AgencyModel: Model<IAgencyDocument> =
  (mongoose.models.Agency as Model<IAgencyDocument>) ?? mongoose.model<IAgencyDocument>('Agency', AgencySchema);

export interface IWhiteLabelConfigDocument extends Document {
  workspaceId: mongoose.Types.ObjectId;
  enabled: boolean;
  customDomain?: string;
  brandName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  emailSenderName?: string;
  emailSenderAddress?: string;
}

const WhiteLabelConfigSchema = new Schema<IWhiteLabelConfigDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    customDomain: { type: String },
    brandName: { type: String },
    logoUrl: { type: String },
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#a855f7' },
    emailSenderName: { type: String },
    emailSenderAddress: { type: String },
  },
  { timestamps: true }
);

export const WhiteLabelConfigModel: Model<IWhiteLabelConfigDocument> =
  (mongoose.models.WhiteLabelConfig as Model<IWhiteLabelConfigDocument>) ??
  mongoose.model<IWhiteLabelConfigDocument>('WhiteLabelConfig', WhiteLabelConfigSchema);

let _isConnected = false;
export async function connectDatabase(uri: string): Promise<void> {
  if (_isConnected) return;
  await mongoose.connect(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
  _isConnected = true;
}
export async function disconnectDatabase(): Promise<void> {
  if (!_isConnected) return;
  await mongoose.disconnect();
  _isConnected = false;
}
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
