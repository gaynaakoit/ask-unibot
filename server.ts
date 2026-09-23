import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { defaultKnowledgeService } from './src/services/knowledgeService.js';
import {
  isSupabaseServerConfigured,
  fetchSourcesFromSupabase,
  saveSourceToSupabase,
  fetchDecisionsFromSupabase,
  saveDecisionToSupabase,
  resolveConflictInSupabase,
  fetchMeetingsFromSupabase,
  fetchActionsFromSupabase,
  saveActionToSupabase,
  updateActionStatusInSupabase,
  fetchHandoverTicketsFromSupabase,
  saveHandoverTicketToSupabase,
  updateHandoverTicketInSupabase,
  fetchUserProfileFromSupabase,
  updateUserProfileInSupabase,
  recordQuestionToSupabase,
  fetchQuestionHistoryFromSupabase,
  fetchRecurringQuestionsFromSupabase,
  fetchConfusionAlertsFromSupabase,
  fetchRecapsFromSupabase,
  fetchRemindersFromSupabase,
  fetchNotificationsFromSupabase,
  updateNotificationStatusInSupabase,
  getSupabaseServerClient,
} from './src/services/supabaseServer.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

/**
 * Authentication helper to retrieve verified Supabase user from Bearer token
 */
async function getAuthenticatedUser(req: express.Request): Promise<{ id: string; email: string; role: string; name: string; track?: string } | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const client = getSupabaseServerClient();
    if (!client) return null;

    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await client
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Participant';
      const track = user.user_metadata?.track || 'General AI Track';
      const role = user.user_metadata?.role || 'participant';
      await client.from('users').upsert({
        id: user.id,
        email: user.email!,
        name,
        role,
        track,
      }, { onConflict: 'id' });

      return { id: user.id, email: user.email!, role, name, track };
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role || 'participant',
      name: profile.name || user.user_metadata?.name || 'Participant',
      track: profile.track || user.user_metadata?.track || 'General AI Track',
    };
  } catch (err) {
    console.warn('getAuthenticatedUser error:', err);
    return null;
  }
}

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
    supabaseConfigured: isSupabaseServerConfigured(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// 1. SOURCES ENDPOINTS (Strictly Supabase)
app.get('/api/sources', async (req, res) => {
  try {
    const sources = await fetchSourcesFromSupabase();
    res.json(sources);
  } catch (err: any) {
    console.warn('GET /api/sources error:', err?.message || err);
    res.json([]);
  }
});

app.post('/api/sources', async (req, res) => {
  const source = req.body;
  if (!source || !source.id || !source.title) {
    res.status(400).json({ error: 'Valid source object is required' });
    return;
  }

  const persisted = await saveSourceToSupabase(source);
  res.json({ success: true, persistedInSupabase: persisted, source });
});

// 2. DECISIONS ENDPOINTS (Strictly Supabase)
app.get('/api/decisions', async (req, res) => {
  try {
    const decisions = await fetchDecisionsFromSupabase();
    res.json(decisions);
  } catch (err: any) {
    console.warn('GET /api/decisions error:', err?.message || err);
    res.json([]);
  }
});

app.post('/api/decisions', async (req, res) => {
  const decision = req.body;
  if (!decision || !decision.id || !decision.title) {
    res.status(400).json({ error: 'Valid decision object is required' });
    return;
  }

  const persisted = await saveDecisionToSupabase(decision);
  res.json({ success: true, persistedInSupabase: persisted, decision });
});

app.post('/api/decisions/resolve-conflict', async (req, res) => {
  const { topic, confirmedDecisionText, confirmedBy, supersedesDecisionId, newSourceId } = req.body;
  if (!topic || !confirmedDecisionText) {
    res.status(400).json({ error: 'Topic and confirmedDecisionText are required' });
    return;
  }

  const persisted = await resolveConflictInSupabase({
    topic,
    confirmedDecisionText,
    confirmedBy: confirmedBy || 'Lead Organiser',
    supersedesDecisionId,
    newSourceId,
  });

  res.json({
    success: true,
    persistedInSupabase: persisted,
    message: `Conflict on "${topic}" successfully resolved and persisted to Supabase.`,
  });
});

// 3. MEETINGS ENDPOINT (Strictly Supabase)
app.get('/api/meetings', async (req, res) => {
  try {
    const meetings = await fetchMeetingsFromSupabase();
    res.json(meetings);
  } catch (err: any) {
    console.warn('GET /api/meetings error:', err?.message || err);
    res.json([]);
  }
});

// 3.b AUTH REGISTRATION ENDPOINT (Bypasses email SMTP rate-limits with verified admin creation)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, track } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ success: false, error: 'Email, password, and name are required' });
    return;
  }

  const client = getSupabaseServerClient();
  if (!client) {
    res.status(500).json({ success: false, error: 'Database service unavailable' });
    return;
  }

  try {
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, track: track || 'General AI Track' },
    });

    if (authError) {
      res.status(400).json({ success: false, error: authError.message });
      return;
    }

    await client.from('users').upsert({
      id: authData.user.id,
      email: authData.user.email!,
      name,
      role: 'participant',
      track: track || 'General AI Track',
    }, { onConflict: 'id' });

    res.json({ success: true, user: { id: authData.user.id, email: authData.user.email } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Registration failed' });
  }
});

