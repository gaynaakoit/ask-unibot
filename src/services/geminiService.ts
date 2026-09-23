/**
 * Gemini Service — Client proxy to full-stack Express AI endpoints
 * Handles server-side grounded question answering and announcement clarity checks.
 * Falls back to deterministic KnowledgeService if server/API key is unavailable.
 */

import { AiResponse, AnnouncementClarityCheck, Source, MeetingDecision } from '../types';
import { defaultKnowledgeService } from './knowledgeService';
import { decisionService } from './decisionService';
import { defaultKnowledgeRepository } from './knowledgeRepository';
import { getAuthHeaders } from './currentUserService';

export interface AskRequest {
  query: string;
  sources?: Source[];
  activeDecisions?: MeetingDecision[];
  userId?: string;
  participantName?: string;
}

export class GeminiService {
  /**
   * Query the Ask UniBot server endpoint.
   * If the server response fails or the API key is unconfigured,
   * cleanly falls back to the deterministic KnowledgeService knowledge base.
   */
  public async askUniBot(
    query: string,
    sources?: Source[],
    activeDecisions?: MeetingDecision[],
    userId?: string,
    participantName?: string
  ): Promise<AiResponse> {
    // If dynamic sources were provided, ensure knowledgeService is kept synchronized
    if (sources && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }

    try {
      const chunks = defaultKnowledgeService.getRelevantChunks(query, 6);
      const decisions = activeDecisions || decisionService.getActiveDecisions();
      const authHeaders = await getAuthHeaders();

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          query,
          sources: sources || defaultKnowledgeService.getApprovedSources(),
          chunks,
          activeDecisions: decisions,
          userId,
          participantName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.answer && !data.fallback) {
          return data as AiResponse;
        }
      }
    } catch (err) {
      console.warn('Falling back to local knowledge retrieval service:', err);
    }

    // Fallback to local grounded knowledge retrieval engine (Phase 2 deterministic pipeline)
    const localAnswer = defaultKnowledgeService.queryKnowledge(query);

    // Record question in repository
    defaultKnowledgeRepository.recordQuestion({
      id: `q-${Date.now()}`,
      userId,
      participantName,
      question: query,
      answer: localAnswer.answer,
      confidence: localAnswer.confidence,
      needsHuman: localAnswer.needsHuman,
      nextStep: localAnswer.nextStep,
      groundingMethod: 'grounded-knowledge-engine (client fallback)',
      conflictDetected: localAnswer.conflict?.detected,
      conflictResolved: localAnswer.conflict?.resolved,
      conflictTopic: localAnswer.conflict?.topic,
      freshnessStatus: localAnswer.freshness?.status,
      explanationSimple: localAnswer.explanationSimple,
      sources: (localAnswer.sources || []).map((s) => ({
        id: s.id,
        evidence: s.content?.slice(0, 150),
        relevance: 1.0,
      })),
    }).catch((err) => console.warn('Record question local fallback error:', err));

    return localAnswer;
  }

  /**
   * Run Announcement Clarity Check.
   * Analyzes draft for audience, date, time, timezone, location/link,
   * required action, deadline, purpose, preparation.
   */
  public async checkAnnouncementClarity(
    draft: string
  ): Promise<AnnouncementClarityCheck> {
    try {
      const res = await fetch('/api/clarity-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.score === 'number') {
          return data as AnnouncementClarityCheck;
        }
      }
    } catch (err) {
      console.warn('Clarity check falling back to rule-based engine:', err);
    }

    // Fallback rule-based clarity check
    return this.evaluateClarityLocally(draft);
  }

  public evaluateClarityLocally(draft: string): AnnouncementClarityCheck {
    const text = draft.toLowerCase();
    const criteria = [
      { key: 'target audience', found: text.includes('all') || text.includes('team') || text.includes('lead') || text.includes('participants') },
      { key: 'date', found: /\b(mon|tue|wed|thu|fri|sat|sun|september|sep|october|oct|\d{1,2}\s+(sep|oct))\b/i.test(draft) },
      { key: 'time', found: /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(am|pm)\b/i.test(draft) },
      { key: 'timezone', found: text.includes('wat') || text.includes('gmt') || text.includes('utc') },
      { key: 'location/link', found: text.includes('teams') || text.includes('zoom') || text.includes('http') || text.includes('room') },
      { key: 'required action', found: text.includes('submit') || text.includes('attend') || text.includes('complete') || text.includes('join') || text.includes('upload') },
      { key: 'deadline', found: text.includes('deadline') || text.includes('before') || text.includes('by') || text.includes('due') },
      { key: 'purpose', found: text.includes('agenda') || text.includes('discuss') || text.includes('review') || text.includes('session') },
      { key: 'preparation', found: text.includes('prepare') || text.includes('bring') || text.includes('repo') || text.includes('prerequisite') },
    ];

    const present = criteria.filter((c) => c.found).map((c) => c.key);
    const missing = criteria.filter((c) => !c.found).map((c) => c.key);
    const score = Math.round((present.length / criteria.length) * 100);

    const recommendations = missing.map(
      (m) => `Add explicit ${m} so participants do not ask repetitive clarification questions.`
    );

    const improvedDraft = `📢 OFFICIAL UNIPODS ANNOUNCEMENT\n\n📌 Target Audience: All UniPods 2026 Cohort Participants & Technical Leads\n🎯 Purpose: ${draft.slice(0, 80)}...\n📅 Date: Tuesday, 22 September 2026\n⏰ Time: 10:00 WAT (West Africa Time)\n🔗 Meeting Link: Microsoft Teams Room (https://teams.microsoft.com/unipods-room1)\n🛠️ Required Preparation: Complete MIT Learn Module 4 & have GitHub repository link ready\n⏳ Action Deadline: Submit attendance check-in before 10:15 WAT\n\nFor questions, tag @Ask UniBot or contact the Secretariat.`;

    return {
      score,
      presentElements: present,
      missingElements: missing,
      recommendations,
      improvedDraft,
    };
  }
}

export const geminiService = new GeminiService();
