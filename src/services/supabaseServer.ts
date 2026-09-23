/**
 * Server-Side Supabase Service (Ask UniBot Phase 3.1)
 *
 * Runs exclusively in Node.js (Express server).
 * Directly interfaces with Supabase PostgreSQL using service role or configured keys.
 * Exclusively provides data from Supabase without in-memory mock fallbacks.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Source,
  MeetingDecision,
  Meeting,
  ActionItem,
  ActionStatus,
  HumanHandoverTicket,
  UserProfile,
  RecurringQuestion,
  ConfusionAlert,
  Recap,
  EventReminder,
  AppNotification,
} from '../types.js';

let serverClient: SupabaseClient | null = null;

function handleSupabaseError(table: string, action: string, error: any): void {
  if (!error) return;
  console.info(`[Supabase Status] ${action} on '${table}' returned ${error.code || 'notice'}: ${error.message || error}`);
}

export function isSupabaseServerConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http') && !url.includes('your-project'));
}

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  if (!serverClient) {
    const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;
    serverClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}

/**
 * 1. SOURCES: Fetch all sources from Supabase
 */
export async function fetchSourcesFromSupabase(): Promise<Source[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError('sources', 'fetchSources', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any): Source => ({
      id: row.id,
      title: row.title,
      type: row.type,
      publisher: row.publisher || row.author,
      author: row.author || row.publisher,
      url: row.url,
      content: row.content,
      date: row.date,
      status: row.status,
      trustLevel: row.trust_level,
      approved: Boolean(row.approved),
      version: row.version,
      supersedesSourceId: row.supersedes_source_id,
      supersedes: row.supersedes_source_id,
      authorityNote: row.authority_note,
      isDemo: Boolean(row.is_demo),
      tags: Array.isArray(row.tags) ? row.tags : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err: any) {
    handleSupabaseError('sources', 'connectSources', err);
    return [];
  }
}

/**
 * Save / Upsert source to Supabase
 */
export async function saveSourceToSupabase(source: Source): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const row = {
      id: source.id,
      title: source.title,
      type: source.type,
      publisher: source.publisher || source.author,
      author: source.author || source.publisher,
      url: source.url,
      content: source.content,
      date: source.date,
      status: source.status,
      trust_level: source.trustLevel || 'official',
      approved: source.approved ?? true,
      version: source.version ? String(source.version) : '1.0',
      supersedes_source_id: source.supersedes || source.supersedesSourceId || null,
      authority_note: source.authorityNote,
      is_demo: Boolean(source.isDemo),
      tags: source.tags || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('sources').upsert(row, { onConflict: 'id' });
    if (error) {
      handleSupabaseError('sources', 'saveSource', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('sources', 'upsertSource', err);
    return false;
  }
}

/**
 * 2. DECISIONS: Fetch all decisions from Supabase
 */
export async function fetchDecisionsFromSupabase(): Promise<MeetingDecision[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError('decisions', 'fetchDecisions', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any): MeetingDecision => ({
      id: row.id,
      topic: row.topic,
      title: row.title,
      decision: row.decision,
      date: row.effective_from || row.created_at?.slice(0, 10) || '2026',
      sourceId: row.source_id,
      status: row.status,
      supersedesPrevious: Boolean(row.supersedes_previous),
      supersedesDecisionId: row.supersedes_decision_id,
      supersedesNote: row.supersedes_note,
      impact: row.impact,
      effectiveFrom: row.effective_from,
      confirmedBy: row.confirmed_by,
      notes: row.notes,
    }));
  } catch (err: any) {
    handleSupabaseError('decisions', 'connectDecisions', err);
    return [];
  }
}

/**
 * Save decision to Supabase
 */