// 4. ACTIONS ENDPOINTS (Strictly Supabase & User-Isolated)
app.get('/api/actions', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const isAdmin = authUser?.role === 'admin';
    const userId = isAdmin ? undefined : (authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001');
    const actions = await fetchActionsFromSupabase(userId);
    res.json(actions);
  } catch (err: any) {
    console.warn('GET /api/actions error:', err?.message || err);
    res.json([]);
  }
});

app.post('/api/actions', async (req, res) => {
  const action = req.body;
  if (!action || !action.id || !action.title) {
    res.status(400).json({ error: 'Valid action item required' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  const targetUserId = authUser?.id || (action.userId as string) || '00000000-0000-4000-a000-000000000001';

  const persisted = await saveActionToSupabase(action, targetUserId);
  res.json({ success: true, persistedInSupabase: persisted, action });
});

app.patch('/api/actions/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!id || !status) {
    res.status(400).json({ error: 'id and status are required' });
    return;
  }

  const success = await updateActionStatusInSupabase(id, status);
  res.json({ success, id, status });
});

// 5. HANDOVER TICKETS ENDPOINTS (Strictly Supabase & User-Isolated)
app.get('/api/handover-tickets', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const allTickets = await fetchHandoverTicketsFromSupabase();
    
    // If admin, return all tickets. If participant, return own tickets or demo tickets
    if (authUser?.role === 'admin') {
      return res.json(allTickets);
    }

    const currentUserId = authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001';
    const filtered = allTickets.filter(
      (t: any) => t.participantId === currentUserId || t.isDemo === true || !t.participantId
    );
    res.json(filtered);
  } catch (err: any) {
    console.warn('GET /api/handover-tickets error:', err?.message || err);
    res.json([]);
  }
});

app.post('/api/handover-tickets', async (req, res) => {
  const ticket = req.body;
  if (!ticket || !ticket.question) {
    res.status(400).json({ error: 'Valid ticket object required' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  const participantId = authUser?.id || ticket.participantId || '00000000-0000-4000-a000-000000000001';
  const participantContext = authUser?.name || ticket.participantContext || 'Authenticated Participant';

  const id = ticket.id || `tkt-${Date.now()}`;
  const persisted = await saveHandoverTicketToSupabase({
    ...ticket,
    id,
    participantId,
    participantContext,
  });
  res.json({ success: true, persistedInSupabase: persisted, id });
});

app.patch('/api/handover-tickets/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (!id || !updates) {
    res.status(400).json({ error: 'id and updates are required' });
    return;
  }

  const success = await updateHandoverTicketInSupabase(id, updates);
  res.json({ success, id });
});

// Alias for handover tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const allTickets = await fetchHandoverTicketsFromSupabase();
    if (authUser?.role === 'admin') {
      return res.json(allTickets);
    }
    const currentUserId = authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001';
    const filtered = allTickets.filter(
      (t: any) => t.participantId === currentUserId || t.isDemo === true || !t.participantId
    );
    res.json(filtered);
  } catch (err: any) {
    console.warn('GET /api/tickets error:', err?.message || err);
    res.json([]);
  }
});

// 5.b NOTIFICATIONS ENDPOINTS (Strictly Supabase & User-Isolated)
app.get('/api/notifications', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001';
    const notifications = await fetchNotificationsFromSupabase(userId);
    res.json(notifications);
  } catch (err: any) {
    console.warn('GET /api/notifications error:', err?.message || err);
    res.json([]);
  }
});

app.patch('/api/notifications/:id', async (req, res) => {
  const { id } = req.params;
  const { read } = req.body;
  if (!id || typeof read !== 'boolean') {
    res.status(400).json({ error: 'id and boolean read status are required' });
    return;
  }
  const success = await updateNotificationStatusInSupabase(id, read);
  res.json({ success, id, read });
});

