/**
 * WhatsApp Cloud API Outbound Service (Phase 4.3)
 * METI UniPods AI Innovation Programme 2026
 *
 * Handles:
 * - Server-side dispatch of outbound WhatsApp messages via Meta Graph API
 * - Automatic Dry Run mode (WHATSAPP_DRY_RUN=true or unconfigured credentials)
 * - Strict credential security (secrets never logged or leaked)
 * - Safe error handling so external failures don't crash the webhook or pipeline
 */

import {
  SendWhatsAppTextMessageParams,
  SendWhatsAppResponse,
} from '../types';

export class WhatsAppCloudApiService {
  /**
   * Checks whether real Meta Cloud API credentials are fully configured.
   */
  public isConfigured(): boolean {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    return Boolean(token && token.trim() !== '' && phoneId && phoneId.trim() !== '');
  }

  /**
   * Checks whether the service is running in Dry Run mode.
   * Default to dry-run in test / local environments if credentials are missing
   * or if WHATSAPP_DRY_RUN is set to 'true'.
   */
  public isDryRun(): boolean {
    if (process.env.WHATSAPP_DRY_RUN === 'true' || process.env.WHATSAPP_DRY_RUN === '1') {
      return true;
    }
    return !this.isConfigured();
  }

  /**
   * Sends an outbound plain text WhatsApp message to a recipient.
   */
  public async sendWhatsAppTextMessage(
    params: SendWhatsAppTextMessageParams
  ): Promise<SendWhatsAppResponse> {
    const { to, text, previewUrl } = params;
    if (!to || !text) {
      return {
        success: false,
        status: 'FAILED',
        error: 'Recipient phone number and text body are required',
      };
    }

    // Format destination for Meta Graph API (digits only, e.g. 221771234567)
    const recipientDigits = to.replace(/\D/g, '');

    // Dry Run / Unconfigured Mode
    if (this.isDryRun()) {
      const dryRunId = `dry_run_wamid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.info('\n[WhatsApp Dry Run]');
      console.info(`To: +${recipientDigits}`);
      console.info('Message:');
      console.info(text);
      console.info(`[End WhatsApp Dry Run — ID: ${dryRunId}]\n`);

      return {
        success: true,
        messageId: dryRunId,
        dryRun: true,
        status: this.isConfigured() ? 'DRY_RUN' : 'NOT_CONFIGURED',
      };
    }

    // Real Meta Cloud API Call
    try {
      const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const url = `https://graph.facebook.com/${version}/${phoneId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientDigits,
        type: 'text',
        text: {
          preview_url: Boolean(previewUrl),
          body: text,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `Meta API HTTP error ${response.status}`;
        console.warn(`[WhatsApp] Meta Cloud API outbound send failed: ${errorMsg}`);
        return {
          success: false,
          status: 'FAILED',
          error: errorMsg,
        };
      }

      const deliveredId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      console.info(`[WhatsApp] Message successfully dispatched via Meta API: ${deliveredId}`);

      return {
        success: true,
        messageId: deliveredId,
        dryRun: false,
        status: 'SENT',
      };
    } catch (err: any) {
      console.warn('[WhatsApp] Network error communicating with Meta Cloud API:', err?.message || err);
      return {
        success: false,
        status: 'FAILED',
        error: err?.message || 'Meta Cloud API network failure',
      };
    }
  }
}

export const whatsappCloudApiService = new WhatsAppCloudApiService();