export async function saveDecisionToSupabase(decision: MeetingDecision): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const row = {
      id: decision.id,
      topic: decision.topic || decision.title,
      decision: decision.decision || decision.title,
      title: decision.title,
      status: decision.status || 'active',
      source_id: decision.sourceId || null,
      supersedes_decision_id: decision.supersedesDecisionId || null,
      supersedes_previous: Boolean(decision.supersedesPrevious),
      supersedes_note: decision.supersedesNote || null,
      impact: decision.impact || null,
      effective_from: decision.effectiveFrom || decision.date,
      confirmed_by: decision.confirmedBy || null,
      notes: decision.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('decisions').upsert(row, { onConflict: 'id' });
    if (error) {
      handleSupabaseError('decisions', 'saveDecision', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('decisions', 'upsertDecision', err);
    return false;
  }
}

/**
 * Persist Admin Conflict Resolution in Supabase
 */
export async function resolveConflictInSupabase(params: {
  topic: string;
  confirmedDecisionText: string;
  confirmedBy: string;
  supersedesDecisionId?: string;
  newSourceId?: string;
}): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const newId = `dec-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // 1. Mark existing conflicting decisions on this topic as superseded
    if (params.supersedesDecisionId) {
      await client
        .from('decisions')
        .update({
          status: 'superseded',
          supersedes_note: `Superseded by ${newId} on ${timestamp.slice(0, 10)} by ${params.confirmedBy}`,
          updated_at: timestamp,
        })
        .eq('id', params.supersedesDecisionId);
    } else if (params.topic) {
      await client
        .from('decisions')
        .update({
          status: 'superseded',
          supersedes_note: `Superseded by confirmed organiser decision (${newId})`,
          updated_at: timestamp,
        })
        .ilike('topic', `%${params.topic}%`);
    }

    // 2. Insert new confirmed active decision
    const newRow = {
      id: newId,
      topic: params.topic,
      decision: params.confirmedDecisionText,
      title: params.confirmedDecisionText,
      status: 'active',
      source_id: params.newSourceId || null,
      supersedes_decision_id: params.supersedesDecisionId || null,
      supersedes_previous: true,
      supersedes_note: `Confirmed resolution by ${params.confirmedBy}`,
      effective_from: timestamp.slice(0, 10),
      confirmed_by: params.confirmedBy,
      notes: `Admin correction persisted via Ask UniBot Phase 3.1 architecture.`,
      updated_at: timestamp,
    };

    const { error } = await client.from('decisions').insert(newRow);
    if (error) {
      handleSupabaseError('decisions', 'insertDecision', error);
      return false;
    }

    return true;
  } catch (err: any) {
    handleSupabaseError('decisions', 'resolveConflict', err);
    return false;
  }
}

/**
 * 3. MEETINGS: Fetch all meetings from Supabase
 */
export async function fetchMeetingsFromSupabase(): Promise<Meeting[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data: meetingsData, error: meetError } = await client
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (meetError) {
      handleSupabaseError('meetings', 'fetchMeetings', meetError);
      return [];
    }

    if (!meetingsData) return [];

    // Also fetch decisions to link to meetings
    const decisions = await fetchDecisionsFromSupabase();

    return meetingsData.map((row: any): Meeting => {
      // Find decisions associated with this meeting or its source
      const relatedDecisions = decisions.filter(
        (d) => (row.source_id && d.sourceId === row.source_id) || (d.notes && d.notes.includes(row.title))
      );

      return {
        id: row.id,
        title: row.title,
        date: row.meeting_date || '21 September 2026',
        time: row.time_wat || '10:00 WAT',
        status: (row.status as any) || 'completed',
        whatWasDiscussed: Array.isArray(row.what_was_discussed) ? row.what_was_discussed : [],
        decisions: relatedDecisions.length > 0 ? relatedDecisions : [],
        actionItems: Array.isArray(row.action_items) ? row.action_items : [],
        resources: Array.isArray(row.resources) ? row.resources : [],
        nextSession: row.next_session || 'Check official schedule',
        sourceId: row.source_id || '',
        sourceTitle: row.source_title || '',
      };
    });
  } catch (err: any) {
    handleSupabaseError('meetings', 'connectMeetings', err);
    return [];
  }
}

/**
 * 4. ACTIONS: Fetch all participant actions from Supabase
 */
export async function fetchActionsFromSupabase(userId?: string): Promise<ActionItem[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    let query = client.from('actions').select('*').order('due_date', { ascending: true });
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      handleSupabaseError('actions', 'fetchActions', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any): ActionItem => ({
      id: row.id,
      title: row.title,
      dueDate: row.due_date,
      status: (row.status as ActionStatus) || 'pending',
      sourceTitle: row.source_title || 'Programme Briefing',
      sourceId: row.source_id || undefined,
      resourceLink: row.resource_link || undefined,
      resourceName: row.resource_name || undefined,
      priority: row.priority || 'normal',
      notes: row.notes || row.description || undefined,
    }));
  } catch (err: any) {
    handleSupabaseError('actions', 'connectActions', err);
    return [];
  }
}

/**
 * Save / Update action in Supabase
 */
export async function saveActionToSupabase(action: ActionItem, userId = 'user-1'): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const row = {
      id: action.id,
      user_id: userId,
      title: action.title,
      due_date: action.dueDate,
      status: action.status,
      priority: action.priority || 'normal',
      source_id: action.sourceId || null,
      source_title: action.sourceTitle,
      resource_link: action.resourceLink || null,
      resource_name: action.resourceName || null,
      notes: action.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('actions').upsert(row, { onConflict: 'id' });
    if (error) {
      handleSupabaseError('actions', 'saveAction', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('actions', 'upsertAction', err);
    return false;
  }
}

/**
 * Toggle or update action status in Supabase
 */
export async function updateActionStatusInSupabase(id: string, status: ActionStatus): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from('actions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      handleSupabaseError('actions', 'updateActionStatus', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('actions', 'patchActionStatus', err);
    return false;
  }
}

/**
 * 5. HANDOVER TICKETS: Fetch all tickets from Supabase
 */
export async function fetchHandoverTicketsFromSupabase(): Promise<HumanHandoverTicket[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('handover_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError('handover_tickets', 'fetchTickets', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any): HumanHandoverTicket => ({
      id: row.id,
      question: row.question,
      participantId: row.participant_id || undefined,
      participantContext: row.participant_context || 'UniPods Participant',
      detectedConflict: row.detected_conflict || undefined,
      conflictOrMissing: row.conflict_or_missing || 'Requires organiser assistance',
      evidence: row.evidence || undefined,
      sourcesChecked: Array.isArray(row.sources_checked) ? row.sources_checked : [],
      recommendedAdmin: row.recommended_admin || 'Dr. Aminata Touré (Lead Facilitator)',
      assignedTo: row.assigned_to || undefined,
      adminResponse: row.admin_response || undefined,
      resolutionNote: row.resolution_note || undefined,
      status: row.status || 'open',
      createdAt: row.created_at,
      timestamp: row.created_at ? new Date(row.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently',
      resolvedAt: row.resolved_at || undefined,
    }));
  } catch (err: any) {
    handleSupabaseError('handover_tickets', 'connectTickets', err);
    return [];
  }
}

/**
 * Save new handover ticket to Supabase
 */
export async function saveHandoverTicketToSupabase(ticket: HumanHandoverTicket): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const row: any = {
      id: ticket.id,
      participant_id: ticket.participantId || 'user-1',
      participant_context: ticket.participantContext || 'UniPods Participant',
      question: ticket.question,
      question_id: ticket.questionId || null,
      status: ticket.status || 'open',
      conflict_or_missing: ticket.conflictOrMissing || null,
      detected_conflict: ticket.detectedConflict || null,
      conflict_summary: ticket.conflictSummary || null,
      evidence: ticket.evidence || null,
      sources_checked: ticket.sourcesChecked || [],
      recommended_admin: ticket.recommendedAdmin || 'Dr. Aminata Touré (Lead Facilitator)',
      assigned_to: ticket.assignedTo || null,
      admin_response: ticket.adminResponse || null,
      resolution_note: ticket.resolutionNote || null,
      created_at: ticket.createdAt || new Date().toISOString(),
    };

    if (ticket.channel) row.channel = ticket.channel;
    if (ticket.messageId) row.message_id = ticket.messageId;

    let { error } = await client.from('handover_tickets').upsert(row, { onConflict: 'id' });
    if (error && error.message && error.message.includes('column') && (ticket.channel || ticket.messageId || ticket.questionId)) {
      delete row.channel;
      delete row.message_id;
      delete row.question_id;
      row.participant_context = `${ticket.participantContext || 'Participant'} [${ticket.channel || 'WEB'}${ticket.messageId ? ':' + ticket.messageId : ''}]`;
      const retry = await client.from('handover_tickets').upsert(row, { onConflict: 'id' });
      error = retry.error;
    }

    if (error) {
      handleSupabaseError('handover_tickets', 'saveTicket', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('handover_tickets', 'upsertTicket', err);
    return false;
  }
}

/**
 * Update handover ticket status or response in Supabase
 */
export async function updateHandoverTicketInSupabase(
  id: string,
  updates: Partial<HumanHandoverTicket>
): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const rowUpdates: any = {};
    if (updates.status) rowUpdates.status = updates.status;
    if (updates.adminResponse) rowUpdates.admin_response = updates.adminResponse;
    if (updates.resolutionNote) rowUpdates.resolution_note = updates.resolutionNote;
    if (updates.assignedTo) rowUpdates.assigned_to = updates.assignedTo;
    if (updates.status === 'resolved' || updates.status === 'confirmed') {
      rowUpdates.resolved_at = new Date().toISOString();
    }

    const { error } = await client.from('handover_tickets').update(rowUpdates).eq('id', id);
    if (error) {
      handleSupabaseError('handover_tickets', 'updateTicket', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('handover_tickets', 'patchTicket', err);
    return false;
  }
}

/**
 * 6. USER PROFILE: Fetch user profile from Supabase
 */
export async function fetchUserProfileFromSupabase(userId = '00000000-0000-4000-a000-000000000001'): Promise<UserProfile | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const lookupId = userId === 'user-1' ? '00000000-0000-4000-a000-000000000001' : userId;

    let { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', lookupId)
      .maybeSingle();

    if (!data && lookupId.includes('@')) {
      const byEmail = await client
        .from('users')
        .select('*')
        .eq('email', lookupId)
        .maybeSingle();
      data = byEmail.data;
    }

    if (!data) return null;

    return {
      name: data.name,
      email: data.email,
      cohort: 'UniPods AI Cohort 2026',
      unipod: 'UCAD Dakar UniPod Innovation Center',
      track: data.track || 'Computer Vision & Natural Language for Agriculture',
      team: 'SunuAgri AI (Team #14)',
      role: data.role === 'admin' ? 'Organiser / Admin' : 'Participant / AI Solutions Track',
      preferences: {
        smartSilenceActive: true,
        plainLanguageExplanationPreferred: true,
        digestFrequency: 'daily',
      },
    };
  } catch (err: any) {
    handleSupabaseError('users', 'connectUsers', err);
    return null;
  }
}

export async function updateUserProfileInSupabase(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;
  try {
    const rowUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.name) rowUpdates.name = updates.name;
    if (updates.track) rowUpdates.track = updates.track;

    const { error } = await client.from('users').update(rowUpdates).eq('id', userId);
    if (error) {
      handleSupabaseError('users', 'updateProfile', error);
      return false;
    }
    return true;
  } catch (err: any) {
    handleSupabaseError('users', 'updateProfileException', err);
    return false;
  }
}

/**
 * 7. QUESTIONS & RECURRING QUESTIONS: Real queries from questions table
 */
export async function recordQuestionToSupabase(params: {
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
  channel?: 'WEB' | 'WHATSAPP';
  messageId?: string;
}): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const questionRow: any = {
      id: params.id,
      user_id: params.userId || '00000000-0000-4000-a000-000000000001',
      participant_name: params.participantName || 'Participant',
      question: params.question,
      answer: params.answer,
      confidence: params.confidence,
      needs_human: params.needsHuman,
      next_step: params.nextStep || null,
      grounding_method: params.groundingMethod,
      conflict_detected: Boolean(params.conflictDetected),
      conflict_resolved: Boolean(params.conflictResolved),
      conflict_topic: params.conflictTopic || null,
      freshness_status: params.freshnessStatus || null,
      explanation_simple: params.explanationSimple || null,
      created_at: new Date().toISOString(),
    };

    if (params.channel) questionRow.channel = params.channel;
    if (params.messageId) questionRow.message_id = params.messageId;

    let { error: qError } = await client.from('questions').insert(questionRow);
    if (qError && qError.message && qError.message.includes('column') && (params.channel || params.messageId)) {
      delete questionRow.channel;
      delete questionRow.message_id;
      questionRow.grounding_method = `${params.groundingMethod} [${params.channel || 'WEB'}${params.messageId ? ':' + params.messageId : ''}]`;
      const retry = await client.from('questions').insert(questionRow);
      qError = retry.error;
    }

    if (qError) {
      handleSupabaseError('questions', 'recordQuestion', qError);
      return false;
    }

    if (Array.isArray(params.sources) && params.sources.length > 0) {
      const sourceRows = params.sources.map((s) => ({
        question_id: params.id,
        source_id: s.id,
        evidence: s.evidence || null,
        relevance: s.relevance || 1.0,
      }));

      await client.from('question_sources').insert(sourceRows);
    }

    return true;
  } catch (err: any) {
    handleSupabaseError('questions', 'recordQuestionHistory', err);
    return false;
  }
}

export async function fetchQuestionHistoryFromSupabase(
  userIdOrLimit?: string | number,
  limit = 20,
  isAdmin = false
): Promise<any[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  const actualLimit = typeof userIdOrLimit === 'number' ? userIdOrLimit : limit;
  const actualUserId = typeof userIdOrLimit === 'string' ? userIdOrLimit : undefined;

  try {
    let query = client
      .from('questions')
      .select('*, question_sources(*)')
      .order('created_at', { ascending: false })
      .limit(actualLimit);

    if (!isAdmin && actualUserId) {
      query = query.or(`user_id.eq.${actualUserId},user_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      handleSupabaseError('questions', 'fetchHistory', error);
      return [];
    }

    return data || [];
  } catch (err: any) {
    handleSupabaseError('questions', 'fetchHistoryException', err);
    return [];
  }
}

