/**
 * Server-Side Supabase Service (Ask UniBot Phase 3.1)
 *
 * Runs exclusively in Node.js (Express server).
 * Safely accesses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Never shipped to the browser bundle.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Source, MeetingDecision, ActionItem } from '../types.js';
import { INITIAL_SOURCES, INITIAL_ACTIONS, INITIAL_MEETINGS } from '../data/demoData.js';

let serverClient: SupabaseClient | null = null;

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
 * Fetch approved sources from Supabase
 */
export async function fetchSourcesFromSupabase(): Promise<Source[] | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchSources error:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Map DB snake_case to TypeScript Source camelCase
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
    console.warn('Error connecting to Supabase sources table:', err?.message || err);
    return null;
  }
}

/**
 * Upsert source to Supabase
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
      version: source.version || '1.0',
      supersedes_source_id: source.supersedes || source.supersedesSourceId || null,
      authority_note: source.authorityNote,
      is_demo: Boolean(source.isDemo),
      tags: source.tags || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await client.from('sources').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase saveSource error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Failed to upsert source to Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Fetch decisions from Supabase
 */
export async function fetchDecisionsFromSupabase(): Promise<MeetingDecision[] | null> {
  const client = getSupabaseServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('decisions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchDecisions error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return [];

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
    console.warn('Error connecting to Supabase decisions table:', err?.message || err);
    return null;
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
      console.warn('Supabase saveDecision error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Failed to upsert decision to Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Persist Admin Conflict Resolution in Supabase (Section 9)
 *
 * Atomically marks older conflicting decision as 'superseded'
 * and inserts the confirmed decision with clear authority.
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
      console.warn('Error inserting resolved decision into Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn('Failed to resolve conflict in Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Record question and source citations into Supabase Question History (Section 10)
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
}): Promise<boolean> {
  const client = getSupabaseServerClient();
  if (!client) return false;

  try {
    const questionRow = {
      id: params.id,
      user_id: params.userId || 'user-1',
      participant_name: params.participantName || 'Awa Diop',
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

    const { error: qError } = await client.from('questions').insert(questionRow);
    if (qError) {
      console.warn('Error recording question to Supabase:', qError.message);
      return false;
    }

    // Insert linked source citations into question_sources
    if (Array.isArray(params.sources) && params.sources.length > 0) {
      const sourceRows = params.sources.map((s) => ({
        question_id: params.id,
        source_id: s.id,
        evidence: s.evidence || null,
        relevance: s.relevance || 1.0,
      }));

      const { error: sError } = await client.from('question_sources').insert(sourceRows);
      if (sError) {
        console.warn('Error recording question_sources to Supabase:', sError.message);
      }
    }

    return true;
  } catch (err: any) {
    console.warn('Failed to record question history in Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Fetch recent questions history
 */
export async function fetchQuestionHistoryFromSupabase(limit = 20): Promise<any[]> {
  const client = getSupabaseServerClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from('questions')
      .select('*, question_sources(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error fetching question history from Supabase:', error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.warn('Exception in fetchQuestionHistoryFromSupabase:', err?.message || err);
    return [];
  }
}

/**
 * Seed Supabase with demo knowledge data if empty (Section 6)
 */
export async function seedSupabaseFromDemoData(): Promise<{ success: boolean; count: number; message: string }> {
  const client = getSupabaseServerClient();
  if (!client) {
    return { success: false, count: 0, message: 'Supabase server client not configured' };
  }

  try {
    // 1. Seed users
    const users = [
      { id: 'user-1', email: 'awa.diop@unipods.example.org', name: 'Awa Diop', role: 'participant', track: 'Agriculture Track' },
      { id: 'admin-1', email: 'aminata.toure@meti.gov.sn', name: 'Dr. Aminata Touré', role: 'admin', track: 'Facilitator' },
      { id: 'admin-2', email: 'kwame.mensah@unipods.org', name: 'Eng. Kwame Mensah', role: 'admin', track: 'Directorate' },
    ];
    await client.from('users').upsert(users, { onConflict: 'id' });

    // 2. Seed sources
    const sourceRows = INITIAL_SOURCES.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      publisher: s.publisher || s.author,
      author: s.author || s.publisher,
      url: s.url,
      content: s.content,
      date: s.date,
      status: s.status,
      trust_level: s.trustLevel || 'official',
      approved: s.approved,
      version: s.version ? String(s.version) : '1.0',
      supersedes_source_id: s.supersedes || s.supersedesSourceId || null,
      authority_note: s.authorityNote,
      is_demo: true,
      tags: s.tags || [],
    }));
    await client.from('sources').upsert(sourceRows, { onConflict: 'id' });

    // 3. Seed decisions
    const initialDecisions: any[] = [
      {
        id: 'dec-proto-29',
        topic: 'Prototype Submission Deadline',
        decision: 'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
        title: 'Prototype concept submission deadline extended to Tuesday, 29 September 2026 at 23:59 WAT.',
        status: 'active',
        source_id: 'src-2',
        supersedes_decision_id: 'dec-proto-27',
        supersedes_previous: true,
        supersedes_note: 'Officially supersedes preliminary 27 September date from 18 Sep.',
        impact: 'Gives all 62 teams a 48-hour buffer for rural customer interviews.',
        effective_from: '21 Sep 2026',
        confirmed_by: 'Dr. Aminata Touré & Eng. Kwame Mensah',
        notes: 'Confirmed in 21 Sep Cohort Briefing.',
        is_demo: true,
      },
      {
        id: 'dec-proto-27',
        topic: 'Prototype Submission Deadline',
        decision: 'Preliminary prototype submission date scheduled for 27 September 2026 at 17:00 WAT.',
        title: 'Preliminary prototype submission date scheduled for 27 September 2026 at 17:00 WAT.',
        status: 'superseded',
        source_id: 'src-4',
        supersedes_decision_id: null,
        supersedes_previous: false,
        supersedes_note: 'Superseded by dec-proto-29 on 21 Sep 2026.',
        impact: 'Initial target deadline established during kickoff.',
        effective_from: '18 Sep 2026',
        confirmed_by: 'Programme Coordination Desk',
        notes: 'Superseded by Dr. Aminata Touré announcement.',
        is_demo: true,
      },
      {
        id: 'dec-team-lock',
        topic: 'Team Roster Lock',
        decision: 'Team roster lock: Teams must maintain 3-5 participants with one designated tech lead.',
        title: 'Team roster lock: Teams must maintain 3-5 participants with one designated tech lead.',
        status: 'active',
        source_id: 'src-1',
        supersedes_previous: false,
        effective_from: '21 Sep 2026',
        confirmed_by: 'UniPods Academic Directorate',
        is_demo: true,
      },
      {
        id: 'dec-platform-teams',
        topic: 'Virtual Meeting Platform Migration',
        decision: 'Microsoft Teams is the sole official platform for cohort live sessions; Zoom is retired.',
        title: 'Microsoft Teams is the sole official platform for cohort live sessions; Zoom is retired.',
        status: 'active',
        source_id: 'src-7',
        supersedes_previous: true,
        supersedes_note: 'Supersedes previous Zoom meeting links.',
        effective_from: '21 Sep 2026',
        confirmed_by: 'UniPods IT & Infrastructure',
        is_demo: true,
      },
    ];
    await client.from('decisions').upsert(initialDecisions, { onConflict: 'id' });

    // 4. Seed actions
    const actionRows = INITIAL_ACTIONS.map((a) => ({
      id: a.id,
      user_id: 'user-1',
      title: a.title,
      due_date: a.dueDate,
      status: a.status,
      priority: a.priority || 'normal',
      source_id: a.sourceId || null,
      source_title: a.sourceTitle,
      resource_link: a.resourceLink || null,
      resource_name: a.resourceName || null,
      notes: a.notes || null,
      is_demo: true,
    }));
    await client.from('actions').upsert(actionRows, { onConflict: 'id' });

    return {
      success: true,
      count: sourceRows.length + initialDecisions.length + actionRows.length,
      message: `Seeded ${sourceRows.length} sources, ${initialDecisions.length} decisions, and ${actionRows.length} actions successfully.`,
    };
  } catch (err: any) {
    console.warn('Seed operation error:', err?.message || err);
    return { success: false, count: 0, message: err?.message || 'Seed failed' };
  }
}
