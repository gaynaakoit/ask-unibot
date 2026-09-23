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

export class WhatsAppResponseService {
  /**
   * Formats a structured AiResponse into a mobile-friendly WhatsApp message.
   */
  public formatWhatsAppResponse(response: AiResponse): string {
    const parts: string[] = [];

    // 1. Answer text based on confidence
    if (response.confidence === 'CONFIRMED') {
      parts.push(response.answer.trim());

      // Evidence / Source citation
      if (Array.isArray(response.sources) && response.sources.length > 0) {
        const topSource = response.sources[0];
        const sourceTitle = topSource.title || 'Official UniPods update';
        parts.push(`Source:\n${sourceTitle}`);
      } else if (Array.isArray(response.evidenceItems) && response.evidenceItems.length > 0) {
        const topEv = response.evidenceItems[0];
        const evTitle = topEv.title || 'Official UniPods update';
        parts.push(`Source:\n${evTitle}`);
      }

      // Next step
      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`Next step:\n${response.nextStep.trim()}`);
      }
    } else if (response.confidence === 'NEEDS_ADMIN_CONFIRMATION') {
      parts.push(`⚠️ Information Pending Programme Confirmation:\n\n${response.answer.trim()}`);

      if (response.conflict?.summary) {
        parts.push(`Note:\n${response.conflict.summary}`);
      }

      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`Next step:\n${response.nextStep.trim()}`);
      } else {
        parts.push('Next step:\nA ticket has been sent to the UniPods coordination team for clarification.');
      }
    } else {
      // NOT_FOUND
      parts.push(
        "I couldn't find a verified answer to that in the approved UniPods programme documentation.\n\nI have forwarded your question to the programme team for official confirmation."
      );

      if (response.nextStep && response.nextStep.trim() !== '') {
        parts.push(`Next step:\n${response.nextStep.trim()}`);
      }
    }

    return parts.join('\n\n');
  }

  /**
   * Controlled message for unlinked / unknown phone numbers.
   * Does NOT call Gemini, does NOT create a user.
   */
  public formatUnknownUserResponse(phoneNumber?: string): string {
    return (
      'Your WhatsApp number is not linked to an Ask UniBot account yet.\n\n' +
      'Please contact your UniPods administrator to activate access.'
    );
  }

  /**
   * Controlled message for blocked phone numbers.
   */
  public formatBlockedUserResponse(): string {
    return (
      'WhatsApp access is currently not available for this number.\n\n' +
      'Please contact your UniPods coordinator through the web portal.'
    );
  }

  /**
   * Controlled message for non-textual messages.
   */
  public formatNonTextMessageResponse(): string {
    return (
      'Ask UniBot currently accepts written text questions on WhatsApp.\n\n' +
      'Please send your question as a text message.'
    );
  }

  /**
   * Controlled message for unexpected processing warnings.
   */
  public formatFallbackErrorResponse(): string {
    return (
      'Ask UniBot is temporarily unable to retrieve this information.\n\n' +
      'Your inquiry has been recorded and will be reviewed by the programme coordination desk.'
    );
  }
}

export const whatsappResponseService = new WhatsAppResponseService();
