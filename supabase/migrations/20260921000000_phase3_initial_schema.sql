-- ==============================================================================
-- ASK UNIBOT: Supabase Database Architecture (Phase 3.1)
-- METI UniPods AI Innovation Programme 2026
-- Normalized PostgreSQL Schema with RLS, pgvector preparation, and Foreign Keys
-- ==============================================================================

-- 1. Enable pgvector extension (graceful fallback if not available on standard PG)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not installed; proceeding with standard columns';
END $$;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('participant', 'admin')),
  track TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SOURCES TABLE
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  publisher TEXT,
  author TEXT,
  url TEXT,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  date TEXT NOT NULL,
  effective_from TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'superseded', 'pending_review', 'expiring_soon')),
  trust_level TEXT NOT NULL DEFAULT 'official' CHECK (trust_level IN ('official', 'verified', 'organiser_confirmed', 'pending')),
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  version TEXT DEFAULT '1.0',
  supersedes_source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  authority_note TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);
CREATE INDEX IF NOT EXISTS idx_sources_approved ON sources(approved);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(type);

-- 4. KNOWLEDGE CHUNKS TABLE (RAG Chunk Storage)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  title TEXT NOT NULL,
  section TEXT,
  tags TEXT[] DEFAULT '{}',
  published_at TEXT,
  effective_from TEXT,
  expires_at TEXT,
  trust_level TEXT DEFAULT 'official',
  approved BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding float8[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source_id ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_approved ON knowledge_chunks(approved);

-- 5. DECISIONS TABLE (Official Programme Agreements & Policies)
CREATE TABLE IF NOT EXISTS decisions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  decision TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'pending_confirmation')),
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  supersedes_decision_id TEXT REFERENCES decisions(id) ON DELETE SET NULL,
  supersedes_previous BOOLEAN DEFAULT FALSE,
  supersedes_note TEXT,
  impact TEXT,
  effective_from TEXT,
  confirmed_by TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_topic ON decisions(topic);
CREATE INDEX IF NOT EXISTS idx_decisions_source_id ON decisions(source_id);

-- 6. MEETINGS TABLE
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_date TEXT NOT NULL,
  time_wat TEXT,
  status TEXT DEFAULT 'completed',
  summary TEXT NOT NULL,
  what_was_discussed JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  next_session TEXT,
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  source_title TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MEETING DECISIONS (Junction Table)
CREATE TABLE IF NOT EXISTS meeting_decisions (
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision_id TEXT NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (meeting_id, decision_id)
);

-- 8. ACTIONS TABLE (Participant & Milestone Tasks)
CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'optional')),
  source_id TEXT REFERENCES sources(id) ON DELETE SET NULL,
  source_title TEXT,
  resource_link TEXT,
  resource_name TEXT,
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_user_id ON actions(user_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_source_id ON actions(source_id);

-- 9. QUESTIONS TABLE (Participant Query & Q&A Memory)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  participant_name TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('CONFIRMED', 'NEEDS_ADMIN_CONFIRMATION', 'NOT_FOUND')),
  needs_human BOOLEAN NOT NULL DEFAULT FALSE,
  next_step TEXT,
  grounding_method TEXT NOT NULL,
  conflict_detected BOOLEAN DEFAULT FALSE,
  conflict_resolved BOOLEAN DEFAULT FALSE,
  conflict_topic TEXT,
  freshness_status TEXT,
  explanation_simple TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_confidence ON questions(confidence);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);

-- 10. QUESTION SOURCES (Evidence Linking Table)
CREATE TABLE IF NOT EXISTS question_sources (
  id BIGSERIAL PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  evidence TEXT,
  relevance FLOAT8 DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_sources_question_id ON question_sources(question_id);
CREATE INDEX IF NOT EXISTS idx_question_sources_source_id ON question_sources(source_id);

-- 11. HANDOVER TICKETS TABLE (Human Admin Escalations)
CREATE TABLE IF NOT EXISTS handover_tickets (
  id TEXT PRIMARY KEY,
  question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
  participant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  participant_context TEXT,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'confirmed', 'corrected', 'superseded', 'resolved')),
  conflict_summary TEXT,
  detected_conflict TEXT,
  conflict_or_missing TEXT,
  evidence JSONB,
  sources_checked TEXT[] DEFAULT '{}',
  recommended_admin TEXT DEFAULT 'Dr. Aminata Touré (Lead Facilitator)',
  assigned_to TEXT,
  admin_response TEXT,
  resolution_note TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_handover_tickets_status ON handover_tickets(status);
