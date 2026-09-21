/**
 * Decision Service
 * Manages official programme decisions, superseding chains, and active policies.
 */

import { MeetingDecision } from '../types';
import { INITIAL_MEETINGS } from '../data/demoData';

export class DecisionService {
  private decisions: MeetingDecision[] = [];

  constructor(initialDecisions?: MeetingDecision[]) {
    if (initialDecisions && initialDecisions.length > 0) {
      this.decisions = [...initialDecisions];
    } else {
      // Seed decisions from meeting records
      const seeded: MeetingDecision[] = [];
      INITIAL_MEETINGS.forEach((m) => {
        m.decisions.forEach((d) => {
          seeded.push({
            ...d,
            status: d.supersedesPrevious ? 'active' : 'active',
            sourceId: 'src-5',
            effectiveFrom: d.date,
          });
        });
      });
      // Add standard core decision for prototype deadline
      seeded.push({
        id: 'dec-proto-29',
        topic: 'Prototype Submission Deadline',
        title: 'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
        decision: 'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
        date: '21 Sep 2026',
        sourceId: 'src-2',
        status: 'active',
        supersedesPrevious: true,
        supersedesDecisionId: 'dec-proto-27',
        supersedesNote: 'Officially supersedes preliminary 27 September date from 18 Sep.',
        impact: 'Gives all 62 teams a 48-hour buffer for rural customer interviews.',
        effectiveFrom: '21 Sep 2026',
        confirmedBy: 'Dr. Aminata Touré & Eng. Kwame Mensah',
        notes: 'Confirmed in 21 Sep Cohort Briefing.',
      });

      this.decisions = seeded;
    }
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

  public recordDecision(newDecision: MeetingDecision): MeetingDecision {
    if (newDecision.supersedesDecisionId) {
      this.supersedeDecision(
        newDecision.supersedesDecisionId,
        newDecision.id,
        newDecision.supersedesNote || `Superseded by decision ${newDecision.id}`
      );
    }

    const existingIndex = this.decisions.findIndex((d) => d.id === newDecision.id);
    if (existingIndex >= 0) {
      this.decisions[existingIndex] = { ...this.decisions[existingIndex], ...newDecision };
      return this.decisions[existingIndex];
    } else {
      const decisionWithDefaults: MeetingDecision = {
        status: 'active',
        ...newDecision,
      };
      this.decisions.unshift(decisionWithDefaults);
      return decisionWithDefaults;
    }
  }

  public supersedeDecision(oldId: string, supersedingId: string, note?: string) {
    const target = this.decisions.find((d) => d.id === oldId);
    if (target) {
      target.status = 'superseded';
      target.supersedesNote = note || `Superseded by decision ${supersedingId}`;
    }
  }

  public resolveConflict(topic: string, confirmedDecisionText: string, confirmedBy: string): MeetingDecision {
    // Mark matching older decisions as superseded
    this.decisions.forEach((d) => {
      if (
        (d.topic && d.topic.toLowerCase().includes(topic.toLowerCase())) ||
        d.title.toLowerCase().includes(topic.toLowerCase())
      ) {
        d.status = 'superseded';
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
      confirmedBy,
      effectiveFrom: '21 Sep 2026',
      impact: 'Official policy confirmed by lead organiser.',
    };

    this.decisions.unshift(newDecision);
    return newDecision;
  }
}

export const decisionService = new DecisionService();
