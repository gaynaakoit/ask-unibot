-- ==============================================================================
-- ASK UNIBOT: Multilingual Support Schema (Phase 6.2)
-- METI UniPods AI Innovation Programme 2026
-- Adds preferred_language to public.users and completes group memory governance columns
-- ==============================================================================

-- 1. ADD preferred_language TO public.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
      CHECK (preferred_language IN ('en', 'fr', 'pt', 'ar'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON public.users(preferred_language);

-- 2. ADD preferred_language TO public.whatsapp_groups (optional default for group contexts)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'whatsapp_groups'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'whatsapp_groups'
        AND column_name = 'preferred_language'
    ) THEN
      ALTER TABLE public.whatsapp_groups
        ADD COLUMN preferred_language VARCHAR(10) NOT NULL DEFAULT 'en'
        CHECK (preferred_language IN ('en', 'fr', 'pt', 'ar'));
    END IF;
  END IF;
END $$;

-- 3. ENSURE rejection_reason & superseded_by IN public.group_memories
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'group_memories'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'group_memories'
        AND column_name = 'rejection_reason'
    ) THEN
      ALTER TABLE public.group_memories ADD COLUMN rejection_reason TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'group_memories'
        AND column_name = 'superseded_by'
    ) THEN
      ALTER TABLE public.group_memories ADD COLUMN superseded_by TEXT;
    END IF;
  END IF;
END $$;
