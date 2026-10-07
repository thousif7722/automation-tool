import {
  CustomerRecord,
  LeadRecord,
  LeadEventRecord,
  TaskRecord,
  NoteRecord,
  TagRecord,
  LeadState,
  CRMAnalytics,
  CustomerIntent,
} from '@insta-automation/types';
import {
  CustomerModel,
  LeadModel,
  LeadEventModel,
  TaskModel,
  NoteModel,
  TagModel,
} from '@insta-automation/database';
import { LeadScoringEngine } from './LeadScoringEngine';

export class CRMService {
  private customers: Map<string, CustomerRecord> = new Map();
  private leads: Map<string, LeadRecord> = new Map();
  private events: Map<string, LeadEventRecord[]> = new Map();
  private tasks: Map<string, TaskRecord[]> = new Map();
  private notes: Map<string, NoteRecord[]> = new Map();
  private tags: Map<string, TagRecord[]> = new Map();
  private scoringEngine = new LeadScoringEngine();

  // ==========================================
  // 1. CUSTOMER MANAGEMENT
  // ==========================================

  public async getOrCreateCustomer(
    workspaceId: string,
    instagramUsername: string,
    initialData: Partial<CustomerRecord> = {}
  ): Promise<CustomerRecord> {
    const key = `${workspaceId}:${instagramUsername}`;
    if (this.customers.has(key)) {
      return this.customers.get(key)!;
    }

    try {
      if (CustomerModel && CustomerModel.db && CustomerModel.db.readyState === 1) {
        const doc = await CustomerModel.findOne({ workspaceId, instagramUsername }).lean();
        if (doc) {
          const cust: CustomerRecord = {
            id: doc._id.toString(),
            workspaceId: doc.workspaceId.toString(),
            instagramUsername: doc.instagramUsername,
            name: doc.name,
            location: doc.location,
            language: doc.language,
            tags: doc.tags,
            intent: doc.intent as CustomerIntent,
            lastInteraction: doc.lastInteraction,
            conversationHistory: doc.conversationHistory,
            leadScore: doc.leadScore,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          this.customers.set(key, cust);
          return cust;
        }
      }
    } catch {}

    const newCust: CustomerRecord = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      instagramUsername,
      name: initialData.name || instagramUsername,
      location: initialData.location,
      language: initialData.language || 'en',
      tags: initialData.tags || ['new_customer'],
      intent: initialData.intent || 'general_question',
      lastInteraction: new Date(),
      conversationHistory: [],
      leadScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.customers.set(key, newCust);

    try {
      if (CustomerModel && CustomerModel.db && CustomerModel.db.readyState === 1) {
        await CustomerModel.create({ ...newCust, workspaceId });
      }
    } catch {}

    return newCust;
  }

  public async listCustomers(workspaceId: string): Promise<CustomerRecord[]> {
    return Array.from(this.customers.values()).filter((c) => c.workspaceId === workspaceId);
  }

  // ==========================================
  // 2. LEAD MANAGEMENT & PIPELINE
  // ==========================================

  public async getOrCreateLead(
    workspaceId: string,
    instagramUsername: string,
    source = 'INSTAGRAM_DM',
    product?: string,
    value = 100
  ): Promise<LeadRecord> {
    const customer = await this.getOrCreateCustomer(workspaceId, instagramUsername);
    const existing = Array.from(this.leads.values()).find(
      (l) => l.workspaceId === workspaceId && l.instagramUsername === instagramUsername
    );

    if (existing) return existing;

    const newLead: LeadRecord = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      customerId: customer.id,
      instagramUsername,
      source,
      product,
      status: 'NEW',
      score: customer.leadScore,
      value,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.leads.set(newLead.id, newLead);

    try {
      if (LeadModel && LeadModel.db && LeadModel.db.readyState === 1) {
        await LeadModel.create({ ...newLead, workspaceId });
      }
    } catch {}

    return newLead;
  }

  public async listLeads(workspaceId: string): Promise<LeadRecord[]> {
    return Array.from(this.leads.values()).filter((l) => l.workspaceId === workspaceId);
  }

  public async updateLeadStatus(workspaceId: string, leadId: string, status: LeadState): Promise<LeadRecord> {
    const lead = this.leads.get(leadId);
    if (!lead || lead.workspaceId !== workspaceId) {
      throw new Error(`Lead ${leadId} not found in workspace ${workspaceId}`);
    }

    lead.status = status;
    lead.updatedAt = new Date();
    this.leads.set(leadId, lead);

    try {
      if (LeadModel && LeadModel.db && LeadModel.db.readyState === 1) {
        await LeadModel.findByIdAndUpdate(leadId, { status, updatedAt: new Date() });
      }
    } catch {}

    return lead;
  }

  // ==========================================
  // 3. CONFIGURABLE LEAD SCORING PIPELINE
  // ==========================================

  public async processCustomerMessageForScoring(
    workspaceId: string,
    instagramUsername: string,
    messageText: string
  ): Promise<{ lead: LeadRecord; scoreDelta: number; signalsDetected: string[] }> {
    const customer = await this.getOrCreateCustomer(workspaceId, instagramUsername);
    const lead = await this.getOrCreateLead(workspaceId, instagramUsername);

    const rules = await this.scoringEngine.getScoringRules(workspaceId);
    const signals = this.scoringEngine.detectSignals(messageText);
    const scoreIncrement = this.scoringEngine.calculateScoreIncrement(signals, rules);

    const previousScore = lead.score;
    const newScore = previousScore + scoreIncrement;

    lead.score = newScore;
    customer.leadScore = newScore;
    customer.lastInteraction = new Date();
    customer.conversationHistory.push({
      sender: 'CUSTOMER',
      content: messageText,
      timestamp: new Date(),
    });

    // Auto-promote pipeline status based on score thresholds
    lead.status = this.scoringEngine.deriveLeadStateFromScore(newScore, lead.status);
    lead.updatedAt = new Date();

    this.leads.set(lead.id, lead);
    this.customers.set(`${workspaceId}:${instagramUsername}`, customer);

    // Record Lead Event audit log
    if (signals.length > 0) {
      const leadEvent: LeadEventRecord = {
        id: `levent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workspaceId,
        leadId: lead.id,
        signal: signals[0],
        pointsAwarded: scoreIncrement,
        previousScore,
        newScore,
        timestamp: new Date(),
      };
      const existingEvents = this.events.get(lead.id) || [];
      existingEvents.push(leadEvent);
      this.events.set(lead.id, existingEvents);

      try {
        if (LeadEventModel && LeadEventModel.db && LeadEventModel.db.readyState === 1) {
          await LeadEventModel.create({ ...leadEvent, workspaceId });
        }
      } catch {}
    }

    return { lead, scoreDelta: scoreIncrement, signalsDetected: signals };
  }

  // ==========================================
  // 4. TASKS, NOTES & TAGS
  // ==========================================

  public async createTask(
    workspaceId: string,
    leadId: string,
    title: string,
    description?: string,
    dueDate?: Date,
    assignee?: string
  ): Promise<TaskRecord> {
    const task: TaskRecord = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      leadId,
      title,
      description,
      status: 'PENDING',
      dueDate,
      assignee,
      createdAt: new Date(),
    };

    const existing = this.tasks.get(leadId) || [];
    existing.push(task);
    this.tasks.set(leadId, existing);

    try {
      if (TaskModel && TaskModel.db && TaskModel.db.readyState === 1) {
        await TaskModel.create({ ...task, workspaceId });
      }
    } catch {}

    return task;
  }

  public async listTasks(workspaceId: string, leadId: string): Promise<TaskRecord[]> {
    const leadTasks = this.tasks.get(leadId) || [];
    return leadTasks.filter((t) => t.workspaceId === workspaceId);
  }

  public async addNote(workspaceId: string, leadId: string, author: string, content: string): Promise<NoteRecord> {
    const note: NoteRecord = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      leadId,
      author,
      content,
      createdAt: new Date(),
    };

    const existing = this.notes.get(leadId) || [];
    existing.push(note);
    this.notes.set(leadId, existing);

    try {
      if (NoteModel && NoteModel.db && NoteModel.db.readyState === 1) {
        await NoteModel.create({ ...note, workspaceId });
      }
    } catch {}

    return note;
  }

  public async listNotes(workspaceId: string, leadId: string): Promise<NoteRecord[]> {
    const leadNotes = this.notes.get(leadId) || [];
    return leadNotes.filter((n) => n.workspaceId === workspaceId);
  }

  public async createTag(workspaceId: string, name: string, color = '#6366f1'): Promise<TagRecord> {
    const tag: TagRecord = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      name,
      color,
      customerCount: 0,
    };

    const existing = this.tags.get(workspaceId) || [];
    existing.push(tag);
    this.tags.set(workspaceId, existing);

    try {
      if (TagModel && TagModel.db && TagModel.db.readyState === 1) {
        await TagModel.create({ ...tag, workspaceId });
      }
    } catch {}

    return tag;
  }

  public async listTags(workspaceId: string): Promise<TagRecord[]> {
    return this.tags.get(workspaceId) || [];
  }

  // ==========================================
  // 5. CRM ANALYTICS ENGINE
  // ==========================================

  public async getCRMAnalytics(workspaceId: string): Promise<CRMAnalytics> {
    const workspaceCustomers = await this.listCustomers(workspaceId);
    const workspaceLeads = await this.listLeads(workspaceId);

    const leadsByStatus: Record<LeadState, number> = {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      HOT: 0,
      CONVERTED: 0,
      LOST: 0,
    };

    let totalValue = 0;
    let totalScore = 0;

    for (const lead of workspaceLeads) {
      if (leadsByStatus[lead.status] !== undefined) {
        leadsByStatus[lead.status] += 1;
      }
      totalValue += lead.value || 0;
      totalScore += lead.score || 0;
    }

    const totalLeads = workspaceLeads.length;
    const convertedCount = leadsByStatus.CONVERTED;
    const conversionRate = totalLeads > 0 ? (convertedCount / totalLeads) * 100 : 0;
    const averageLeadScore = totalLeads > 0 ? totalScore / totalLeads : 0;

    const intentBreakdown: Record<string, number> = {};
    for (const cust of workspaceCustomers) {
      intentBreakdown[cust.intent] = (intentBreakdown[cust.intent] || 0) + 1;
    }

    return {
      totalCustomers: workspaceCustomers.length,
      totalLeads,
      leadsByStatus,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalPipelineValue: totalValue,
      averageLeadScore: Math.round(averageLeadScore * 10) / 10,
      intentBreakdown,
    };
  }
}
