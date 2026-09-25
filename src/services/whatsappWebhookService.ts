/**
 * WhatsApp Webhook Service (Phase 4.1 - 4.4 + Phase 5 Group Memory)
 * METI UniPods AI Innovation Programme 2026
 *
 * Full conversational pipeline:
 * WhatsApp User / Group
 *      ↓
 * Meta Webhook
 *      ↓
 * Deduplication
 *      ↓
 * Routing: Private Message OR Group Message
 *      ↓
 * Identity Resolution (Strictly verified phone number)
 *      ↓
 * Group Authorization & Membership check (if group)
 *      ↓
 * Raw Message Audit Store
 *      ↓
 * Deterministic Classification (Smart Silence)
 *      ↓
 * Memory Extraction & Governance (PENDING / APPROVED / REJECTED)
 *      ↓
 * Ask UniBot Core (RAG on approved sources & approved group memories)
 *      ↓
 * Formatted WhatsApp Response / Silent Absorption
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
import { groupMemoryService } from './groupMemoryService.js';
import { whatsappGroupService } from './whatsappGroupService.js';
import { resolveWhatsAppMessageLanguage, SupportedLanguage } from '../i18n/index.js';

// In-memory cache for message deduplication and resilience
const processedMessageIds: Set<string> = new Set();
const storedMessagesCache: Map<string, WhatsAppStoredMessage> = new Map();

export class WhatsAppWebhookService {
  /**
   * Classifies raw message types into standard WhatsAppMessageType.
   */
  public classifyMessageType(rawType: string): WhatsAppMessageType {
    if (!rawType || typeof rawType !== 'string') return 'unknown';

    switch (rawType.toLowerCase()) {
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
   * Accurately differentiates between private 1:1 chats and group conversations.
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
            const rawType = String(rawMsg.type || 'unknown');
            const messageType = this.classifyMessageType(rawType);

            // Group detection logic
            const isGroup = Boolean(
              rawMsg.group_id ||
              rawMsg.chat_id ||
              value.group_id ||
              rawMsg.recipient_type === 'group' ||
              fromRaw.includes('@g.us') ||
              fromRaw.includes('-group') ||
              (fromRaw.includes('-') && !fromRaw.startsWith('+'))
            );

            let groupId: string | undefined = rawMsg.group_id || rawMsg.chat_id || value.group_id;
            if (!groupId && isGroup) {
              if (fromRaw.includes('-') || fromRaw.includes('@g.us')) {
                groupId = fromRaw;
              }
            }

            // Identify author phone number
            let authorPhoneRaw = fromRaw;
            if (isGroup) {
              if (rawMsg.author || rawMsg.participant || rawMsg.sender) {
                authorPhoneRaw = String(rawMsg.author || rawMsg.participant || rawMsg.sender);
              } else if (
                (fromRaw.includes('-') || fromRaw.includes('@g.us')) &&
                contacts.length > 0 &&
                contacts[0]?.wa_id
              ) {
                authorPhoneRaw = String(contacts[0].wa_id);
              }
            }

            const normalized = normalizePhoneNumber(authorPhoneRaw);

            // Extract contact profile name if provided by Meta
            const matchingContact = contacts.find((c: any) => c?.wa_id === authorPhoneRaw || c?.wa_id === fromRaw);
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
              phoneNumber: authorPhoneRaw,
              phoneNumberNormalized: normalized,
              senderName,
              timestamp,
              messageType,
              textBody,
              rawType,
              groupId,
              isGroup,
              metadata: {
                phoneNumberId: metadata.phone_number_id,
                displayPhoneNumber: metadata.display_phone_number,
                groupId,
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
   * Processes Meta WhatsApp Group Lifecycle & Membership Webhook Events
   */
  public async processGroupEvents(payload: any): Promise<Array<{
    type: string;
    groupId?: string;
    action: string;
    success: boolean;
  }>> {
    const results: Array<{
      type: string;
      groupId?: string;
      action: string;
      success: boolean;
    }> = [];

    if (!payload || typeof payload !== 'object') return results;

    try {
      const entries = Array.isArray(payload.entry) ? payload.entry : [];
      for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
          const val = change?.value;
          if (!val) continue;

          // 1. group_lifecycle_update
          if (
            change.field === 'group_lifecycle_update' ||
            val.event === 'group_lifecycle_update' ||
            val.group_lifecycle_update
          ) {
            const gData = val.group_lifecycle_update || val;
            const gId = String(gData.group_id || gData.id || '');
            const gSubject = gData.subject || gData.name || '';
            const gInvite = gData.invite_link;

            if (gId) {
              const existing = await whatsappGroupService.getGroup(gId);
              if (existing) {
                await whatsappGroupService.updateGroupSettings(existing.id, {
                  subject: gSubject || existing.name,
                  status: 'ACTIVE',
                });
                if (gInvite) existing.inviteLink = gInvite;
              } else if (gSubject) {
                await whatsappGroupService.createGroup({
                  subject: gSubject,
                });
              }

              results.push({
                type: 'group_lifecycle_update',
                groupId: gId,
                action: 'synchronized',
                success: true,
              });
            }
          }

          // 2. group_participants_update
          if (
            change.field === 'group_participants_update' ||
            val.event === 'group_participants_update' ||
            val.group_participants_update
          ) {
            const pData = val.group_participants_update || val;
            const gId = String(pData.group_id || pData.id || '');
            const action = pData.event || pData.action || 'add';
            const participants = Array.isArray(pData.participants) ? pData.participants : [];

            if (gId) {
              const group = await whatsappGroupService.getGroup(gId);
              if (group) {
                for (const p of participants) {
                  const pWaId = p.wa_id || p.id || p.phone;
                  if (action === 'remove' || action === 'leave') {
                    await whatsappGroupService.removeParticipant(group.id, pWaId);
                  } else if (action === 'add' || action === 'join') {
                    const client = getSupabaseServerClient();
                    if (client && pWaId) {
                      const norm = normalizePhoneNumber(String(pWaId));
                      const res = await whatsappIdentityService.findUserByWhatsAppNumber(norm);
                      const userId = res.user?.id || `ext-user-${pWaId}`;
                      await client.from('whatsapp_group_members').upsert({
                        id: `gmem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        group_id: group.id,
                        user_id: userId,
                        role: p.role === 'admin' ? 'ADMIN' : 'MEMBER',
                        status: 'ACTIVE',
                        joined_at: new Date().toISOString(),
                      });
                    }
                  }
                }
              }

              results.push({
                type: 'group_participants_update',
                groupId: gId,
                action,
                success: true,
              });
            }
          }

          // 3. group_settings_update
          if (
            change.field === 'group_settings_update' ||
            val.event === 'group_settings_update' ||
            val.group_settings_update
          ) {
            const sData = val.group_settings_update || val;
            const gId = String(sData.group_id || sData.id || '');
            if (gId) {
              const group = await whatsappGroupService.getGroup(gId);
              if (group) {
                await whatsappGroupService.updateGroupSettings(group.id, {
                  subject: sData.subject,
                  description: sData.description,
                  joinApprovalMode: sData.join_approval_mode,
                });
              }
              results.push({
                type: 'group_settings_update',
                groupId: gId,
                action: 'updated',
                success: true,
              });
            }
          }

          // 4. group_status_update
          if (
            change.field === 'group_status_update' ||
            val.event === 'group_status_update' ||
            val.group_status_update
          ) {
            const stData = val.group_status_update || val;
            const gId = String(stData.group_id || stData.id || '');
            if (gId) {
              const group = await whatsappGroupService.getGroup(gId);
              if (group) {
                await whatsappGroupService.updateGroupSettings(group.id, {
                  status: stData.status,
                });
              }
              results.push({
                type: 'group_status_update',
                groupId: gId,
                action: 'status_updated',
                success: true,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[WhatsAppWebhookService] Error processing group webhook events:', err?.message || err);
    }

    return results;
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
   * Main entry point to process an incoming Meta Webhook event.
   * Handles both PRIVATE (1:1) and GROUP conversations seamlessly.
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
      isGroup?: boolean;
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
      isGroup?: boolean;
    }> = [];

    let duplicateCount = 0;

    // Process Meta group lifecycle, participant, settings, and status events
    await this.processGroupEvents(payload);

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
          isGroup: msg.isGroup,
        });
        continue;
      }

      // Mark ID immediately to prevent race conditions
      processedMessageIds.add(msg.messageId);

      // =======================================================================
      // ROUTING BRANCH 1: GROUP MESSAGE PIPELINE (Phase 5 & 6)
      // =======================================================================
      if (msg.isGroup && msg.groupId) {
        console.info(`[WhatsApp Group] Inbound group message: group=${msg.groupId}, id=${msg.messageId}`);

        const groupMode = whatsappGroupService.getGroupMode();
        if (groupMode === 'OFF') {
          console.info(`[WhatsApp Group] Group mode is OFF. Ignoring message: ${msg.messageId}`);
          results.push({
            messageId: msg.messageId,
            status: 'IGNORED',
            identity: 'GROUP_MODE_OFF',
            messageType: msg.messageType,
            outboundSent: false,
            isGroup: true,
          });
          continue;
        }

        // 1. Group Authorization
        const group = await groupMemoryService.getGroup(msg.groupId);
        if (!group || !group.isApproved || group.status !== 'ACTIVE') {
          console.info(`[WhatsApp Group] Unauthorized or inactive group: ${msg.groupId}`);
          results.push({
            messageId: msg.messageId,
            status: 'IGNORED',
            identity: 'UNAUTHORIZED_GROUP',
            messageType: msg.messageType,
            outboundSent: false,
            isGroup: true,
          });
          continue;
        }

        // 2. Author Identity Resolution (Strictly via phone number)
        const resolution = await whatsappIdentityService.findUserByWhatsAppNumber(msg.phoneNumberNormalized);

        if (resolution.status === 'UNKNOWN_USER' || resolution.status === 'BLOCKED_USER') {
          console.info(`[WhatsApp Group] Sender ${msg.phoneNumberNormalized} is ${resolution.status}`);
          await groupMemoryService.recordGroupMessage({
            messageId: msg.messageId,
            groupId: group.id,
            userId: null,
            senderPhoneNormalized: msg.phoneNumberNormalized,
            messageText: msg.textBody || '',
            messageType: msg.messageType,
            rawMetadata: msg.metadata,
            processingStatus: 'IGNORED',
          });

          results.push({
            messageId: msg.messageId,
            status: 'IGNORED',
            identity: resolution.status,
            messageType: msg.messageType,
            outboundSent: false,
            isGroup: true,
          });
          continue;
        }

        // 3. Group Membership Check
        const member = await groupMemoryService.getMember(group.id, resolution.user!.id);
        if (!member || member.status !== 'ACTIVE') {
          console.info(`[WhatsApp Group] User ${resolution.user!.id} is not an active member of ${group.id}`);
          await groupMemoryService.recordGroupMessage({
            messageId: msg.messageId,
            groupId: group.id,
            userId: resolution.user!.id,
            senderPhoneNormalized: msg.phoneNumberNormalized,
            messageText: msg.textBody || '',
            messageType: msg.messageType,
            rawMetadata: msg.metadata,
            processingStatus: 'IGNORED',
          });

          results.push({
            messageId: msg.messageId,
            status: 'IGNORED',
            identity: 'NON_MEMBER',
            messageType: msg.messageType,
            userId: resolution.user!.id,
            outboundSent: false,
            isGroup: true,
          });
          continue;
        }

        // 4. Store Raw Message in Audit Log
        const rawGroupMsg = await groupMemoryService.recordGroupMessage({
          messageId: msg.messageId,
          groupId: group.id,
          userId: resolution.user!.id,
          senderPhoneNormalized: msg.phoneNumberNormalized,
          messageText: msg.textBody || '',
          messageType: msg.messageType,
          rawMetadata: msg.metadata,
          processingStatus: 'PROCESSED',
        });

        // 5. Message Classification
        const classification = groupMemoryService.classifyMessage(msg.textBody || '', member.role);
        console.info(`[WhatsApp Group] Classification: ${classification.category} (${classification.reason})`);

        // 6. Memory Extraction with Strict Approval Policy
        const extraction = groupMemoryService.extractMemory({
          text: msg.textBody || '',
          senderRole: member.role,
          classification,
        });

        if (extraction.shouldExtract && extraction.memoryType) {
          await groupMemoryService.saveMemory({
            groupId: group.id,
            sourceMessageId: rawGroupMsg.id,
            createdByUserId: resolution.user!.id,
            memoryType: extraction.memoryType,
            title: extraction.title || 'Extracted Memory',
            content: extraction.content || msg.textBody || '',
            confidence: extraction.confidence,
            approvalStatus: extraction.defaultApprovalStatus,
            approvedBy: extraction.defaultApprovalStatus === 'APPROVED' ? resolution.user!.id : undefined,
          });
        }

        // 7. Smart Silence & Routing
        if (classification.shouldSilence) {
          console.info(`[WhatsApp Group] Smart Silence applied to category ${classification.category}`);
          results.push({
            messageId: msg.messageId,
            status: classification.category === 'GENERAL_CHAT' ? 'IGNORED' : 'PROCESSED',
            identity: resolution.status,
            messageType: msg.messageType,
            userId: resolution.user!.id,
            outboundSent: false,
            isGroup: true,
          });
          continue;
        }

        const groupLang = resolveWhatsAppMessageLanguage({
          messageText: msg.textBody,
          userPreferredLanguage: resolution.user?.preferredLanguage,
        });

        // 8. Command execution in group context
        if (classification.isCommand) {
          console.info(`[WhatsApp Group] Routing group command: /${classification.commandName}`);

          const cmdResult = await whatsappCommandService.handleCommand({
            command: msg.textBody || '',
            userId: resolution.user!.id,
            participantName: resolution.user!.name,
            phoneNumber: msg.phoneNumberNormalized,
            groupId: group.id,
            preferredLanguage: resolution.user?.preferredLanguage,
          });

          const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
            to: msg.phoneNumberNormalized,
            text: cmdResult.response,
          });

          results.push({
            messageId: msg.messageId,
            status: 'PROCESSED',
            identity: resolution.status,
            messageType: msg.messageType,
            userId: resolution.user!.id,
            command: classification.commandName,
            outboundSent: sendResult.success,
            isGroup: true,
          });
          continue;
        }

        // 9. Direct question to Ask UniBot
        if (classification.isDirectQuestionToBot) {
          console.info(`[WhatsApp Group] Direct question for Ask UniBot: "${msg.textBody}"`);

          if (groupMode === 'OBSERVE') {
            console.info(`[WhatsApp Group] OBSERVE mode: Direct question recorded silently without outbound group response.`);
            results.push({
              messageId: msg.messageId,
              status: 'PROCESSED',
              identity: resolution.status,
              messageType: msg.messageType,
              userId: resolution.user!.id,
              outboundSent: false,
              isGroup: true,
            });
            continue;
          }

          let askResponse: AiResponse | null = null;
          let outboundText = '';

          try {
            askResponse = await whatsappAskService.processWhatsAppQuestion({
              userId: resolution.user!.id,
              participantName: resolution.user!.name,
              phoneNumber: msg.phoneNumberNormalized,
              messageId: msg.messageId,
              text: msg.textBody || '',
              groupId: group.id,
              targetLanguage: groupLang,
            });

            outboundText = whatsappResponseService.formatWhatsAppResponse(askResponse, groupLang);
          } catch (askErr: any) {
            console.warn('[WhatsApp Group] Error in Ask UniBot execution:', askErr?.message || askErr);
            outboundText = whatsappResponseService.formatFallbackErrorResponse(groupLang);
          }

          const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
            to: msg.phoneNumberNormalized,
            text: outboundText,
          });

          results.push({
            messageId: msg.messageId,
            status: 'PROCESSED',
            identity: resolution.status,
            messageType: msg.messageType,
            userId: resolution.user!.id,
            confidence: askResponse?.confidence,
            needsHuman: askResponse?.needsHuman,
            outboundSent: sendResult.success,
            isGroup: true,
          });
          continue;
        }

        // Default group fallback: absorb silently
        results.push({
          messageId: msg.messageId,
          status: 'PROCESSED',
          identity: resolution.status,
          messageType: msg.messageType,
          userId: resolution.user!.id,
          outboundSent: false,
          isGroup: true,
        });
        continue;
      }

      // =======================================================================
      // ROUTING BRANCH 2: PRIVATE 1:1 CONVERSATION (Phase 4.3 & 4.4 Unaffected)
      // =======================================================================
      // 2. Identity resolution (strictly phone number, never display name)
      const resolution = await whatsappIdentityService.findUserByWhatsAppNumber(msg.phoneNumberNormalized);

      console.info(`[WhatsApp Private] webhook received: message_id=${msg.messageId}`);
      console.info(`[WhatsApp Private] message type: ${msg.messageType}`);
      console.info(`[WhatsApp Private] identity: ${resolution.status}`);

      const resolvedUserId = resolution.user?.id || null;
      let finalStatus: WhatsAppMessageProcessingStatus = 'PROCESSED';
      let outboundText = '';
      let askResponse: AiResponse | null = null;
      let outboundSuccess = false;
      let handledCommand: string | undefined = undefined;

      const privateLang = resolveWhatsAppMessageLanguage({
        messageText: msg.textBody,
        userPreferredLanguage: resolution.user?.preferredLanguage,
      });

      // 3. User classification & handling
      if (resolution.status === 'BLOCKED_USER') {
        // Blocked user: DO NOT call Gemini, Ask UniBot, or personal commands. Controlled response.
        outboundText = whatsappResponseService.formatBlockedUserResponse(privateLang);
        finalStatus = 'IGNORED';
        const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
          to: msg.phoneNumberNormalized,
          text: outboundText,
        });
        outboundSuccess = sendResult.success;
      } else if (resolution.status === 'UNKNOWN_USER') {
        // Unknown user: DO NOT call Gemini, DO NOT create user, DO NOT execute personal commands.
        outboundText = whatsappResponseService.formatUnknownUserResponse(msg.phoneNumberNormalized, privateLang);
        finalStatus = 'PROCESSED';
        const sendResult = await whatsappCloudApiService.sendWhatsAppTextMessage({
          to: msg.phoneNumberNormalized,
          text: outboundText,
        });
        outboundSuccess = sendResult.success;
      } else if (msg.messageType !== 'text' || !msg.textBody) {
        // Non-text message from known user
        outboundText = whatsappResponseService.formatNonTextMessageResponse(privateLang);
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
          console.info(`[WhatsApp Private] routing command: ${parsedCmd.command} for ${resolution.user!.name}`);
          const cmdResult = await whatsappCommandService.handleCommand({
            command: msg.textBody,
            userId: resolution.user!.id,
            participantName: resolution.user!.name,
            phoneNumber: msg.phoneNumberNormalized,
            preferredLanguage: resolution.user?.preferredLanguage,
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
              targetLanguage: privateLang,
            });

            // Format response for WhatsApp mobile
            outboundText = whatsappResponseService.formatWhatsAppResponse(askResponse, privateLang);
          } catch (askErr: any) {
            console.warn('[WhatsApp Private] Error in Ask UniBot core execution:', askErr?.message || askErr);
            outboundText = whatsappResponseService.formatFallbackErrorResponse(privateLang);
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
        isGroup: false,
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
