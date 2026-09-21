import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { defaultKnowledgeService } from './src/services/knowledgeService.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Grounded Q&A endpoint (Phase 2)
app.post('/api/ask', async (req, res) => {
  const { query, sources, chunks, activeDecisions } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query string is required' });
    return;
  }

  const ai = getGenAI();
  if (!ai) {
    // Return flag indicating fallback needed
    res.json({
      fallback: true,
      message: 'AI provider unavailable — deterministic fallback active.',
    });
    return;
  }

  try {
    const formattedSources = Array.isArray(sources) && sources.length > 0
      ? sources.map((s: any) => `[Source ID: ${s.id} | ${s.title} | Publisher: ${s.publisher || s.author} | Date: ${s.date} | Status: ${s.status} | Approved: ${s.approved} | Supersedes: ${s.supersedes || s.supersedesSourceId || 'None'}]\n${s.content}`).join('\n\n')
      : 'No dynamic sources provided. Consult approved programme memory.';

    const formattedDecisions = Array.isArray(activeDecisions) && activeDecisions.length > 0
      ? activeDecisions.map((d: any) => `- Decision [${d.id}]: ${d.title} (Status: ${d.status}, Date: ${d.date}, Supersedes: ${d.supersedesNote || 'None'})`).join('\n')
      : 'No custom active decisions.';

    const systemInstruction = `You are Ask UniBot, the trusted information assistant for the METI UniPods AI Innovation Programme 2026.

Your responsibility is to help participants understand programme information using only approved evidence supplied in the context.

Rules:
1. Never invent programme information.
2. Never rely on general model knowledge for programme-specific facts.
3. Never guess deadlines, dates, links, requirements or policies.
4. Every factual claim must be supported by supplied evidence.
5. Prefer the most recent effective official source.
6. If a newer source supersedes an older source, use the newer source.
7. If two approved sources conflict and no resolution exists, do not choose silently.
8. Return NEEDS_ADMIN_CONFIRMATION when a conflict cannot be resolved.
9. If no sufficient evidence exists, return NOT_FOUND.
10. Clearly distinguish confirmed information from uncertainty.
11. Keep answers concise and actionable.
12. Always provide the evidence source.
13. When appropriate, provide a concrete next step.
14. Never fabricate a source, URL, date, deadline or policy.
15. Never claim that something was announced unless it exists in the supplied evidence.`;

    const prompt = `APPROVED PROGRAMME SOURCES:
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
        console.warn(`Model ${model} unavailable (${modelErr?.status || modelErr?.code || 'high demand'}), trying next model...`);
      }
    }

    if (parsed && parsed.answer) {
      // Cross-match source IDs to original sources for full object presentation
      const enrichedSources = Array.isArray(parsed.sources) && Array.isArray(sources)
        ? parsed.sources.map((ps: any) => {
            const original = sources.find((s: any) => s.id === ps.id);
            return original ? { ...original, evidence: ps.evidence } : ps;
          })
        : (sources?.slice(0, 2) || []);

      return res.json({
        answer: parsed.answer,
        confidence: parsed.confidence,
        sources: enrichedSources,
        evidenceItems: parsed.sources || [],
        nextStep: parsed.nextStep || null,
        needsHuman: parsed.needsHuman || parsed.confidence === 'NEEDS_ADMIN_CONFIRMATION' || parsed.confidence === 'NOT_FOUND',
        conflict: parsed.conflict || null,
        conflictSummary: parsed.conflict?.summary || undefined,
        freshness: parsed.freshness,
        explanationSimple: parsed.explanationSimple,
        groundingMethod: chosenModel,
        timestamp: new Date().toISOString(),
      });
    }

    // If Gemini models are experiencing high demand spikes, seamlessly serve deterministic RAG response
    console.warn('Gemini cloud models currently at capacity. Delivering verified answer via grounded knowledge engine.');
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const grounded = defaultKnowledgeService.queryKnowledge(query);
    return res.json({
      ...grounded,
      groundingMethod: 'grounded-knowledge-engine (demand spike fallback)',
    });
  } catch (error: any) {
    console.warn('Handling request via local grounded knowledge engine due to:', error?.message || error);
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const grounded = defaultKnowledgeService.queryKnowledge(query);
    res.json({
      ...grounded,
      groundingMethod: 'grounded-knowledge-engine',
    });
  }
});

// Announcement Clarity Checker endpoint
app.post('/api/clarity-check', async (req, res) => {
  const { draft } = req.body;

  if (!draft || typeof draft !== 'string') {
    res.status(400).json({ error: 'Draft text is required' });
    return;
  }

  const ai = getGenAI();
  if (ai) {
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
    for (const model of modelsToTry) {
      try {
        const prompt = `Analyze this draft announcement for the UniPods AI Innovation Programme against clarity criteria:
1. Target audience
2. Date
3. Time
4. Timezone (e.g., WAT, GMT)
5. Location/Link (e.g. MS Teams, room address)
6. Required action
7. Deadline
8. Purpose
9. Preparation required

DRAFT:
"""
${draft}
"""`;

        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.NUMBER, description: 'Score between 0 and 100' },
                  presentElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missingElements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  improvedDraft: { type: Type.STRING, description: 'Polished announcement draft' },
                },
                required: ['score', 'presentElements', 'missingElements', 'recommendations', 'improvedDraft'],
              },
            },
          }),
          4000,
          `Timeout calling ${model} for clarity`
        );

        const parsed = JSON.parse(response.text?.trim() || '{}');
        if (parsed && typeof parsed.score === 'number') {
          return res.json(parsed);
        }
      } catch (err: any) {
        console.warn(`Clarity check on ${model} unavailable (${err?.status || err?.code || 'demand spike'}), trying fallback...`);
      }
    }
  }

  // Resilient rule-based clarity analysis
  const d = draft.toLowerCase();
  const present: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];
  let score = 40;

  if (d.includes('all') || d.includes('team') || d.includes('track') || d.includes('participant')) {
    present.push('Target Audience specified');
    score += 10;
  } else {
    missing.push('Target Audience');
    recommendations.push('Clarify exactly who this notice applies to (e.g., "All Milestone 2 Teams").');
  }

  if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s+(sep|oct|nov|dec))\b/i.test(draft)) {
    present.push('Date specified');
    score += 15;
  } else {
    missing.push('Specific Calendar Date');
    recommendations.push('State the exact calendar date (e.g., "Tuesday, 22 September 2026").');
  }

  if (/\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))\b/i.test(draft)) {
    present.push('Time specified');
    score += 10;
  } else {
    missing.push('Specific Time');
    recommendations.push('Include the session or deadline time (e.g., "10:00 AM").');
  }

  if (/\b(wat|gmt|utc|cat|eat)\b/i.test(draft)) {
    present.push('Timezone specified (WAT)');
    score += 10;
  } else {
    missing.push('Timezone');
    recommendations.push('Explicitly note "WAT" (West Africa Time) to prevent regional confusion.');
  }

  if (d.includes('teams') || d.includes('link') || d.includes('room') || d.includes('http')) {
    present.push('Platform / Location included');
    score += 10;
  } else {
    missing.push('Platform Link / Room');
    recommendations.push('State the virtual meeting link or platform (e.g., "Microsoft Teams room link").');
  }

  if (d.includes('must') || d.includes('submit') || d.includes('upload') || d.includes('action') || d.includes('prepare')) {
    present.push('Required Action stated');
    score += 10;
  } else {
    missing.push('Clear Action Item');
    recommendations.push('Clearly define what participants must prepare or execute.');
  }

  res.json({
    score: Math.min(100, score),
    presentElements: present,
    missingElements: missing,
    recommendations,
    improvedDraft: `${draft.trim()}\n\n[Action Required]: Please review the above details and join via the official Microsoft Teams room at the scheduled time (WAT).`,
  });
});

// Mount Vite middleware in development or serve static in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ask UniBot server running on http://0.0.0.0:${PORT}`);
  });
}

start();