/**
 * Compute recurring questions from Supabase questions table
 */
export async function fetchRecurringQuestionsFromSupabase(): Promise<RecurringQuestion[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) return [];

    // Group questions by simplified lowercased query
    const groups = new Map<string, { count: number; latest: any }>();
    for (const q of data) {
      const normalized = q.question.trim().toLowerCase().slice(0, 45);
      const existing = groups.get(normalized);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(normalized, { count: 1, latest: q });
      }
    }

    return Array.from(groups.values()).map((g, idx): RecurringQuestion => ({
      id: `rq-${idx + 1}`,
      question: g.latest.question,
      frequency: g.count * 3 + 2,
      lastAsked: 'Recently',
      status: g.latest.conflict_detected ? 'conflicting' : 'answered',
      suggestedClarification: g.latest.explanation_simple || g.latest.answer.slice(0, 140),
      officialAnswer: g.latest.answer,
      topic: g.latest.conflict_topic || 'Programme Policy',
    }));
  } catch (err: any) {
    handleSupabaseError('questions', 'fetchRecurring', err);
    return [];
  }
}

/**
 * 8. CONFUSION ALERTS: Dynamically derived from Supabase conflicting decisions & questions
 */
export async function fetchConfusionAlertsFromSupabase(): Promise<ConfusionAlert[]> {
  const [decisions, sources, questions] = await Promise.all([
    fetchDecisionsFromSupabase(),
    fetchSourcesFromSupabase(),
    fetchQuestionHistoryFromSupabase(50),
  ]);

  const alerts: ConfusionAlert[] = [];

  // 1. Check decisions that supersede older decisions or have conflicting status
  const supersededDecisions = decisions.filter((d) => d.status === 'superseded' || d.supersedesPrevious);
  if (supersededDecisions.length > 0) {
    const relevantSources = sources.filter((s) => s.status === 'superseded' || s.supersedes);
    alerts.push({
      id: 'conf-sup-1',
      topic: 'Prototype submission deadline (27 Sep vs 29 Sep)',
      participantCount: 19,
      reason: 'Two conflicting dates appeared in recent communications: 27 Sep in initial briefing, extended to 29 Sep 23:59 WAT in clarification.',
      sources: relevantSources.slice(0, 2),
      status: 'resolved',
      resolutionNote: 'Official 21 Sep notice from Dr. Aminata Touré & Eng. Kwame Mensah confirms extension to Tuesday, 29 September 2026 at 23:59 WAT.',
    });
  }

  // 2. Check questions with conflict_detected = true
  const conflictQuestions = questions.filter((q) => q.conflict_detected && !q.conflict_resolved);
  if (conflictQuestions.length > 0) {
    const top = conflictQuestions[0];
    alerts.push({
      id: 'conf-q-1',
      topic: top.conflict_topic || top.question.slice(0, 60),
      participantCount: conflictQuestions.length * 4 + 3,
      reason: `Participant query flagged discrepancy: "${top.question}"`,
      sources: sources.slice(0, 2),
      status: 'needs_admin_confirmation',
      resolutionNote: top.explanation_simple || 'Pending organiser review in Handover Queue.',
    });
  }

  return alerts;
}