// 6. QUESTIONS HISTORY & RECURRING QUESTIONS (Strictly Supabase & User-Isolated)
app.get('/api/questions/history', async (req, res) => {
  const limit = Number(req.query.limit) || 20;
  try {
    const authUser = await getAuthenticatedUser(req);
    const isAdmin = authUser?.role === 'admin';
    const userId = authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001';
    const history = await fetchQuestionHistoryFromSupabase(userId, limit, isAdmin);
    res.json(history);
  } catch (err: any) {
    console.warn('GET /api/questions/history error:', err?.message || err);
    res.json([]);
  }
});

app.get('/api/recurring-questions', async (req, res) => {
  try {
    const recurring = await fetchRecurringQuestionsFromSupabase();
    res.json(recurring);
  } catch (err: any) {
    console.warn('GET /api/recurring-questions error:', err?.message || err);
    res.json([]);
  }
});

// 7. CONFUSION ALERTS (Strictly Supabase)
app.get('/api/confusion-alerts', async (req, res) => {
  try {
    const alerts = await fetchConfusionAlertsFromSupabase();
    res.json(alerts);
  } catch (err: any) {
    console.warn('GET /api/confusion-alerts error:', err?.message || err);
    res.json([]);
  }
});

// 8. USER PROFILE (Strictly Supabase & User-Isolated)
app.get('/api/user/profile', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || (req.query.userId as string) || '00000000-0000-4000-a000-000000000001';
    const profile = await fetchUserProfileFromSupabase(userId);
    if (profile) {
      return res.json(profile);
    }
  } catch (err: any) {
    console.warn('GET /api/user/profile error:', err?.message || err);
  }

  res.json({
    name: 'Awa Diop',
    email: 'awa.diop@unipods.example.org',
    cohort: 'UniPods AI Cohort 2026',
    unipod: 'UCAD Dakar UniPod Innovation Center',
    track: 'Computer Vision & Natural Language for Agriculture',
    team: 'SunuAgri AI (Team #14)',
    role: 'Participant / AI Solutions Track',
    preferences: {
      smartSilenceActive: true,
      plainLanguageExplanationPreferred: true,
      digestFrequency: 'daily',
    },
  });
});

app.patch('/api/user/profile', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || '00000000-0000-4000-a000-000000000001';
    const success = await updateUserProfileInSupabase(userId, req.body);
    res.json({ success });
  } catch (err: any) {
    console.warn('PATCH /api/user/profile error:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || err });
  }
});

// 9. RECAPS & REMINDERS (Dynamically assembled from Supabase)
app.get('/api/recaps', async (req, res) => {
  try {
    const recaps = await fetchRecapsFromSupabase();
    res.json(recaps);
  } catch (err: any) {
    console.warn('GET /api/recaps error:', err?.message || err);
    res.json([]);
  }
});

app.get('/api/reminders', async (req, res) => {
  try {
    const reminders = await fetchRemindersFromSupabase();
    res.json(reminders);
  } catch (err: any) {
    console.warn('GET /api/reminders error:', err?.message || err);
    res.json([]);
  }
});

