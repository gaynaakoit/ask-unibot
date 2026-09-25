/**
 * WhatsApp Response Formatter Service (Phase 4.3)
 * METI UniPods AI Innovation Programme 2026
 *
 * Formats structured Ask UniBot core responses into clean, concise,
 * evidence-grounded messages optimized for WhatsApp mobile reading.
 *
 * Rules:
 * 1. Clean presentation without raw JSON, database IDs, UUIDs, or internal service names.
 * 2. Evidence-First: includes source name when CONFIRMED.
 * 3. Never presents unverified info as official; handles NEEDS_ADMIN_CONFIRMATION clearly.
 * 4. Zero hallucination for NOT_FOUND.
 * 5. Provides controlled messages for UNKNOWN_USER and BLOCKED_USER.
 */

import { AiResponse } from '../types';
import { translate, SupportedLanguage } from '../i18n/index.js';

export class WhatsAppResponseService {
  /**
   * Formats a structured AiResponse into a mobile-friendly WhatsApp message.
   */
  public formatWhatsAppResponse(response: AiResponse, lang: SupportedLanguage = 'en'): string {
    const parts: string[] = [];

    // 1. Answer text based on confidence
    if (response.confidence === 'CONFIRMED') {
      parts.push(response.answer.trim());

      // Evidence / Source citation
      if (Array.isArray(response.sources) && response.sources.length > 0) {
        const topSource = response.sources[0];
        const sourceTitle = topSource.title || 'Official UniPods update';
        parts.push(`${translate('whatsapp.sourceLabel', lang)}\n${sourceTitle}`);
      } else if (Array.isArray(response.evidenceItems) && response.evidenceItems.length > 0) {
        const topEv = response.evidenceItems[0];
        const evTitle = topEv.title || 'Official UniPods update';
        parts.push(`${translate('whatsapp.sourceLabel', lang)}\n${evTitle}`);
      }

      // Next step
      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`${translate('whatsapp.nextStepLabel', lang)}\n${response.nextStep.trim()}`);
      }
    } else if (response.confidence === 'NEEDS_ADMIN_CONFIRMATION') {
      const pendingPrefix = translate('whatsapp.pendingConfirmation', lang, { answer: response.answer.trim() });
      parts.push(pendingPrefix);

      if (response.conflict?.summary) {
        parts.push(`${translate('whatsapp.noteLabel', lang)}\n${response.conflict.summary}`);
      }

      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`${translate('whatsapp.nextStepLabel', lang)}\n${response.nextStep.trim()}`);
      } else {
        const defaultHandover = lang === 'fr'
          ? 'Une demande de clarification a été transmise à l’équipe de coordination UniPods.'
          : lang === 'pt'
          ? 'Foi enviado um pedido de esclarecimento à equipa de coordenação UniPods.'
          : lang === 'ar'
          ? 'تم إرسال بطاقة استفسار إلى فريق تنسيق UniPods للتوضيح الرسمي.'
          : 'A ticket has been sent to the UniPods coordination team for clarification.';
        parts.push(`${translate('whatsapp.nextStepLabel', lang)}\n${defaultHandover}`);
      }
    } else {
      // NOT_FOUND
      parts.push(translate('whatsapp.notFoundInDocs', lang));

      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`${translate('whatsapp.nextStepLabel', lang)}\n${response.nextStep.trim()}`);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Controlled message for unlinked / unknown phone numbers.
   * Does NOT call Gemini, does NOT create a user.
   */
  public formatUnknownUserResponse(phoneNumber?: string, lang: SupportedLanguage = 'en'): string {
    return translate('whatsapp.notLinked', lang);
  }

  /**
   * Controlled message for blocked phone numbers.
   */
  public formatBlockedUserResponse(lang: SupportedLanguage = 'en'): string {
    return translate('whatsapp.blocked', lang);
  }

  /**
   * Controlled message for non-textual messages.
   */
  public formatNonTextMessageResponse(lang: SupportedLanguage = 'en'): string {
    return translate('whatsapp.nonText', lang);
  }

  /**
   * Controlled message for unexpected processing warnings.
   */
  public formatFallbackErrorResponse(lang: SupportedLanguage = 'en'): string {
    return translate('whatsapp.systemError', lang);
  }
}

export const whatsappResponseService = new WhatsAppResponseService();
