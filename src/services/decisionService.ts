/**
 * Decision Service
 * Manages official programme decisions, superseding chains, and active policies.
 */

import { MeetingDecision } from '../types';
import { defaultKnowledgeRepository, KnowledgeRepository } from './knowledgeRepository';

export class DecisionService {
  private decisions: MeetingDecision[] = [];

  constructor(initialDecisions?: MeetingDecision[]) {
    if (initialDecisions && initialDecisions.length > 0) {
      this.decisions = [...initialDecisions];
    } else {
      this.decisions = [];
    }
  }

  public async loadFromRepository(repository: KnowledgeRepository = defaultKnowledgeRepository): Promise<MeetingDecision[]> {
    try {
      const repoDecisions = await repository.getDecisions();
      if (repoDecisions && repoDecisions.length > 0) {
        this.decisions = repoDecisions;
      }
    } catch (err) {
      console.warn('DecisionService loadFromRepository fallback:', err);
    }
    return this.decisions;
  }

  public getAllDecisions(): MeetingDecision[] {
    return [...this.decisions];
  }

  public getActiveDecisions(): MeetingDecision[] {
    return this.decisions.filter((d) => d.status !== 'superseded');
  }

  public getDecisionById(id: string): MeetingDecision | undefined {
    return this.decisions.find((d) => d.id === id);
  }

  public recordDecision(newDecision: MeetingDecision, repository: KnowledgeRepository = defaultKnowledgeRepository): MeetingDecision {
    if (newDecision.supersedesDecisionId) {
      this.supersedeDecision(
        newDecision.supersedesDecisionId,
        newDecision.id,
        newDecision.supersedesNote || `Superseded by decision ${newDecision.id}`
      );
    }

    const existingIndex = this.decisions.findIndex((d) => d.id === newDecision.id);
    let finalDecision: MeetingDecision;
    if (existingIndex >= 0) {
      this.decisions[existingIndex] = { ...this.decisions[existingIndex], ...newDecision };
      finalDecision = this.decisions[existingIndex];
    } else {
      finalDecision = {
        status: 'active',
        ...newDecision,
      };
      this.decisions.unshift(finalDecision);
    }

    repository.saveDecision(finalDecision).catch((err) => console.warn('Record decision repo error:', err));
    return finalDecision;
  }

  public supersedeDecision(oldId: string, supersedingId: string, note?: string) {
    const target = this.decisions.find((d) => d.id === oldId);
    if (target) {
      target.status = 'superseded';
      target.supersedesNote = note || `Superseded by decision ${supersedingId}`;
    }
  }

  public resolveConflict(
    topic: string,
    confirmedDecisionText: string,
    confirmedBy: string,
    supersedesDecisionId?: string,
    repository: KnowledgeRepository = defaultKnowledgeRepository
  ): MeetingDecision {
    // Mark matching older decisions as superseded
    this.decisions.forEach((d) => {
      if (
        (supersedesDecisionId && d.id === supersedesDecisionId) ||
        (d.topic && d.topic.toLowerCase().includes(topic.toLowerCase())) ||
        d.title.toLowerCase().includes(topic.toLowerCase())
      ) {
        d.status = 'superseded';
        d.supersedesNote = `Superseded by resolution by ${confirmedBy}`;
      }
    });

    const newDecision: MeetingDecision = {
      id: `dec-${Date.now()}`,
      topic,
      title: confirmedDecisionText,
      decision: confirmedDecisionText,
      date: '21 Sep 2026',
      status: 'active',
      supersedesPrevious: true,
      supersedesDecisionId,
      confirmedBy,
      effectiveFrom: '21 Sep 2026',
      impact: 'Official policy confirmed by lead organiser.',
    };

    this.decisions.unshift(newDecision);

    // Persist resolution to repository (Supabase)
    repository.resolveConflict({
      topic,
      confirmedDecisionText,
      confirmedBy,
      supersedesDecisionId,
    }).catch((err) => console.warn('Persist conflict resolution repo error:', err));

    return newDecision;
  }
}

export const decisionService = new DecisionService();