CREATE INDEX IF NOT EXISTS idx_handover_tickets_created_at ON handover_tickets(created_at DESC);

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if caller is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
      AND role = 'admin'
  );
$$;

-- 1. SOURCES RLS: Public/Participants can read approved sources; Admins can manage all
CREATE POLICY "Public and participants can read approved sources"
  ON sources FOR SELECT
  USING (approved = TRUE);

CREATE POLICY "Admins can manage sources"
  ON sources FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 2. KNOWLEDGE CHUNKS RLS: Public/Participants can read approved chunks
CREATE POLICY "Public and participants can read approved chunks"
  ON knowledge_chunks FOR SELECT
  USING (approved = TRUE);

CREATE POLICY "Admins can manage knowledge chunks"
  ON knowledge_chunks FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 3. DECISIONS RLS: Public and participants can read all decisions
CREATE POLICY "Public and participants can read decisions"
  ON decisions FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage decisions"
  ON decisions FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 4. MEETINGS RLS: Public and participants can read meetings
CREATE POLICY "Public and participants can read meetings"
  ON meetings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage meetings"
  ON meetings FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

CREATE POLICY "Public and participants can read meeting decisions"
  ON meeting_decisions FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage meeting decisions"
  ON meeting_decisions FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 5. ACTIONS RLS: Users can read and update their own actions
CREATE POLICY "Users can manage own actions"
  ON actions FOR ALL
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text OR
    user_id IS NULL OR
    is_demo = TRUE
  );

-- 6. QUESTIONS RLS: Users can read own questions, admins can view all
CREATE POLICY "Users can read own questions"
  ON questions FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text OR
    user_id IS NULL
  );

CREATE POLICY "Anyone can insert questions"
  ON questions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Question sources readable with question"
  ON question_sources FOR SELECT
  USING (TRUE);

CREATE POLICY "Question sources insertable"
  ON question_sources FOR INSERT
  WITH CHECK (TRUE);

-- 7. HANDOVER TICKETS RLS: Participants can view tickets they opened; Admins can view and resolve all
CREATE POLICY "Users can view own handover tickets"
  ON handover_tickets FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    participant_id = auth.uid()::text OR
    is_demo = TRUE OR
    public.is_admin()
  );

CREATE POLICY "Anyone can create handover tickets"
  ON handover_tickets FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can update handover tickets"
  ON handover_tickets FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 8. USERS RLS: Users can read own profile; Admins can manage users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    id = auth.uid()::text OR
    public.is_admin()
  );

-- 9. NOTIFICATIONS RLS: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text
  );

-- ==============================================================================
-- SCHEMA & TABLE PERMISSIONS (Least Privilege Architecture)
-- ==============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- SERVICE_ROLE: Backend Express server full administrative operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- KNOWLEDGE BASE: Read-only access for participants and public visitors
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT SELECT ON public.knowledge_chunks TO anon, authenticated;
GRANT SELECT ON public.decisions TO anon, authenticated;
GRANT SELECT ON public.meetings TO anon, authenticated;
GRANT SELECT ON public.meeting_decisions TO anon, authenticated;

-- PARTICIPANT INTERACTION: Questions & Handover Tickets
GRANT SELECT, INSERT ON public.questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.question_sources TO anon, authenticated;
GRANT SELECT, INSERT ON public.handover_tickets TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- PARTICIPANT ACTIONS: Authenticated users manage own actions; anon reads demo tasks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actions TO authenticated;
GRANT SELECT ON public.actions TO anon;

-- PROFILES & USERS
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE (name, avatar_url, track, updated_at) ON public.users TO authenticated;

-- NOTIFICATIONS
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;

-- ROUTINES (Functions)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- DEFAULT PRIVILEGES
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
