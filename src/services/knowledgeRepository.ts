/**
 * Knowledge Repository Abstraction (Ask UniBot Phase 3.1)
 *
 * Implements a unified data access layer connected directly to Supabase
 * via backend API routes (/api/*).
 *
 * All data strictly originates from Supabase PostgreSQL.
 */

import { Source, MeetingDecision, Meeting, ActionItem, HumanHandoverTicket, UserProfile, ConfusionAlert, RecurringQuestion, Recap, EventReminder } from '../types';

export interface RecordQuestionParams {
  id: string;
  userId?: string;
  participantName?: string;
  question: string;
  answer: string;
  confidence: string;
  needsHuman: boolean;
  nextStep?: string | null;
  groundingMethod: string;
  conflictDetected?: boolean;
  conflictResolved?: boolean;
  conflictTopic?: string;
  freshnessStatus?: string;
  explanationSimple?: string;
  sources?: Array<{ id: string; evidence?: string; relevance?: number }>;
}

export interface KnowledgeRepository {
  getSources(): Promise<Source[]>;
  saveSource(source: Source): Promise<boolean>;
  getDecisions(): Promise<MeetingDecision[]>;
  saveDecision(decision: MeetingDecision): Promise<boolean>;
  resolveConflict(params: {
    topic: string;
    confirmedDecisionText: string;
    confirmedBy: string;
    supersedesDecisionId?: string;
    newSourceId?: string;
  }): Promise<boolean>;
  getMeetings(): Promise<Meeting[]>;
  getActions(userId?: string): Promise<ActionItem[]>;
  saveAction(action: ActionItem): Promise<boolean>;
  updateActionStatus(id: string, status: string): Promise<boolean>;
  getHandoverTickets(): Promise<HumanHandoverTicket[]>;
  saveHandoverTicket(ticket: HumanHandoverTicket): Promise<boolean>;
  updateHandoverTicket(id: string, updates: Partial<HumanHandoverTicket>): Promise<boolean>;
  getUserProfile(): Promise<UserProfile | null>;
  getConfusionAlerts(): Promise<ConfusionAlert[]>;
  getRecurringQuestions(): Promise<RecurringQuestion[]>;
  getRecaps(): Promise<Recap[]>;
  getReminders(): Promise<EventReminder[]>;
  recordQuestion(params: RecordQuestionParams): Promise<boolean>;
  getQuestionHistory(limit?: number): Promise<any[]>;
}

/**
 * Supabase persistent repository implementation
 * Direct communication with backend /api/* routes serving Supabase data.
 */
export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  public async getSources(): Promise<Source[]> {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getSources fetch error:', err);
    }
    return [];
  }

  public async saveSource(source: Source): Promise<boolean> {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(source),
      });
      return res.ok;
    } catch (err) {
      console.warn('saveSource error:', err);
      return false;
    }
  }

  public async getDecisions(): Promise<MeetingDecision[]> {
    try {
      const res = await fetch('/api/decisions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getDecisions fetch error:', err);
    }
    return [];
  }

  public async saveDecision(decision: MeetingDecision): Promise<boolean> {
    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decision),
      });
      return res.ok;
    } catch (err) {
      console.warn('saveDecision error:', err);
      return false;
    }
  }

  public async resolveConflict(params: {
    topic: string;
    confirmedDecisionText: string;
    confirmedBy: string;
    supersedesDecisionId?: string;
    newSourceId?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/decisions/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return res.ok;
    } catch (err) {
      console.warn('resolveConflict error:', err);
      return false;
    }
  }

  public async getMeetings(): Promise<Meeting[]> {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getMeetings fetch error:', err);
    }
    return [];
  }

  public async getActions(userId?: string): Promise<ActionItem[]> {
    try {
      const url = userId ? `/api/actions?userId=${encodeURIComponent(userId)}` : '/api/actions';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getActions fetch error:', err);
    }
    return [];
  }

  public async saveAction(action: ActionItem): Promise<boolean> {
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      return res.ok;
    } catch (err) {
      console.warn('saveAction error:', err);
      return false;
    }
  }

  public async updateActionStatus(id: string, status: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/actions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (err) {
      console.warn('updateActionStatus error:', err);
      return false;
    }
  }

  public async getHandoverTickets(): Promise<HumanHandoverTicket[]> {
    try {
      const res = await fetch('/api/handover-tickets');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getHandoverTickets fetch error:', err);
    }
    return [];
  }

  public async saveHandoverTicket(ticket: HumanHandoverTicket): Promise<boolean> {
    try {
      const res = await fetch('/api/handover-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
      return res.ok;
    } catch (err) {
      console.warn('saveHandoverTicket error:', err);
      return false;
    }
  }

  public async updateHandoverTicket(id: string, updates: Partial<HumanHandoverTicket>): Promise<boolean> {
    try {
      const res = await fetch(`/api/handover-tickets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch (err) {
      console.warn('updateHandoverTicket error:', err);
      return false;
    }
  }

  public async getUserProfile(): Promise<UserProfile | null> {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('getUserProfile fetch error:', err);
    }
    return null;
  }

  public async getConfusionAlerts(): Promise<ConfusionAlert[]> {
    try {
      const res = await fetch('/api/confusion-alerts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getConfusionAlerts error:', err);
    }
    return [];
  }

  public async getRecurringQuestions(): Promise<RecurringQuestion[]> {
    try {
      const res = await fetch('/api/recurring-questions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getRecurringQuestions error:', err);
    }
    return [];
  }

  public async getRecaps(): Promise<Recap[]> {
    try {
      const res = await fetch('/api/recaps');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getRecaps error:', err);
    }
    return [];
  }

  public async getReminders(): Promise<EventReminder[]> {
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('getReminders error:', err);
    }
    return [];
  }

  public async recordQuestion(params: RecordQuestionParams): Promise<boolean> {
    try {
      const res = await fetch('/api/questions/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return res.ok;
    } catch (err) {
      console.warn('recordQuestion error:', err);
      return false;
    }
  }

  public async getQuestionHistory(limit: number = 20): Promise<any[]> {
    try {
      const res = await fetch(`/api/questions/history?limit=${limit}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('getQuestionHistory error:', err);
    }
    return [];
  }
}

// Export singleton instance
export const defaultKnowledgeRepository = new SupabaseKnowledgeRepository();
