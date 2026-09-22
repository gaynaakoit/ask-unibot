-- ==============================================================================
-- ASK UNIBOT: Fix RLS Infinite Recursion (Error 42P17)
-- Replaces recursive "EXISTS (SELECT 1 FROM users ...)" checks with public.is_admin()
-- ==============================================================================

-- 1. Helper function: check if caller is admin without triggering RLS recursion
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2. Drop and recreate policies with public.is_admin()

DROP POLICY IF EXISTS "Admins can manage sources" ON public.sources;
CREATE POLICY "Admins can manage sources"
  ON public.sources FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Admins can manage knowledge chunks"
  ON public.knowledge_chunks FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage decisions" ON public.decisions;
CREATE POLICY "Admins can manage decisions"
  ON public.decisions FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage meetings" ON public.meetings;
CREATE POLICY "Admins can manage meetings"
  ON public.meetings FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage meeting decisions" ON public.meeting_decisions;
CREATE POLICY "Admins can manage meeting decisions"
  ON public.meeting_decisions FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can view own handover tickets" ON public.handover_tickets;
CREATE POLICY "Users can view own handover tickets"
  ON public.handover_tickets FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    participant_id = auth.uid()::text OR
    is_demo = TRUE OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can update handover tickets" ON public.handover_tickets;
CREATE POLICY "Admins can update handover tickets"
  ON public.handover_tickets FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    id = auth.uid()::text OR
    public.is_admin()
  );
