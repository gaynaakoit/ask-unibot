/**
 * WhatsApp Webhook Service (Phase 4.1, 4.2 + 4.3)
 * METI UniPods AI Innovation Programme 2026
 *
 * Full conversational pipeline:
 * WhatsApp User
 *      ↓
 * Meta Webhook
 *      ↓
 * WhatsApp Identity Resolution
 *      ↓
 * Supabase User (public.users)
 *      ↓
 * Ask UniBot Core (Grounded RAG / Gemini / Deterministic Fallback)
 *      ↓
 * Evidence-Grounded Response Formatter
 *      ↓
 * WhatsApp Cloud API (or Dry Run)
 *      ↓
 * WhatsApp User
 */

import {
  AiResponse,
  WhatsAppIncomingMessage,
  WhatsAppMessageType,
  WhatsAppMessageProcessingStatus,
  WhatsAppStoredMessage,
} from '../types.js';
import { getSupabaseServerClient } from './supabaseServer.js';
import {
  normalizePhoneNumber,
  whatsappIdentityService,
} from './whatsappIdentityService.js';
import { whatsappAskService } from './whatsappAskService.js';
import { whatsappResponseService } from './whatsappResponseService.js';
import { whatsappCloudApiService } from './whatsappCloudApiService.js';
import { whatsappCommandService } from './whatsappCommandService.js';

// In-memory cache for message deduplication and resilience
const processedMessageIds: Set<string> = new Set();
const storedMessagesCache: Map<string, WhatsAppStoredMessage> = new Map();

export class WhatsAppWebhookService {
  /**
   * Classifies raw message types into standard WhatsAppMessageType.
   */
  public classifyMessageType(rawType: string): WhatsAppMessageType {
    if (!rawType || typeof rawType !== 'string') return 'unknown';

    const normalized = rawType.toLowerCase().trim();
    switch (normalized) {
      case 'text':
        return 'text';
      case 'image':
        return 'image';
      case 'audio':
      case 'voice':
        return 'audio';
      case 'video':
        return 'video';
      case 'document':
        return 'document';
      case 'sticker':
        return 'sticker';
      case 'location':
        return 'location';
      case 'interactive':
        return 'interactive';
      case 'button':
        return 'button';
      default:
        return 'unknown';
    }
  }

