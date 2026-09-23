-- ==============================================================================
-- ASK UNIBOT: WhatsApp Identity & Webhook Messages Schema (Phase 4.1 + 4.2)
-- METI UniPods AI Innovation Programme 2026
-- Secure WhatsApp user mapping, phone normalization, and message deduplication
-- ==============================================================================

-- 1. WHATSAPP IDENTITIES TABLE
-- Maps canonical E.164 phone numbers to verified public.users accounts
CREATE TABLE IF NOT EXISTS public.whatsapp_identities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  phone_number_normalized TEXT NOT NULL UNIQUE,
  wa_user_id TEXT,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'BLOCKED')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_identities_normalized ON public.whatsapp_identities(phone_number_normalized);
CREATE INDEX IF NOT EXISTS idx_wa_identities_user_id ON public.whatsapp_identities(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_identities_wa_user_id ON public.whatsapp_identities(wa_user_id);

-- 2. WHATSAPP MESSAGES TABLE (Event Deduplication & Audit Log)
-- Strictly stores operational event metadata; deduplicates on message_id
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  phone_number_normalized TEXT NOT NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'unknown',
  message_body TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_message_id ON public.whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_phone_normalized ON public.whatsapp_messages(phone_number_normalized);
CREATE INDEX IF NOT EXISTS idx_wa_messages_user_id ON public.whatsapp_messages(user_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.whatsapp_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- whatsapp_identities policies
DROP POLICY IF EXISTS "Service role can manage whatsapp identities" ON public.whatsapp_identities;
CREATE POLICY "Service role can manage whatsapp identities"
  ON public.whatsapp_identities FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can view own whatsapp identity" ON public.whatsapp_identities;
CREATE POLICY "Users can view own whatsapp identity"
  ON public.whatsapp_identities FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    user_id = auth.uid()::text OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can manage whatsapp identities" ON public.whatsapp_identities;
CREATE POLICY "Admins can manage whatsapp identities"
  ON public.whatsapp_identities FOR ALL
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- whatsapp_messages policies
DROP POLICY IF EXISTS "Service role can manage whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Service role can manage whatsapp messages"
  ON public.whatsapp_messages FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view whatsapp messages" ON public.whatsapp_messages;
CREATE POLICY "Admins can view whatsapp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    public.is_admin()
  );

-- 4. GRANT PRIVILEGES
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_identities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO service_role;
GRANT SELECT ON public.whatsapp_identities TO authenticated;

-- 5. INITIAL SEED FOR DEMO PARTICIPANTS
-- Awa Diop (+221 77 123 45 67)
INSERT INTO public.whatsapp_identities (
  id,
  user_id,
  phone_number,
  phone_number_normalized,
  wa_user_id,
  display_name,
  status,
  verified_at
) VALUES (
  'wa-id-awa-diop',
  '00000000-0000-4000-a000-000000000001',
  '+221 77 123 45 67',
  '+221771234567',
  '221771234567',
  'Awa Diop (SunuAgri AI)',
  'VERIFIED',
  NOW()
) ON CONFLICT (phone_number_normalized) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Dr. Aminata Touré (+221 77 000 00 01)
INSERT INTO public.whatsapp_identities (
  id,
  user_id,
  phone_number,
  phone_number_normalized,
  wa_user_id,
  display_name,
  status,
  verified_at
) VALUES (
  'wa-id-aminata-toure',
  '00000000-0000-4000-a000-000000000002',
  '+221 77 000 00 01',
  '+221770000001',
  '221770000001',
  'Dr. Aminata Touré (Lead Facilitator)',
  'VERIFIED',
  NOW()
) ON CONFLICT (phone_number_normalized) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  status = EXCLUDED.status,
  updated_at = NOW();
