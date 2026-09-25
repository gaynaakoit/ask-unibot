-- ==============================================================================
-- ASK UNIBOT: WhatsApp Group Memory & Approval Workflow (Phase 5)
-- METI UniPods AI Innovation Programme 2026
--
-- Tables:
-- 1. public.whatsapp_groups
-- 2. public.whatsapp_group_members
-- 3. public.whatsapp_group_messages
-- 4. public.group_memories
--
-- Features:
-- - RLS isolation without recursive loops (utilizes public.is_admin())
-- - Multi-role membership (MEMBER, ADMIN, FACILITATOR, ORGANIZER)
-- - Raw message audit logging with processing_status
-- - Memory extraction with approval status (PENDING, APPROVED, REJECTED, SUPERSEDED)
-- - Explicit demo seeds with is_demo flag
-- ==============================================================================

-- 1. WHATSAPP GROUPS
CREATE TABLE IF NOT EXISTS public.whatsapp_groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  whatsapp_group_id TEXT UNIQUE NOT NULL,
  name TEXT,
  programme_id TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_group_id ON public.whatsapp_groups(whatsapp_group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_status ON public.whatsapp_groups(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_approved ON public.whatsapp_groups(is_approved);

-- 2. WHATSAPP GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.whatsapp_group_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN', 'FACILITATOR', 'ORGANIZER')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'LEFT')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.whatsapp_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.whatsapp_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.whatsapp_group_members(status);

-- 3. RAW WHATSAPP GROUP MESSAGES
CREATE TABLE IF NOT EXISTS public.whatsapp_group_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  whatsapp_message_id TEXT UNIQUE NOT NULL,
  group_id TEXT NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  sender_phone_normalized TEXT,
  message_text TEXT,
  message_type TEXT NOT NULL CHECK (message_type IN ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'STICKER', 'UNKNOWN')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  raw_metadata JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_whatsapp_id ON public.whatsapp_group_messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.whatsapp_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_user_id ON public.whatsapp_group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_status ON public.whatsapp_group_messages(processing_status);

-- 4. EXTRACTED GROUP MEMORIES
CREATE TABLE IF NOT EXISTS public.group_memories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  group_id TEXT NOT NULL REFERENCES public.whatsapp_groups(id) ON DELETE CASCADE,
  source_message_id TEXT REFERENCES public.whatsapp_group_messages(id) ON DELETE SET NULL,
  created_by_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('ANNOUNCEMENT', 'DECISION', 'DEADLINE', 'EVENT', 'ACTION', 'QUESTION', 'RESOURCE', 'CLARIFICATION')),
  title TEXT,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  confidence TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED')),
  approved_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_memories_group_id ON public.group_memories(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memories_status ON public.group_memories(approval_status);
CREATE INDEX IF NOT EXISTS idx_group_memories_type ON public.group_memories(memory_type);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memories ENABLE ROW LEVEL SECURITY;

-- Helpers: Allow service_role full unrestricted access
CREATE POLICY "Service role full access on whatsapp_groups"
  ON public.whatsapp_groups FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on whatsapp_group_members"
  ON public.whatsapp_group_members FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on whatsapp_group_messages"
  ON public.whatsapp_group_messages FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on group_memories"
  ON public.group_memories FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Members can view their authorized groups; admins can view/manage all groups
CREATE POLICY "Users can view groups they belong to"
  ON public.whatsapp_groups FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.whatsapp_group_members m
      WHERE m.group_id = whatsapp_groups.id
        AND m.user_id = auth.uid()::text
        AND m.status = 'ACTIVE'
    )
  );

CREATE POLICY "Admins can manage whatsapp_groups"
  ON public.whatsapp_groups FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Group Members visibility
CREATE POLICY "Users can view members of their groups"
  ON public.whatsapp_group_members FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.whatsapp_group_members m
      WHERE m.group_id = whatsapp_group_members.group_id
        AND m.user_id = auth.uid()::text
        AND m.status = 'ACTIVE'
    )
  );

CREATE POLICY "Admins can manage group members"
  ON public.whatsapp_group_members FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Group Messages visibility
CREATE POLICY "Users can view messages of their groups"
  ON public.whatsapp_group_messages FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.whatsapp_group_members m
      WHERE m.group_id = whatsapp_group_messages.group_id
        AND m.user_id = auth.uid()::text
        AND m.status = 'ACTIVE'
    )
  );

-- Group Memories visibility: members can view memories of their groups
CREATE POLICY "Users can view memories of their groups"
  ON public.group_memories FOR SELECT
  USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.whatsapp_group_members m
      WHERE m.group_id = group_memories.group_id
        AND m.user_id = auth.uid()::text
        AND m.status = 'ACTIVE'
    )
  );

-- Group Memories approval & modifications: strictly reserved for Admins
CREATE POLICY "Admins can manage and approve group memories"
  ON public.group_memories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. DEMO SEED DATA (Explicitly marked with is_demo = true)
-- ==============================================================================

INSERT INTO public.whatsapp_groups (
  id,
  whatsapp_group_id,
  name,
  programme_id,
  status,
  is_approved,
  is_demo
) VALUES (
  'grp-unipods-2026-demo',
  '12036302212026-group',
  'UniPods AI Innovation Programme 2026',
  'unipods-ai-cohort-2026',
  'ACTIVE',
  true,
  true
) ON CONFLICT (whatsapp_group_id) DO UPDATE SET
  name = EXCLUDED.name,
  is_approved = EXCLUDED.is_approved;

