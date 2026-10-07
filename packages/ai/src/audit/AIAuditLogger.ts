import { AIAuditLogModel } from '@insta-automation/database';

export interface AuditLogEntry {
  workspaceId: string;
  agentId: string;
  modelName: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  toolCalls: Array<{
    toolName: string;
    input: Record<string, any>;
    riskLevel: string;
    status: string;
    executionDurationMs: number;
    error?: string;
  }>;
  untrustedInputFlagged: boolean;
}

const globalAuditLogsKey = Symbol.for('__INSTA_AUTOMATION_AI_AUDIT_LOGS__');
if (!(globalThis as any)[globalAuditLogsKey]) {
  (globalThis as any)[globalAuditLogsKey] = [];
}

export class AIAuditLogger {
  private static get inMemoryLogs(): AuditLogEntry[] {
    return (globalThis as any)[globalAuditLogsKey];
  }

  public static async logAIOperation(entry: AuditLogEntry): Promise<void> {
    this.inMemoryLogs.push(entry);

    try {
      if (AIAuditLogModel && AIAuditLogModel.db && AIAuditLogModel.db.readyState === 1) {
        await AIAuditLogModel.create({
          workspaceId: entry.workspaceId,
          agentId: entry.agentId,
          modelName: entry.modelName,
          provider: entry.provider,
          promptTokens: entry.promptTokens,
          completionTokens: entry.completionTokens,
          input: entry.input,
          output: entry.output,
          toolCalls: entry.toolCalls,
          untrustedInputFlagged: entry.untrustedInputFlagged,
        });
      }
    } catch {
      // Graceful fallback for test environments without live DB
    }
  }

  public static getInMemoryLogs(): AuditLogEntry[] {
    return this.inMemoryLogs;
  }

  public static clearInMemoryLogs(): void {
    (globalThis as any)[globalAuditLogsKey] = [];
  }
}
