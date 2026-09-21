/**
 * WhatsApp Integration Service Placeholder
 * Provides clean architectural abstractions for WhatsApp Cloud API,
 * webhook validation, inbound message filtering, and Smart Silence evaluation.
 */

export interface InboundWhatsAppMessage {
  id: string;
  from: string; // phone number or participant handle
  senderName: string;
  body: string;
  timestamp: string;
  isGroupMessage: boolean;
  groupId?: string;
}

export interface SmartSilenceDecision {
  shouldRespond: boolean;
  reason: string;
  detectedIntent?: 'direct_summon' | 'official_query' | 'casual_banter' | 'peer_troubleshooting';
  cleanedPrompt?: string;
}

export class WhatsAppService {
  /**
   * Smart Silence Evaluator:
   * "Ask UniBot stays quiet unless you call it, message it privately,
   * or ask an official programme question."
   */
  public evaluateSmartSilence(message: InboundWhatsAppMessage): SmartSilenceDecision {
    const text = message.body.trim();
    const lower = text.toLowerCase();

    // 1. Direct mention or private message
    if (!message.isGroupMessage) {
      return {
        shouldRespond: true,
        reason: 'Direct private message received. Responding immediately.',
        detectedIntent: 'direct_summon',
        cleanedPrompt: text,
      };
    }

    if (lower.includes('@ask unibot') || lower.includes('@unibot') || lower.startsWith('!unibot')) {
      const cleaned = text
        .replace(/@ask unibot/gi, '')
        .replace(/@unibot/gi, '')
        .replace(/!unibot/gi, '')
        .trim();

      return {
        shouldRespond: true,
        reason: 'Explicit participant summon (@Ask UniBot) detected.',
        detectedIntent: 'direct_summon',
        cleanedPrompt: cleaned || 'How can I assist you with approved UniPods programme information?',
      };
    }

    // 2. High-urgency official question with keyword triggers in group
    const isExplicitOfficialQuestion =
      (lower.includes('official deadline') ||
        lower.includes('official meeting link') ||
        lower.includes('official announcement')) &&
      text.endsWith('?');

    if (isExplicitOfficialQuestion) {
      return {
        shouldRespond: true,
        reason: 'Explicit official programme inquiry detected in group.',
        detectedIntent: 'official_query',
        cleanedPrompt: text,
      };
    }

    // 3. Otherwise: Smart Silence keeps the bot completely quiet
    if (
      lower.includes('anyone') ||
      lower.includes('guys') ||
      lower.includes('thanks') ||
      lower.includes('hello') ||
      lower.includes('who has') ||
      lower.includes('good morning')
    ) {
      return {
        shouldRespond: false,
        reason: 'Smart Silence is ON: UniBot refrains from interrupting normal community conversation.',
        detectedIntent: 'casual_banter',
      };
    }

    return {
      shouldRespond: false,
      reason: 'Smart Silence is ON: Message not addressed to @Ask UniBot.',
      detectedIntent: 'peer_troubleshooting',
    };
  }

  /**
   * Placeholder for WhatsApp Cloud API outbound message dispatch
   */
  public async sendWhatsAppMessage(
    to: string,
    text: string,
    evidenceFooter?: string
  ): Promise<{ success: boolean; messageId: string }> {
    console.info(`[WhatsApp Cloud API Mock] Dispatched to ${to}: ${text.slice(0, 60)}...`);
    return {
      success: true,
      messageId: `wamid.HBgL${Date.now()}`,
    };
  }
}

export const whatsAppService = new WhatsAppService();