-- Add demo group members (Awa Diop, Dr. Aminata Touré, User B)
INSERT INTO public.whatsapp_group_members (
  id, group_id, user_id, role, status
) VALUES
  ('gmem-awa-diop', 'grp-unipods-2026-demo', '00000000-0000-4000-a000-000000000001', 'MEMBER', 'ACTIVE'),
  ('gmem-aminata-toure', 'grp-unipods-2026-demo', '00000000-0000-4000-a000-000000000002', 'FACILITATOR', 'ACTIVE'),
  ('gmem-user-b', 'grp-unipods-2026-demo', '00000000-0000-4000-a000-000000000003', 'MEMBER', 'ACTIVE')
ON CONFLICT (group_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- Insert representative realistic group messages
INSERT INTO public.whatsapp_group_messages (
  id, whatsapp_message_id, group_id, user_id, sender_phone_normalized, message_text, message_type, processing_status
) VALUES
  (
    'gmsg-announcement-1',
    'wamid.HBgL_grp_ann_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000002',
    '+221770000001',
    'Rappel officiel : La prochaine session interactive sur l’éthique et l’IA se tiendra ce jeudi à 15h00 GMT sur MS Teams.',
    'TEXT',
    'PROCESSED'
  ),
  (
    'gmsg-deadline-1',
    'wamid.HBgL_grp_dl_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000002',
    '+221770000001',
    'Confirmation : La date limite officielle de soumission pour le Milestone 2 est fixée au 30 septembre à 23h59.',
    'TEXT',
    'PROCESSED'
  ),
  (
    'gmsg-decision-1',
    'wamid.HBgL_grp_dec_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000002',
    '+221770000001',
    'Décision validée par le comité : Chaque équipe doit désigner un responsable technique principal pour l’évaluation par les pairs.',
    'TEXT',
    'PROCESSED'
  ),
  (
    'gmsg-question-1',
    'wamid.HBgL_grp_q_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000001',
    '+221771234567',
    '@Ask UniBot Est-ce que la session d’IA de jeudi est obligatoire pour toutes les équipes ?',
    'TEXT',
    'PROCESSED'
  ),
  (
    'gmsg-chat-1',
    'wamid.HBgL_grp_chat_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000003',
    '+221700000002',
    'Super, merci beaucoup pour les informations et bonne journée à tous !',
    'TEXT',
    'IGNORED'
  ),
  (
    'gmsg-conflicting-1',
    'wamid.HBgL_grp_conflict_01',
    'grp-unipods-2026-demo',
    '00000000-0000-4000-a000-000000000003',
    '+221700000002',
    'Quelqu’un m’a dit que la date limite du Milestone 2 était avancée au 27 septembre ? Est-ce exact ?',
    'TEXT',
    'PROCESSED'
  )
ON CONFLICT (whatsapp_message_id) DO NOTHING;

-- Insert corresponding group memories with explicit approval statuses
INSERT INTO public.group_memories (
  id,
  group_id,
  source_message_id,
  created_by_user_id,
  memory_type,
  title,
  content,
  confidence,
  approval_status,
  approved_by,
  approved_at,
  is_demo
) VALUES
  (
    'gmem-item-ann-1',
    'grp-unipods-2026-demo',
    'gmsg-announcement-1',
    '00000000-0000-4000-a000-000000000002',
    'ANNOUNCEMENT',
    'Session interactive éthique & IA jeudi 15h00',
    'La prochaine session interactive sur l’éthique et l’IA se tiendra ce jeudi à 15h00 GMT sur MS Teams.',
    'HIGH',
    'APPROVED',
    '00000000-0000-4000-a000-000000000002',
    NOW(),
    true
  ),
  (
    'gmem-item-dl-1',
    'grp-unipods-2026-demo',
    'gmsg-deadline-1',
    '00000000-0000-4000-a000-000000000002',
    'DEADLINE',
    'Soumission Milestone 2 fixée au 30 septembre',
    'La date limite officielle de soumission pour le Milestone 2 est fixée au 30 septembre à 23h59 GMT.',
    'HIGH',
    'APPROVED',
    '00000000-0000-4000-a000-000000000002',
    NOW(),
    true
  ),
  (
    'gmem-item-dec-1',
    'grp-unipods-2026-demo',
    'gmsg-decision-1',
    '00000000-0000-4000-a000-000000000002',
    'DECISION',
    'Désignation d’un responsable technique par équipe',
    'Chaque équipe participante doit désigner un responsable technique principal pour l’évaluation par les pairs.',
    'HIGH',
    'APPROVED',
    '00000000-0000-4000-a000-000000000002',
    NOW(),
    true
  ),
  (
    'gmem-item-conflict-1',
    'grp-unipods-2026-demo',
    'gmsg-conflicting-1',
    '00000000-0000-4000-a000-000000000003',
    'DEADLINE',
    'Rumeur avancement date limite au 27 septembre',
    'Information contradictoire non confirmée : avance supposée de la soumission au 27 septembre.',
    'LOW',
    'PENDING',
    NULL,
    NULL,
    true
  )
ON CONFLICT (id) DO NOTHING;
