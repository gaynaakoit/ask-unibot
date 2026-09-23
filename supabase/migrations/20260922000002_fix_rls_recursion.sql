-- ==============================================================================
-- ASK UNIBOT: Fix RLS Infinite Recursion (Error 42P17) & Permissions Hardening
-- Decouples users table RLS from recursive checks and establishes clean is_admin()
-- ==============================================================================

-- 1. Helper function: check if caller is admin without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Service role is always authorized
  IF auth.role() = 'service_role' THEN
    RETURN TRUE;
  END IF;

  -- Check JWT metadata first (zero DB queries)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR 
     (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Direct check on public.users by auth.uid()
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
      AND role = 'admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 2. Clean, Non-recursive policy for public.users
-- By checking id = auth.uid() directly, it never recurses.
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    id = auth.uid()::text OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    id = auth.uid()::text
  );

-- 3. Sources policies
DROP POLICY IF EXISTS "Admins can manage sources" ON public.sources;
CREATE POLICY "Admins can manage sources"
  ON public.sources FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 4. Knowledge chunks policies
DROP POLICY IF EXISTS "Admins can manage knowledge chunks" ON public.knowledge_chunks;
CREATE POLICY "Admins can manage knowledge chunks"
  ON public.knowledge_chunks FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 5. Decisions & meetings policies
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

-- 6. Handover tickets policies (Zero recursion, safe for participants and admins)
DROP POLICY IF EXISTS "Users can view own handover tickets" ON public.handover_tickets;
CREATE POLICY "Users can view own handover tickets"
  ON public.handover_tickets FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    participant_id = auth.uid()::text OR
    is_demo = TRUE OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can create handover tickets" ON public.handover_tickets;
CREATE POLICY "Users can create handover tickets"
  ON public.handover_tickets FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    participant_id = auth.uid()::text OR
    participant_id IS NULL OR
    is_demo = TRUE
  );

DROP POLICY IF EXISTS "Admins can update handover tickets" ON public.handover_tickets;
CREATE POLICY "Admins can update handover tickets"
  ON public.handover_tickets FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 7. Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text OR
    user_id = 'all' OR
    is_demo = TRUE
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text OR
    is_demo = TRUE
  );
