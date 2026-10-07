import mongoose from 'mongoose';
import { AutomationEventModel } from '@insta-automation/database';

export interface AutomationEventActor {
  id: string;
  username?: string;
  type: 'USER' | 'SYSTEM' | 'CUSTOMER';
}

export interface AutomationEventResource {
  id: string;
  type: string;
}

export interface AutomationEvent<T = any> {
  id: string;
  tenantId: string;
  accountId: string;
  source: 'INSTAGRAM' | 'WEBHOOK' | 'SYSTEM' | 'API' | 'SCHEDULED';
  type: string;
  timestamp: Date;
  actor: AutomationEventActor;
  resource: AutomationEventResource;
  payload: T;
  metadata?: Record<string, any>;
}

export class EventStore {
  private inMemoryStore: Map<string, AutomationEvent> = new Map();

  public async saveEvent(event: AutomationEvent): Promise<AutomationEvent> {
    this.inMemoryStore.set(`${event.tenantId}:${event.id}`, event);

    if (mongoose.connection.readyState === 1) {
      try {
        await AutomationEventModel.create({
          eventId: event.id,
          tenantId: event.tenantId,
          accountId: event.accountId,
          source: event.source,
          type: event.type,
          timestamp: event.timestamp,
          actor: event.actor,
          resource: event.resource,
          payload: event.payload,
          metadata: event.metadata,
        });
      } catch (err: any) {
        if (err.code === 11000) return event;
      }
    }
    return event;
  }

  public async getEvent(tenantId: string, eventId: string): Promise<AutomationEvent | null> {
    const cached = this.inMemoryStore.get(`${tenantId}:${eventId}`);
    if (cached) return cached;

    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await AutomationEventModel.findOne({ tenantId, eventId }).lean();
        if (!doc) return null;
        return {
          id: doc.eventId,
          tenantId: doc.tenantId.toString(),
          accountId: doc.accountId,
          source: doc.source as any,
          type: doc.type,
          timestamp: doc.timestamp,
          actor: doc.actor as any,
          resource: doc.resource as any,
          payload: doc.payload,
          metadata: doc.metadata,
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const eventStore = new EventStore();
