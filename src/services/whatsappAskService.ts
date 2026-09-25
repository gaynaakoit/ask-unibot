/**
 * WhatsApp Ask Adapter Service (Phase 4.3)
 * METI UniPods AI Innovation Programme 2026
 *
 * Responsibilities:
 * WhatsApp message
 *       ↓
 * resolved Supabase user
 *       ↓
 * existing Ask UniBot Core
 *       ↓
 * structured response
 *
 * NOTE: As per Phase 4.3 guidelines, this is strictly an adapter.
 * It contains zero custom RAG logic and delegates directly to executeAskUniBotCore.
 */

import { AiResponse } from '../types.js';
import { executeAskUniBotCore } from './askUniBotCore.js';
import { SupportedLanguage } from '../i18n/index.js';

export interface ProcessWhatsAppQuestionParams {
  userId: string;
  participantName: string;
  phoneNumber: string;
  messageId: string;
  text: string;
  groupId?: string;
  targetLanguage?: SupportedLanguage;
}

export class WhatsAppAskService {
  /**
   * Adapts and routes an authenticated WhatsApp user query into the unified Ask UniBot engine.
   */
  public async processWhatsAppQuestion(params: ProcessWhatsAppQuestionParams): Promise<AiResponse> {
    const { userId, participantName, messageId, text, groupId, targetLanguage } = params;

    return executeAskUniBotCore({
      query: text,
      userId,
      participantName,
      channel: 'WHATSAPP',
      messageId,
      groupId,
      targetLanguage,
    });
  }
}

export const whatsappAskService = new WhatsAppAskService();
