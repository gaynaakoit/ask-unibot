-- ==============================================================================
-- ASK UNIBOT: Add WhatsApp Channel Metadata (Phase 4.3)
-- METI UniPods AI Innovation Programme 2026
-- Adds channel provenance ('WEB' | 'WHATSAPP') and Meta message_id linking
-- ==============================================================================

-- 1. ADD CHANNEL AND MESSAGE_ID TO QUESTIONS
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'WEB';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_questions_channel ON public.questions(channel);
CREATE INDEX IF NOT EXISTS idx_questions_message_id ON public.questions(message_id);

-- 2. ADD CHANNEL AND MESSAGE_ID TO HANDOVER TICKETS
ALTER TABLE public.handover_tickets ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'WEB';
ALTER TABLE public.handover_tickets ADD COLUMN IF NOT EXISTS message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_handover_tickets_channel ON public.handover_tickets(channel);
CREATE INDEX IF NOT EXISTS idx_handover_tickets_message_id ON public.handover_tickets(message_id);