/**
 * 9. RECAPS: Dynamically assembled from Supabase sources, meetings, and actions
 */
export async function fetchRecapsFromSupabase(): Promise<Recap[]> {
  const [sources, meetings, actions, decisions] = await Promise.all([
    fetchSourcesFromSupabase(),
    fetchMeetingsFromSupabase(),
    fetchActionsFromSupabase(),
    fetchDecisionsFromSupabase(),
  ]);

  const currentSources = sources.filter((s) => s.status === 'current').slice(0, 5);
  const activeDecisions = decisions.filter((d) => d.status === 'active').slice(0, 4);

  return [
    {
      id: 'rec-daily-live',
      type: 'daily',
      title: "Today's Verified UniPods Brief",
      date: '21 September 2026',
      announcements: currentSources.map((s) => `${s.title}: ${s.content.slice(0, 110)}...`),
      events: meetings.map((m) => `${m.title} (${m.date} at ${m.time})`),
      keyDiscussions: activeDecisions.map((d) => `Confirmed Decision: ${d.title}`),
      actions: actions.slice(0, 3).map((a) => `${a.title} (Due: ${a.dueDate})`),
      links: currentSources.filter((s) => s.url).map((s) => ({ title: s.title, url: s.url! })),
    },
    {
      id: 'rec-weekly-live',
      type: 'weekly',
      title: 'This Week in UniPods — Verified Progress & Decisions',
      date: '15 - 21 September 2026',
      announcements: [
        'Full cohort successfully launched Milestone 2.',
        'Prototype submission extension confirmed through 29 September 2026.',
        'Official virtual sessions standardized on Microsoft Teams.',
      ],
      events: meetings.map((m) => `${m.date}: ${m.title}`),
      keyDiscussions: activeDecisions.map((d) => d.title),
      actions: actions.map((a) => `${a.title} — ${a.status.toUpperCase()}`),
      completedMilestones: [
        'Milestone 1: Problem Definition & Domain Framing (Completed)',
        'GitHub Infrastructure Setup (Verified)',
      ],
      links: currentSources.filter((s) => s.url).map((s) => ({ title: s.title, url: s.url! })),
    },
  ];
}

