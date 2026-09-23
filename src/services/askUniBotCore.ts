/**
 * Ask UniBot Core Engine (Shared between Web and WhatsApp)
 * METI UniPods AI Innovation Programme 2026
 *
 * Implements the single source of truth for grounded Q&A:
 * - Approved sources hydration from Supabase
 * - Grounded Gemini generation with strict JSON schema
 * - Deterministic KnowledgeService RAG fallback (zero hallucination)
 * - Conflict resolution and freshness verification
 * - Question history recording in Supabase (with channel and messageId)
 * - Automatic handover ticket creation when needsHuman === true
 */

import { GoogleGenAI, Type } from '@google/genai';
import { defaultKnowledgeService } from './knowledgeService.js';
import {
  fetchSourcesFromSupabase,
  recordQuestionToSupabase,
  saveHandoverTicketToSupabase,
} from './supabaseServer.js';
import { AiResponse, Source } from '../types.js';

let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

export interface ExecuteAskOptions {
  query: string;
  userId?: string;
  participantName?: string;
  channel?: 'WEB' | 'WHATSAPP';
  messageId?: string;
  sources?: Source[];
  activeDecisions?: any[];
}

export async function executeAskUniBotCore(options: ExecuteAskOptions): Promise<AiResponse> {
  const {
    query,
    userId = '00000000-0000-4000-a000-000000000001',
    participantName = 'Participant',
    channel = 'WEB',
    messageId,
    activeDecisions,
  } = options;

  let { sources } = options;

  // 1. Always fetch fresh sources from Supabase if not provided
  if (!Array.isArray(sources) || sources.length === 0) {
    try {
      const dbSources = await fetchSourcesFromSupabase();
      if (dbSources && dbSources.length > 0) {
        sources = dbSources.filter((s) => s.approved);
      }
    } catch (e) {
      console.warn('[AskUniBotCore] Could not fetch sources from Supabase for query:', e);
    }
  }

  // Check if query concerns an explicit unresolved conflict
  const cleanQ = query.toLowerCase();
  if (cleanQ.includes('unresolved') || (cleanQ.includes('conflict') && (cleanQ.includes('between') || cleanQ.includes('27') || cleanQ.includes('29')))) {
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const groundedConflict = defaultKnowledgeService.queryKnowledge(query);
    if (groundedConflict.confidence === 'NEEDS_ADMIN_CONFIRMATION') {
      const questionId = `q-${Date.now()}`;
      await recordQuestionToSupabase({
        id: questionId,
        userId,
        participantName,
        question: query,
        answer: groundedConflict.answer,
        confidence: groundedConflict.confidence,
        needsHuman: groundedConflict.needsHuman,
        nextStep: groundedConflict.nextStep,
        groundingMethod: 'grounded-knowledge-engine (conflict-guarded)',
        conflictDetected: groundedConflict.conflict?.detected,
        conflictResolved: groundedConflict.conflict?.resolved,
        conflictTopic: groundedConflict.conflict?.topic,
        freshnessStatus: groundedConflict.freshness?.status,
        explanationSimple: groundedConflict.explanationSimple,
        channel,
        messageId,
        sources: (groundedConflict.sources || []).map((s: any) => ({
          id: s.id,
          evidence: s.content?.slice(0, 150),
          relevance: 1.0,
        })),
      }).catch((err) => console.warn('[AskUniBotCore] Background record question error:', err?.message || err));

      await saveHandoverTicketToSupabase({
        id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: query,
        questionId,
        participantId: userId,
        participantContext: participantName,
        status: 'open',
        conflictSummary: groundedConflict.conflict?.summary || undefined,
        detectedConflict: groundedConflict.conflict?.detected ? (groundedConflict.conflict.summary || groundedConflict.conflict.topic) : undefined,
        conflictOrMissing: 'Unresolved source conflict',
        evidence: groundedConflict.evidenceItems || [],
        sourcesChecked: (groundedConflict.sources || []).map((s) => s.title),
        recommendedAdmin: 'Dr. Aminata Touré (Lead Facilitator)',
        channel,
        messageId,
        createdAt: new Date().toISOString(),
        timestamp: 'Recently',
      }).catch((err) => console.warn('[AskUniBotCore] Background handover ticket error:', err?.message || err));

      return {
        ...groundedConflict,
        groundingMethod: 'grounded-knowledge-engine',
      };
    }
  }

  const ai = getGenAI();

  // If Gemini is unconfigured, run deterministic grounded engine directly
  if (!ai) {
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const grounded = defaultKnowledgeService.queryKnowledge(query);

    const questionId = `q-${Date.now()}`;
    await recordQuestionToSupabase({
      id: questionId,
      userId,
      participantName,
      question: query,
      answer: grounded.answer,
      confidence: grounded.confidence,
      needsHuman: grounded.needsHuman,
      nextStep: grounded.nextStep,
      groundingMethod: 'grounded-knowledge-engine (supabase-synced)',
      conflictDetected: grounded.conflict?.detected,
      conflictResolved: grounded.conflict?.resolved,
      conflictTopic: grounded.conflict?.topic,
      freshnessStatus: grounded.freshness?.status,
      explanationSimple: grounded.explanationSimple,
      channel,
      messageId,
      sources: (grounded.sources || []).map((s: any) => ({
        id: s.id,
        evidence: s.content?.slice(0, 150),
        relevance: 1.0,
      })),
    }).catch((err) => console.warn('[AskUniBotCore] Background record question error:', err?.message || err));

    // Handover creation if needed
    if (grounded.needsHuman || grounded.confidence === 'NEEDS_ADMIN_CONFIRMATION' || grounded.confidence === 'NOT_FOUND') {
      await saveHandoverTicketToSupabase({
        id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: query,
        questionId,
        participantId: userId,
        participantContext: participantName,
        status: 'open',
        conflictSummary: grounded.conflict?.summary || undefined,
        detectedConflict: grounded.conflict?.detected ? (grounded.conflict.summary || grounded.conflict.topic) : undefined,
        conflictOrMissing: grounded.confidence === 'NOT_FOUND' ? 'Information missing in verified sources' : 'Unresolved source conflict',
        evidence: grounded.evidenceItems || [],
        sourcesChecked: (grounded.sources || []).map((s) => s.title),
        recommendedAdmin: 'Dr. Aminata Touré (Lead Facilitator)',
        channel,
        messageId,
        createdAt: new Date().toISOString(),
        timestamp: 'Recently',
      }).catch((err) => console.warn('[AskUniBotCore] Background handover ticket error:', err?.message || err));
    }

    return {
      ...grounded,
      groundingMethod: 'grounded-knowledge-engine',
    };
  }

  // 2. Format context for Gemini
  try {
    const formattedSources = Array.isArray(sources) && sources.length > 0
      ? sources
          .map(
            (s: any) =>
              `[Source ID: ${s.id} | ${s.title} | Publisher: ${s.publisher || s.author} | Date: ${s.date} | Status: ${s.status} | Approved: ${s.approved} | Supersedes: ${s.supersedes || s.supersedesSourceId || 'None'}]\n${s.content}`
          )
          .join('\n\n')
      : 'No dynamic sources provided in Supabase.';

    const formattedDecisions = Array.isArray(activeDecisions) && activeDecisions.length > 0
      ? activeDecisions
          .map(
            (d: any) =>
              `- Decision [${d.id}]: ${d.title} (Status: ${d.status}, Date: ${d.date}, Supersedes: ${d.supersedesNote || 'None'})`
          )
          .join('\n')
      : 'No custom active decisions.';

    const systemInstruction = `You are Ask UniBot, the trusted information assistant for the METI UniPods AI Innovation Programme 2026.
Your responsibility is to help participants understand programme information using only approved evidence supplied in the context.

Rules:
1. Never invent programme information.
2. Never rely on general model knowledge for programme-specific facts.
3. Never guess deadlines, dates, links, requirements or policies.
4. Every factual claim must be supported by supplied evidence from Supabase.
5. Prefer the most recent effective official source.
6. If a newer source supersedes an older source, use the newer source.
7. If two approved sources conflict and no resolution exists, do not choose silently.
8. Return NEEDS_ADMIN_CONFIRMATION when a conflict cannot be resolved.
9. If no sufficient evidence exists, return NOT_FOUND.
10. Clearly distinguish confirmed information from uncertainty.
11. Keep answers concise and actionable.
12. Always provide the evidence source.`;

    const prompt = `APPROVED SUPABASE SOURCES:
${formattedSources}

OFFICIAL ACTIVE DECISIONS:
${formattedDecisions}

USER QUESTION:
"${query}"`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
    let parsed: any = null;
    let chosenModel = 'gemini-3.8-flash';

    for (const model of modelsToTry) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  answer: { type: Type.STRING },
                  confidence: {
                    type: Type.STRING,
                    enum: ['CONFIRMED', 'NEEDS_ADMIN_CONFIRMATION', 'NOT_FOUND'],
                  },
                  sources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        publisher: { type: Type.STRING },
                        url: { type: Type.STRING },
                        relevance: { type: Type.NUMBER },
                        evidence: { type: Type.STRING },
                      },
                      required: ['id', 'title', 'evidence'],
                    },
                  },
                  nextStep: { type: Type.STRING, nullable: true },
                  needsHuman: { type: Type.BOOLEAN },
                  conflict: {
                    type: Type.OBJECT,
                    nullable: true,
                    properties: {
                      detected: { type: Type.BOOLEAN },
                      resolved: { type: Type.BOOLEAN },
                      topic: { type: Type.STRING },
                      summary: { type: Type.STRING },
                    },
                  },
                  freshness: {
                    type: Type.OBJECT,
                    properties: {
                      status: {
                        type: Type.STRING,
                        enum: ['current', 'aging', 'expired', 'unknown'],
                      },
                      reason: { type: Type.STRING },
                    },
                    required: ['status', 'reason'],
                  },
                  explanationSimple: { type: Type.STRING },
                },
                required: ['answer', 'confidence', 'sources', 'needsHuman', 'freshness'],
              },
            },
          }),
          4000,
          `Timeout calling ${model}`
        );

        const text = response.text?.trim();
        if (text) {
          parsed = JSON.parse(text);
          chosenModel = model;
          break;
        }
      } catch (modelErr: any) {
        console.warn(`[AskUniBotCore] Model ${model} unavailable (${modelErr?.status || modelErr?.code || 'busy'}), trying next...`);
      }
    }

    if (parsed && parsed.answer) {
      const enrichedSources = Array.isArray(parsed.sources) && Array.isArray(sources)
        ? parsed.sources.map((ps: any) => {
            const original = sources.find((s: any) => s.id === ps.id);
            return original ? { ...original, evidence: ps.evidence } : ps;
          })
        : (sources?.slice(0, 2) || []);

      const finalResponse: AiResponse = {
        answer: parsed.answer,
        confidence: parsed.confidence,
        sources: enrichedSources,
        evidenceItems: parsed.sources || [],
        nextStep: parsed.nextStep || null,
        needsHuman: Boolean(
          parsed.needsHuman ||
          parsed.confidence === 'NEEDS_ADMIN_CONFIRMATION' ||
          parsed.confidence === 'NOT_FOUND'
        ),
        conflict: parsed.conflict || null,
        conflictSummary: parsed.conflict?.summary || undefined,
        freshness: parsed.freshness,
        explanationSimple: parsed.explanationSimple,
        groundingMethod: chosenModel as any,
        timestamp: new Date().toISOString(),
      };

      const questionId = `q-${Date.now()}`;
      await recordQuestionToSupabase({
        id: questionId,
        userId,
        participantName,
        question: query,
        answer: finalResponse.answer,
        confidence: finalResponse.confidence,
        needsHuman: finalResponse.needsHuman,
        nextStep: finalResponse.nextStep,
        groundingMethod: chosenModel,
        conflictDetected: finalResponse.conflict?.detected,
        conflictResolved: finalResponse.conflict?.resolved,
        conflictTopic: finalResponse.conflict?.topic,
        freshnessStatus: finalResponse.freshness?.status,
        explanationSimple: finalResponse.explanationSimple,
        channel,
        messageId,
        sources: (parsed.sources || []).map((s: any) => ({
          id: s.id,
          evidence: s.evidence,
          relevance: s.relevance || 1.0,
        })),
      }).catch((err) => console.warn('[AskUniBotCore] Background record question error:', err?.message || err));

      if (finalResponse.needsHuman) {
        await saveHandoverTicketToSupabase({
          id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          question: query,
          questionId,
          participantId: userId,
          participantContext: participantName,
          status: 'open',
          conflictSummary: finalResponse.conflictSummary,
          detectedConflict: finalResponse.conflict?.detected ? (finalResponse.conflict.summary || finalResponse.conflict.topic) : undefined,
          conflictOrMissing: finalResponse.confidence === 'NOT_FOUND' ? 'Information missing in verified sources' : 'Unresolved source conflict',
          evidence: finalResponse.evidenceItems || [],
          sourcesChecked: (finalResponse.sources || []).map((s) => s.title),
          recommendedAdmin: 'Dr. Aminata Touré (Lead Facilitator)',
          channel,
          messageId,
          createdAt: new Date().toISOString(),
          timestamp: 'Recently',
        }).catch((err) => console.warn('[AskUniBotCore] Background handover ticket error:', err?.message || err));
      }

      return finalResponse;
    }
  } catch (err: any) {
    console.warn('[AskUniBotCore] Gemini processing error, executing deterministic fallback:', err?.message || err);
  }

  // 3. Fallback to deterministic grounded engine seeded with Supabase sources
  if (Array.isArray(sources) && sources.length > 0) {
    defaultKnowledgeService.setSources(sources);
  }
  const fallback = defaultKnowledgeService.queryKnowledge(query);

  const fallbackQuestionId = `q-${Date.now()}`;
  await recordQuestionToSupabase({
    id: fallbackQuestionId,
    userId,
    participantName,
    question: query,
    answer: fallback.answer,
    confidence: fallback.confidence,
    needsHuman: fallback.needsHuman,
    nextStep: fallback.nextStep,
    groundingMethod: 'grounded-knowledge-engine (deterministic-fallback)',
    conflictDetected: fallback.conflict?.detected,
    conflictResolved: fallback.conflict?.resolved,
    conflictTopic: fallback.conflict?.topic,
    freshnessStatus: fallback.freshness?.status,
    explanationSimple: fallback.explanationSimple,
    channel,
    messageId,
    sources: (fallback.sources || []).map((s: any) => ({
      id: s.id,
      evidence: s.content?.slice(0, 150),
      relevance: 1.0,
    })),
  }).catch((err) => console.warn('[AskUniBotCore] Background record question error:', err?.message || err));

  if (fallback.needsHuman || fallback.confidence === 'NEEDS_ADMIN_CONFIRMATION' || fallback.confidence === 'NOT_FOUND') {
    await saveHandoverTicketToSupabase({
      id: `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: query,
      questionId: fallbackQuestionId,
      participantId: userId,
      participantContext: participantName,
      status: 'open',
      conflictSummary: fallback.conflict?.summary || undefined,
      detectedConflict: fallback.conflict?.detected ? (fallback.conflict.summary || fallback.conflict.topic) : undefined,
      conflictOrMissing: fallback.confidence === 'NOT_FOUND' ? 'Information missing in verified sources' : 'Unresolved source conflict',
      evidence: fallback.evidenceItems || [],
      sourcesChecked: (fallback.sources || []).map((s) => s.title),
      recommendedAdmin: 'Dr. Aminata Touré (Lead Facilitator)',
      channel,
      messageId,
      createdAt: new Date().toISOString(),
      timestamp: 'Recently',
    }).catch((err) => console.warn('[AskUniBotCore] Background handover ticket error:', err?.message || err));
  }

  return {
    ...fallback,
    groundingMethod: 'deterministic-rag',
  };
}
