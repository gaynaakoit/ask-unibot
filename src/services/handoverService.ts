/**
 * Handover Service
 * Manages escalation tickets for queries requiring organiser confirmation.
 * Implements the admin resolution loop to feed verified decisions back into the RAG engine.
 */

import { HumanHandoverTicket, SourceEvidenceItem } from '../types';
import { INITIAL_HANDOVER_TICKETS } from '../data/demoData';

export class HandoverService {
  private tickets: HumanHandoverTicket[] = [...INITIAL_HANDOVER_TICKETS];

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
  }): HumanHandoverTicket {
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
    return newTicket;
  }

  public resolveTicket(
    ticketId: string,
    adminResponse: string,
    resolutionStatus: 'confirmed' | 'corrected' | 'superseded' | 'resolved' = 'resolved'
  ): HumanHandoverTicket | null {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) return null;

    ticket.status = resolutionStatus;
    ticket.adminResponse = adminResponse;
    ticket.resolutionNote = adminResponse;
    ticket.resolvedAt = new Date().toISOString();
    return ticket;
  }
}

export const handoverService = new HandoverService();
