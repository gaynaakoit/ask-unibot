-- ==============================================================================
-- ASK UNIBOT: WhatsApp Groups Management via Meta Groups API (Phase 6.1)
-- METI UniPods AI Innovation Programme 2026
--
-- Additive Schema Updates:
-- 1. Extend public.whatsapp_groups with Phase 6 columns
-- 2. Create public.whatsapp_group_join_requests
-- 3. Create public.whatsapp_group_invitations
-- 4. Set RLS policies and indices
-- ==============================================================================

-- 1. Extend whatsapp_groups
DO $$
BEGIN
  -- Add external_group_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'external_group_id'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN external_group_id TEXT;
  END IF;

  -- Add subject
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN subject TEXT;
  END IF;

  -- Add description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN description TEXT;
  END IF;

  -- Add invite_link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'invite_link'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN invite_link TEXT;
  END IF;

  -- Add join_approval_mode
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'join_approval_mode'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN join_approval_mode TEXT DEFAULT 'approval_required';
  END IF;

  -- Add created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.whatsapp_groups ADD COLUMN created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Drop old status check if needed and add updated check accepting Phase 6 statuses
ALTER TABLE public.whatsapp_groups DROP CONSTRAINT IF EXISTS whatsapp_groups_status_check;
ALTER TABLE public.whatsapp_groups ADD CONSTRAINT whatsapp_groups_status_check 
  CHECK (status IN ('DISCOVERED', 'PENDING_APPROVAL', 'ACTIVE', 'BLOCKED', 'INACTIVE'));

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_external_id ON public.whatsapp_groups(external_group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_created_by ON public.whatsapp_groups(created_by);

-- 2. WhatsApp Group Join Requests
CREATE TABLE IF NOT EXISTS public.whatsapp_group_join_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  external_request_id TEXT,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  phone_number TEXT NOT NULL,
  phone_number_normalized TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_join_requests_group_id ON public.whatsapp_group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.whatsapp_group_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_phone ON public.whatsapp_group_join_requests(phone_number_normalized);

-- 3. WhatsApp Group Invitations Log
CREATE TABLE IF NOT EXISTS public.whatsapp_group_invitations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  template_name TEXT,
  status TEXT NOT NULL DEFAULT 'SENT',
  message_id TEXT,
  created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_group_id ON public.whatsapp_group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_invitations_recipient ON public.whatsapp_group_invitations(recipient);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.whatsapp_group_invitations(status);

-- 4. RLS POLICIES
ALTER TABLE public.whatsapp_group_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_invitations ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on whatsapp_group_join_requests"
  ON public.whatsapp_group_join_requests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on whatsapp_group_invitations"
  ON public.whatsapp_group_invitations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins full access
CREATE POLICY "Admins can manage whatsapp_group_join_requests"
  ON public.whatsapp_group_join_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage whatsapp_group_invitations"
  ON public.whatsapp_group_invitations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can view their own join requests
CREATE POLICY "Users can view own join requests"
  ON public.whatsapp_group_join_requests FOR SELECT
  USING (user_id = auth.uid()::text);

-- Grant privileges to authenticated, anon and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_group_join_requests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_group_invitations TO authenticated, service_role;
GRANT SELECT ON public.whatsapp_group_join_requests TO anon;
GRANT SELECT ON public.whatsapp_group_invitations TO anon;
