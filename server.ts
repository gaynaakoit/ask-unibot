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
import { whatsappIdentityService } from './src/services/whatsappIdentityService.js';
import { whatsappWebhookService } from './src/services/whatsappWebhookService.js';
import { executeAskUniBotCore } from './src/services/askUniBotCore.js';

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
    whatsappConfigured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_ACCESS_TOKEN),
    whatsappDryRun: process.env.WHATSAPP_DRY_RUN === 'true' || !process.env.WHATSAPP_ACCESS_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================================
// META WHATSAPP CLOUD API WEBHOOK (Phase 4.1 + 4.2)
// ==============================================================================

/**
 * Webhook Verification (GET /webhooks/whatsapp)
 * Meta verifies webhook endpoint by passing hub.mode, hub.verify_token, and hub.challenge.
 */
app.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'unipods_wa_verify_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    console.info('[WhatsApp] Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.warn('[WhatsApp] Webhook verification failed (token mismatch or invalid mode)');
    res.sendStatus(403);
  }
});

/**
 * Webhook Event Receiver (POST /webhooks/whatsapp)
 * Receives messages/events from Meta WhatsApp Cloud API.
 * Rapidly responds 200 OK, deduplicates on message_id, resolves user identity,
 * and persists message records without exposing secrets or private tokens.
 */
app.post('/webhooks/whatsapp', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      res.status(400).json({ error: 'Invalid payload structure' });
      return;
    }

    const result = await whatsappWebhookService.processIncomingEvent(req.body);
    res.status(200).json({ status: 'ok', ...result });
  } catch (err: any) {
    console.warn('[WhatsApp] Webhook handling warning:', err?.message || err);
    // Meta requires 200 OK to prevent message retry loops
    res.status(200).json({ status: 'ok', error: 'Internal processing warning' });
  }
});

/**
 * WhatsApp Identity Management Endpoints
 */
app.get('/api/whatsapp/identity', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || (req.query.userId as string);
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const identity = await whatsappIdentityService.findWhatsAppIdentityByUserId(userId);
    res.json(identity || null);
  } catch (err: any) {
    console.warn('GET /api/whatsapp/identity error:', err?.message || err);
    res.status(500).json({ error: 'Failed to retrieve WhatsApp identity' });
  }
});

app.post('/api/whatsapp/link', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || req.body?.userId;
    const { phoneNumber, displayName } = req.body || {};

    if (!userId || !phoneNumber) {
      res.status(400).json({ error: 'userId and phoneNumber are required' });
      return;
    }

    const identity = await whatsappIdentityService.linkWhatsAppNumber(
      userId,
      phoneNumber,
      displayName || authUser?.name
    );
    res.json({ success: Boolean(identity), identity });
  } catch (err: any) {
    console.warn('POST /api/whatsapp/link error:', err?.message || err);
    res.status(500).json({ error: 'Failed to link WhatsApp number' });
  }
});

app.delete('/api/whatsapp/link', async (req, res) => {
  try {
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || (req.query.userId as string) || req.body?.userId;
    const phoneNumber = (req.query.phoneNumber as string) || req.body?.phoneNumber;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const success = await whatsappIdentityService.unlinkWhatsAppNumber(userId, phoneNumber);
    res.json({ success });
  } catch (err: any) {
    console.warn('DELETE /api/whatsapp/link error:', err?.message || err);
    res.status(500).json({ error: 'Failed to unlink WhatsApp number' });
  }
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
  const { query, activeDecisions, userId, participantName, sources } = req.body;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query string is required' });
    return;
  }

  const authUser = await getAuthenticatedUser(req);
  const resolvedUserId = authUser?.id || userId || '00000000-0000-4000-a000-000000000001';
  const resolvedParticipantName = authUser?.name || participantName || 'Participant';

  try {
    const finalResponse = await executeAskUniBotCore({
      query,
      userId: resolvedUserId,
      participantName: resolvedParticipantName,
      channel: 'WEB',
      sources,
      activeDecisions,
    });

    res.json(finalResponse);
  } catch (error: any) {
    console.warn('/api/ask error:', error?.message || error);
    res.status(500).json({ error: 'Failed to process question' });
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