  /**
   * Defensively parses Meta WhatsApp Cloud API webhook JSON payload.
   */
  public parseWebhookPayload(payload: any): WhatsAppIncomingMessage[] {
    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const messages: WhatsAppIncomingMessage[] = [];

    try {
      const entries = Array.isArray(payload.entry) ? payload.entry : [];

      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];

        for (const change of changes) {
          const value = change?.value;
          if (!value) continue;

          const metadata = value.metadata || {};
          const contacts = Array.isArray(value.contacts) ? value.contacts : [];
          const rawMessages = Array.isArray(value.messages) ? value.messages : [];

          for (const rawMsg of rawMessages) {
            if (!rawMsg || !rawMsg.id || !rawMsg.from) continue;

            const fromRaw = String(rawMsg.from);
            const normalized = normalizePhoneNumber(fromRaw);
            const rawType = String(rawMsg.type || 'unknown');
            const messageType = this.classifyMessageType(rawType);

            // Extract contact profile name if provided by Meta
            const matchingContact = contacts.find((c: any) => c?.wa_id === fromRaw);
            const senderName = matchingContact?.profile?.name || undefined;

            let textBody: string | undefined;
            if (messageType === 'text' && rawMsg.text?.body) {
              textBody = String(rawMsg.text.body);
            }

            // Normalise timestamp
            let timestamp = new Date().toISOString();
            if (rawMsg.timestamp) {
              const epoch = Number(rawMsg.timestamp);
              if (!isNaN(epoch)) {
                timestamp = new Date(epoch > 10000000000 ? epoch : epoch * 1000).toISOString();
              }
            }

            messages.push({
              messageId: String(rawMsg.id),
              phoneNumber: fromRaw,
              phoneNumberNormalized: normalized,
              senderName,
              timestamp,
              messageType,
              textBody,
              rawType,
              metadata: {
                phoneNumberId: metadata.phone_number_id,
                displayPhoneNumber: metadata.display_phone_number,
              },
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[WhatsApp] Error defensively parsing webhook payload:', err?.message || err);
    }

    return messages;
  }

  /**
   * Checks whether a message_id has already been processed or stored (deduplication).
   */
  public async isMessageDuplicate(messageId: string): Promise<boolean> {
    if (!messageId) return false;

    if (processedMessageIds.has(messageId)) {
      return true;
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('whatsapp_messages')
          .select('id')
          .eq('message_id', messageId)
          .maybeSingle();

        if (!error && data) {
          processedMessageIds.add(messageId);
          return true;
        }
      } catch {
        // Fallback to memory
      }
    }

    return false;
  }

  /**
   * Persists incoming message event for auditing, tracing, and deduplication.
   */
  public async recordMessage(
    msg: WhatsAppIncomingMessage,
    userId: string | null,
    status: WhatsAppMessageProcessingStatus
  ): Promise<WhatsAppStoredMessage> {
    const stored: WhatsAppStoredMessage = {
      id: `wamsg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      messageId: msg.messageId,
      phoneNumber: msg.phoneNumber,
      phoneNumberNormalized: msg.phoneNumberNormalized,
      userId,
      messageType: msg.messageType,
      messageBody: msg.textBody || undefined,
      receivedAt: msg.timestamp || new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status,
      metadata: msg.metadata || {},
    };

    processedMessageIds.add(msg.messageId);
    storedMessagesCache.set(msg.messageId, stored);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('whatsapp_messages').upsert({
          id: stored.id,
          message_id: stored.messageId,
          phone_number: stored.phoneNumber,
          phone_number_normalized: stored.phoneNumberNormalized,
          user_id: stored.userId,
          message_type: stored.messageType,
          message_body: stored.messageBody,
          received_at: stored.receivedAt,
          processed_at: stored.processedAt,
          status: stored.status,
          metadata: stored.metadata,
        });
      } catch {
        // Fallback synchronized with storedMessagesCache
      }
    }

    return stored;
  }

  /**
   * Main entry point to process an incoming Meta Webhook event (Phase 4.3 Pipeline).
   *
   * Workflow:
   * 1. Parse payload
   * 2. Deduplicate message_id
   * 3. Resolve WhatsApp identity (strictly via phone number)
   * 4. Classify user (KNOWN_USER, UNKNOWN_USER, BLOCKED_USER)
   * 5. If unknown → controlled response (no Ask UniBot, no user created)
   * 6. If blocked → controlled response (no Ask UniBot)
   * 7. If known:
   *      Process question via Ask UniBot Core (Gemini / deterministic RAG)
   *      Persist question with channel='WHATSAPP' and message_id
   *      If human needed → create handover ticket
   * 8. Format response for mobile WhatsApp
   * 9. Send response via WhatsApp Cloud API (or Dry Run)
   * 10. Record message status and return HTTP 200
   */
  public async processIncomingEvent(payload: any): Promise<{
    success: boolean;
    messagesCount: number;
    duplicateCount: number;
    processed: Array<{
      messageId: string;
      status: WhatsAppMessageProcessingStatus;
      identity: string;
      messageType: WhatsAppMessageType;
      userId?: string | null;
      confidence?: string;
      needsHuman?: boolean;
      command?: string;
      outboundSent?: boolean;
    }>;
  }> {
    const incomingMessages = this.parseWebhookPayload(payload);
    const results: Array<{
      messageId: string;
      status: WhatsAppMessageProcessingStatus;
      identity: string;
      messageType: WhatsAppMessageType;
      userId?: string | null;
      confidence?: string;
      needsHuman?: boolean;
      command?: string;
      outboundSent?: boolean;
    }> = [];

    let duplicateCount = 0;

    for (const msg of incomingMessages) {
      // 1. Deduplication check (Idempotence)
      const isDuplicate = await this.isMessageDuplicate(msg.messageId);
      if (isDuplicate) {
        duplicateCount++;
        console.info(`[WhatsApp] message duplicate ignored: ${msg.messageId}`);
        results.push({
          messageId: msg.messageId,
          status: 'IGNORED',
          identity: 'DUPLICATE',
          messageType: msg.messageType,
          outboundSent: false,
        });
        continue;
      }

      // Mark ID immediately to prevent race conditions
      processedMessageIds.add(msg.messageId);

      // 2. Identity resolution (strictly phone number, never display name)
      const resolution = await whatsappIdentityService.findUserByWhatsAppNumber(msg.phoneNumberNormalized);

      console.info(`[WhatsApp] webhook received: message_id=${msg.messageId}`);
      console.info(`[WhatsApp] message type: ${msg.messageType}`);
      console.info(`[WhatsApp] identity: ${resolution.status}`);

      const resolvedUserId = resolution.user?.id || null;
      let finalStatus: WhatsAppMessageProcessingStatus = 'PROCESSED';
      let outboundText = '';
      let askResponse: AiResponse | null = null;
      let outboundSuccess = false;
      let handledCommand: string | undefined = undefined;

      // 3. User classification & handling
      if (resolution.status === 'BLOCKED_USER') {
        // Blocked user: DO NOT call Gemini, Ask UniBot, or personal commands. Controlled response.
        outboundText = whatsappResponseService.formatBlockedUserResponse();
        finalStatus = 'IGNORED';
        const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
          to: msg.phoneNumberNormalized,
          text: outboundText,
        });
        outboundSuccess = sendResult.success;
      } else if (resolution.status === 'UNKNOWN_USER') {
        // Unknown user: DO NOT call Gemini, DO NOT create user, DO NOT execute personal commands.
        outboundText = whatsappResponseService.formatUnknownUserResponse(msg.phoneNumberNormalized);
        finalStatus = 'PROCESSED';
        const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
          to: msg.phoneNumberNormalized,
          text: outboundText,
        });
        outboundSuccess = sendResult.success;
      } else if (msg.messageType !== 'text' || !msg.textBody) {
        // Non-text message from known user
        outboundText = whatsappResponseService.formatNonTextMessageResponse();
        finalStatus = 'PROCESSED';
        const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
          to: msg.phoneNumberNormalized,
          text: outboundText,
        });
        outboundSuccess = sendResult.success;
      } else {
        // KNOWN_USER with text message:
        // First check if this is an official slash command (e.g. /help, /actions, /status, /recap, /missed)
        const parsedCmd = whatsappCommandService.parseCommand(msg.textBody);

        if (parsedCmd.isCommand) {
          // Command Router (Phase 4.4)
          console.info(`[WhatsApp] routing command: ${parsedCmd.command} for ${resolution.user!.name}`);
          const cmdResult = await whatsappCommandService.handleCommand({
            command: msg.textBody,
            userId: resolution.user!.id,
            participantName: resolution.user!.name,
            phoneNumber: msg.phoneNumberNormalized,
          });

          outboundText = cmdResult.response;
          finalStatus = 'PROCESSED';
          handledCommand = parsedCmd.command;

          const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
            to: msg.phoneNumberNormalized,
            text: outboundText,
          });
          outboundSuccess = sendResult.success;
        } else {
          // Natural language question: Process through Ask UniBot Core!
          try {
            askResponse = await whatsappAskService.processWhatsAppQuestion({
              userId: resolution.user!.id,
              participantName: resolution.user!.name,
              phoneNumber: msg.phoneNumberNormalized,
              messageId: msg.messageId,
              text: msg.textBody,
            });

            // Format response for WhatsApp mobile
            outboundText = whatsappResponseService.formatWhatsAppResponse(askResponse);
          } catch (askErr: any) {
            console.warn('[WhatsApp] Error in Ask UniBot core execution:', askErr?.message || askErr);
            outboundText = whatsappResponseService.formatFallbackErrorResponse();
          }

          // Send response via WhatsApp Cloud API (or Dry Run)
          const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
            to: msg.phoneNumberNormalized,
            text: outboundText,
          });
          outboundSuccess = sendResult.success;
        }
      }

      // 4. Persist message audit record
      await this.recordMessage(msg, resolvedUserId, finalStatus);

      results.push({
        messageId: msg.messageId,
        status: finalStatus,
        identity: resolution.status,
        messageType: msg.messageType,
        userId: resolvedUserId,
        confidence: askResponse?.confidence,
        needsHuman: askResponse?.needsHuman,
        command: handledCommand,
        outboundSent: outboundSuccess,
      });
    }

    return {
      success: true,
      messagesCount: incomingMessages.length,
      duplicateCount,
      processed: results,
    };
  }
}

export const whatsappWebhookService = new WhatsAppWebhookService();