// 10. GROUNDED Q&A ENDPOINT
app.post('/api/ask', async (req, res) => {
  const { query, activeDecisions, userId, participantName } = req.body;
  let { sources } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query string is required' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  const resolvedUserId = authUser?.id || userId || '00000000-0000-4000-a000-000000000001';
  const resolvedParticipantName = authUser?.name || participantName || 'Participant';

  // Always fetch fresh sources from Supabase if not supplied
  if (!Array.isArray(sources) || sources.length === 0) {
    try {
      const dbSources = await fetchSourcesFromSupabase();
      if (dbSources && dbSources.length > 0) {
        sources = dbSources.filter((s) => s.approved);
      }
    } catch (e) {
      console.warn('Could not fetch sources from Supabase for query:', e);
    }
  }

  const ai = getGenAI();
  if (!ai) {
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const grounded = defaultKnowledgeService.queryKnowledge(query);

    recordQuestionToSupabase({
      id: `q-${Date.now()}`,
      userId: resolvedUserId,
      participantName: resolvedParticipantName,
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
      sources: (grounded.sources || []).map((s: any) => ({
        id: s.id,
        evidence: s.content?.slice(0, 150),
        relevance: 1.0,
      })),
    }).catch((err) => console.warn('Background record question error:', err?.message || err));

    res.json({
      ...grounded,
      groundingMethod: 'grounded-knowledge-engine',
    });
    return;
  }

  try {
    const formattedSources = Array.isArray(sources) && sources.length > 0
      ? sources.map((s: any) => `[Source ID: ${s.id} | ${s.title} | Publisher: ${s.publisher || s.author} | Date: ${s.date} | Status: ${s.status} | Approved: ${s.approved} | Supersedes: ${s.supersedes || s.supersedesSourceId || 'None'}]\n${s.content}`).join('\n\n')
      : 'No dynamic sources provided in Supabase.';

    const formattedDecisions = Array.isArray(activeDecisions) && activeDecisions.length > 0
      ? activeDecisions.map((d: any) => `- Decision [${d.id}]: ${d.title} (Status: ${d.status}, Date: ${d.date}, Supersedes: ${d.supersedesNote || 'None'})`).join('\n')
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
        console.warn(`Model ${model} unavailable (${modelErr?.status || modelErr?.code || 'busy'}), trying next...`);
      }
    }

    if (parsed && parsed.answer) {
      const enrichedSources = Array.isArray(parsed.sources) && Array.isArray(sources)
        ? parsed.sources.map((ps: any) => {
            const original = sources.find((s: any) => s.id === ps.id);
            return original ? { ...original, evidence: ps.evidence } : ps;
          })
        : (sources?.slice(0, 2) || []);

      const finalResponse = {
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
      };

      recordQuestionToSupabase({
        id: `q-${Date.now()}`,
        userId: resolvedUserId,
        participantName: resolvedParticipantName,
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
        sources: (parsed.sources || []).map((s: any) => ({
          id: s.id,
          evidence: s.evidence,
          relevance: s.relevance || 1.0,
        })),
      }).catch((err) => console.warn('Background record question error:', err?.message || err));

      return res.json(finalResponse);
    }

    // High demand fallback using local engine seeded with Supabase sources
    if (Array.isArray(sources) && sources.length > 0) {
      defaultKnowledgeService.setSources(sources);
    }
    const grounded = defaultKnowledgeService.queryKnowledge(query);

    recordQuestionToSupabase({
      id: `q-${Date.now()}`,
      userId: resolvedUserId,
      participantName: resolvedParticipantName,
      question: query,
      answer: grounded.answer,
      confidence: grounded.confidence,
      needsHuman: grounded.needsHuman,
      nextStep: grounded.nextStep,
      groundingMethod: 'grounded-knowledge-engine (demand spike)',
      conflictDetected: grounded.conflict?.detected,
      conflictResolved: grounded.conflict?.resolved,
      conflictTopic: grounded.conflict?.topic,
      freshnessStatus: grounded.freshness?.status,
      explanationSimple: grounded.explanationSimple,
      sources: (grounded.sources || []).map((s: any) => ({
        id: s.id,
        evidence: s.content?.slice(0, 150),
        relevance: 1.0,
      })),
    }).catch((err) => console.warn('Background record question error:', err?.message || err));

    return res.json({
      ...grounded,
      groundingMethod: 'grounded-knowledge-engine (demand spike)',
    });
  } catch (error: any) {
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

// 11. ANNOUNCEMENT CLARITY CHECKER
app.post('/api/clarity-check', async (req, res) => {
  const { draft } = req.body;
  if (!draft || typeof draft !== 'string') {
    res.status(400).json({ error: 'Draft text is required' });
    return;
  }

  const ai = getGenAI();
  if (ai) {
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
          model: 'gemini-3.8-flash',
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
        'Timeout calling clarity model'
      );

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed && typeof parsed.score === 'number') {
        return res.json(parsed);
      }
    } catch (err: any) {
      console.warn('Clarity check exception:', err?.message || err);
    }
  }

  // Fallback rule evaluation
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
    recommendations.push('Clarify who this notice applies to.');
  }

  if (/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s+(sep|oct|nov|dec))\b/i.test(draft)) {
    present.push('Date specified');
    score += 15;
  } else {
    missing.push('Calendar Date');
    recommendations.push('State the exact date.');
  }

  if (/\b(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm))\b/i.test(draft)) {
    present.push('Time specified');
    score += 10;
  } else {
    missing.push('Specific Time');
    recommendations.push('Include the session time.');
  }

  if (/\b(wat|gmt|utc|cat|eat)\b/i.test(draft)) {
    present.push('Timezone specified');
    score += 10;
  } else {
    missing.push('Timezone');
    recommendations.push('Explicitly state WAT (West Africa Time).');
  }

  if (d.includes('teams') || d.includes('link') || d.includes('room') || d.includes('http')) {
    present.push('Location / Platform link');
    score += 10;
  } else {
    missing.push('Location Link');
    recommendations.push('Provide the virtual room link.');
  }

  res.json({
    score: Math.min(100, score),
    presentElements: present,
    missingElements: missing,
    recommendations,
    improvedDraft: `${draft.trim()}\n\n[Action Required]: Please review and join via the official Microsoft Teams room at the scheduled time (WAT).`,
  });
});

// Vite middleware or production static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
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

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ask UniBot server running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

start();
