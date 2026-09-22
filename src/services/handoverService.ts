/**
 * Handover Service
 * Manages escalation tickets for queries requiring organiser confirmation.
 * Implements the admin resolution loop to feed verified decisions back into the RAG engine.
 */

import { HumanHandoverTicket, SourceEvidenceItem } from '../types';
import { defaultKnowledgeRepository, KnowledgeRepository } from './knowledgeRepository';

export class HandoverService {
  private tickets: HumanHandoverTicket[] = [];

  public async loadFromRepository(repository: KnowledgeRepository = defaultKnowledgeRepository): Promise<HumanHandoverTicket[]> {
    try {
      const data = await repository.getHandoverTickets();
      if (data && data.length > 0) {
        this.tickets = data;
      }
    } catch (err) {
      console.warn('HandoverService loadFromRepository error:', err);
    }
    return this.tickets;
  }

  public setTickets(tickets: HumanHandoverTicket[]) {
    this.tickets = [...tickets];
  }

  public getTickets(): HumanHandoverTicket[] {
    return [...this.tickets];
  }

  public getOpenTickets(): HumanHandoverTicket[] {
    return this.tickets.filter((t) => t.status === 'open' || t.status === 'in_review');
  }

  public createTicket(params: {
    question: string;
    detectedConflict?: string;
    conflictOrMissing?: string;
    sourcesChecked: string[];
    participantContext?: string;
    recommendedAdmin?: string;
    evidence?: string | SourceEvidenceItem[];
  }, repository: KnowledgeRepository = defaultKnowledgeRepository): HumanHandoverTicket {
    const newTicket: HumanHandoverTicket = {
      id: `ticket-${Date.now()}`,
      question: params.question,
      detectedConflict: params.detectedConflict,
      conflictOrMissing: params.conflictOrMissing || params.detectedConflict || 'Requires administrator confirmation',
      sourcesChecked: params.sourcesChecked,
      participantContext: params.participantContext || 'Participant asked via Ask UniBot interface',
      recommendedAdmin: params.recommendedAdmin || 'Dr. Aminata Touré (Lead Facilitator)',
      status: 'open',
      evidence: params.evidence,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
    };

    this.tickets.unshift(newTicket);
    repository.saveHandoverTicket(newTicket).catch((err) => {
      console.warn('Failed to persist ticket to Supabase:', err);
    });

    return newTicket;
  }

  public resolveTicket(
    ticketId: string,
    adminResponse: string,
    resolutionStatus: 'confirmed' | 'corrected' | 'superseded' | 'resolved' = 'resolved',
    repository: KnowledgeRepository = defaultKnowledgeRepository
  ): HumanHandoverTicket | null {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.status = resolutionStatus;
    ticket.adminResponse = adminResponse;
    ticket.resolutionNote = adminResponse;
    ticket.resolvedAt = new Date().toISOString();

    repository.updateHandoverTicket(ticketId, {
      status: resolutionStatus,
      adminResponse,
      resolutionNote: adminResponse,
    }).catch((err) => {
      console.warn('Failed to update ticket in Supabase:', err);
    });

    return ticket;
  }
}

export const defaultHandoverService = new HandoverService();
