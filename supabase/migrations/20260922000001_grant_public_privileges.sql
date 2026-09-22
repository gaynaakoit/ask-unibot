-- ==============================================================================
-- ASK UNIBOT: Least Privilege Security & Table Grants (Phase 3.1.2 Audit Fix)
-- Fixes PostgreSQL Error 42501 (permission denied) & Error 42P17 (infinite recursion)
-- Strictly preserves separation between anon, authenticated, and service_role.
-- ==============================================================================

-- 1. Helper function: check if caller is an admin without triggering RLS recursion
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

-- 2. Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 3. SERVICE_ROLE: Full administrative permissions for backend Express operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 4. KNOWLEDGE BASE (sources, knowledge_chunks, decisions, meetings, meeting_decisions)
-- Read-only access for participants and public visitors
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT SELECT ON public.knowledge_chunks TO anon, authenticated;
GRANT SELECT ON public.decisions TO anon, authenticated;
GRANT SELECT ON public.meetings TO anon, authenticated;
GRANT SELECT ON public.meeting_decisions TO anon, authenticated;

-- 5. PARTICIPANT INTERACTION (questions, question_sources, handover_tickets)
-- Participants can submit questions and conflict handover tickets, and view responses
GRANT SELECT, INSERT ON public.questions TO anon, authenticated;
GRANT SELECT, INSERT ON public.question_sources TO anon, authenticated;
GRANT SELECT, INSERT ON public.handover_tickets TO anon, authenticated;

-- Sequences for auto-incrementing keys (e.g. question_sources id)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. PARTICIPANT ACTIONS & TASKS
-- Authenticated participants manage their tasks; anon has read-only access for demo tasks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actions TO authenticated;
GRANT SELECT ON public.actions TO anon;

-- 7. USERS & PROFILES
-- Reading public profile info; authenticated users can update their own profile details
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE (name, avatar_url, track, updated_at) ON public.users TO authenticated;

-- 8. NOTIFICATIONS
-- Reading notifications; authenticated users can mark their notifications as read
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;

-- 9. ROUTINES (Functions)
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 10. Default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