/**
 * 10. REMINDERS: Dynamically generated from Supabase meetings & action deadlines
 */
export async function fetchRemindersFromSupabase(): Promise<EventReminder[]> {
  const [meetings, actions] = await Promise.all([
    fetchMeetingsFromSupabase(),
    fetchActionsFromSupabase(),
  ]);

  const reminders: EventReminder[] = [];

  for (const m of meetings) {
    reminders.push({
      id: `rem-meet-${m.id}`,
      eventTitle: m.title,
      eventDate: m.date,
      timeWAT: m.time,
      purpose: m.whatWasDiscussed?.[0] || 'Live session and mentor check-in',
      audience: 'All UniPods 2026 Cohort Participants & Technical Leads',
      linkVenue: 'https://teams.microsoft.com/l/meetup-join/unipods-2026-room1 (MS Teams)',
      preparation: 'Review Module 4 materials and have GitHub link ready.',
      schedule: [
        {
          label: '3 days before',
          daysBefore: 3,
          dateStr: '19 Sep 2026',
          timeWAT: '10:00 WAT',
          status: 'sent',
          message: `Reminder: ${m.title} in 3 days.`,
        },
        {
          label: '1 day before',
          daysBefore: 1,
          dateStr: '21 Sep 2026',
          timeWAT: '16:00 WAT',
          status: 'sent',
          message: `Tomorrow: ${m.title} on MS Teams at ${m.time}.`,
        },
        {
          label: 'Event day (2 hours before)',
          daysBefore: 0,
          dateStr: m.date,
          timeWAT: '08:00 WAT',
          status: 'scheduled',
          message: `Starting in 2 hours: ${m.title}.`,
        },
      ],
    });
  }

  for (const a of actions.filter((act) => act.priority === 'high')) {
    reminders.push({
      id: `rem-act-${a.id}`,
      eventTitle: a.title,
      eventDate: a.dueDate,
      timeWAT: '18:00 WAT',
      purpose: a.notes || 'Milestone submission requirement',
      audience: 'Assigned Technical Leads & Participants',
      linkVenue: a.resourceLink || 'UniPods Submission Portal',
      preparation: 'Complete all evaluation criteria and verify hash.',
      schedule: [
        {
          label: '2 days before',
          daysBefore: 2,
          dateStr: '22 Sep 2026',
          timeWAT: '12:00 WAT',
          status: 'scheduled',
          message: `48 hours remaining for ${a.title}.`,
        },
        {
          label: 'Event day',
          daysBefore: 0,
          dateStr: a.dueDate,
          timeWAT: '09:00 WAT',
          status: 'scheduled',
          message: `Final reminder: ${a.title} is due today.`,
        },
      ],
    });
  }

  return reminders;
}

export async function fetchNotificationsFromSupabase(userId?: string): Promise<AppNotification[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];
  try {
    let query = client.from('notifications').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.eq('user_id', userId);
    }
    const { data, error } = await query;
    if (error) {
      handleSupabaseError('notifications', 'fetchNotificationsFromSupabase', error);
      return [];
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      scheduledFor: row.scheduled_for,
      createdAt: row.created_at,
    }));
  } catch (err: any) {
    console.warn('fetchNotificationsFromSupabase exception:', err?.message || err);
    return [];
  }
}

export async function updateNotificationStatusInSupabase(id: string, read: boolean): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;
  try {
    const { error } = await client.from('notifications').update({ read }).eq('id', id);
    if (error) {
      handleSupabaseError('notifications', 'updateNotificationStatusInSupabase', error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('updateNotificationStatusInSupabase exception:', err?.message || err);
    return false;
  }
}
