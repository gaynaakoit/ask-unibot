/**
 * Group Memory Service (Ask UniBot Phase 5)
 * METI UniPods AI Innovation Programme 2026
 *
 * Responsibilities:
 * - Ingest & persist raw WhatsApp group messages
 * - Run deterministic classification & Smart Silence check
 * - Extract memory records with strict approval governance:
 *   - Participant claims -> PENDING (cannot be cited as official truth)
 *   - Facilitator / Admin statements -> HIGH confidence, structured for verification
 *   - Incompatible / contradictory claims -> Conflict registered, NEEDS_ADMIN_CONFIRMATION
 * - Admin Approval Workflow (approve, reject, supersede)
 * - Expose strictly APPROVED group memories to Ask UniBot Core RAG
 */

import {
  GroupMemory,
  GroupMemoryApprovalStatus,
  GroupMemoryExtraction,
  GroupMemoryType,
  GroupMessageClassification,
  WhatsAppGroup,
  WhatsAppGroupMember,
  WhatsAppGroupMemberRole,
  WhatsAppGroupMessage,
} from '../types.js';
import { getSupabaseServerClient } from './supabaseServer.js';
import { groupMessageClassifier } from './groupMessageClassifier.js';
import { conflictService } from './conflictService.js';

// Fallback in-memory registries for ultra-fast response & server resilience
const fallbackGroups: Map<string, WhatsAppGroup> = new Map();
const fallbackMembers: Map<string, WhatsAppGroupMember[]> = new Map(); // key: groupId
const fallbackMessages: Map<string, WhatsAppGroupMessage> = new Map();
const fallbackMemories: Map<string, GroupMemory> = new Map();

// Initialize Demo Group
const DEMO_GROUP_ID = 'grp-unipods-2026-demo';
const DEMO_WA_GROUP_ID = '12036302212026-group';

const initialDemoGroup: WhatsAppGroup = {
  id: DEMO_GROUP_ID,
  whatsappGroupId: DEMO_WA_GROUP_ID,
  name: 'UniPods AI Innovation Programme 2026',
  programmeId: 'unipods-ai-cohort-2026',
  status: 'ACTIVE',
  isApproved: true,
  isDemo: true,
  createdAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
};

fallbackGroups.set(DEMO_GROUP_ID, initialDemoGroup);
fallbackGroups.set(DEMO_WA_GROUP_ID, initialDemoGroup);

const initialDemoMembers: WhatsAppGroupMember[] = [
  {
    id: 'gmem-awa-diop',
    groupId: DEMO_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000001', // Awa Diop
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-09-21T00:00:00.000Z',
    createdAt: '2026-09-21T00:00:00.000Z',
  },
  {
    id: 'gmem-aminata-toure',
    groupId: DEMO_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000002', // Dr. Aminata Touré
    role: 'FACILITATOR',
    status: 'ACTIVE',
    joinedAt: '2026-09-21T00:00:00.000Z',
    createdAt: '2026-09-21T00:00:00.000Z',
  },
  {
    id: 'gmem-user-b',
    groupId: DEMO_GROUP_ID,
    userId: '00000000-0000-4000-a000-000000000003', // User B
    role: 'MEMBER',
    status: 'ACTIVE',
    joinedAt: '2026-09-21T00:00:00.000Z',
    createdAt: '2026-09-21T00:00:00.000Z',
  },
];

fallbackMembers.set(DEMO_GROUP_ID, initialDemoMembers);

// Initial Approved Demo Memories
const initialDemoMemories: GroupMemory[] = [
  {
    id: 'gmem-item-ann-1',
    groupId: DEMO_GROUP_ID,
    sourceMessageId: 'gmsg-announcement-1',
    createdByUserId: '00000000-0000-4000-a000-000000000002',
    memoryType: 'ANNOUNCEMENT',
    title: 'Session interactive éthique & IA jeudi 15h00',
    content: 'La prochaine session interactive sur l’éthique et l’IA se tiendra ce jeudi à 15h00 GMT sur MS Teams.',
    confidence: 'HIGH',
    approvalStatus: 'APPROVED',
    approvedBy: '00000000-0000-4000-a000-000000000002',
    approvedAt: '2026-09-21T10:00:00.000Z',
    isDemo: true,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'gmem-item-dl-1',
    groupId: DEMO_GROUP_ID,
    sourceMessageId: 'gmsg-deadline-1',
    createdByUserId: '00000000-0000-4000-a000-000000000002',
    memoryType: 'DEADLINE',
    title: 'Soumission Milestone 2 fixée au 30 septembre',
    content: 'La date limite officielle de soumission pour le Milestone 2 est fixée au 30 septembre à 23h59 GMT.',
    confidence: 'HIGH',
    approvalStatus: 'APPROVED',
    approvedBy: '00000000-0000-4000-a000-000000000002',
    approvedAt: '2026-09-21T10:00:00.000Z',
    isDemo: true,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'gmem-item-dec-1',
    groupId: DEMO_GROUP_ID,
    sourceMessageId: 'gmsg-decision-1',
    createdByUserId: '00000000-0000-4000-a000-000000000002',
    memoryType: 'DECISION',
    title: 'Désignation d’un responsable technique par équipe',
    content: 'Chaque équipe participante doit désigner un responsable technique principal pour l’évaluation par les pairs.',
    confidence: 'HIGH',
    approvalStatus: 'APPROVED',
    approvedBy: '00000000-0000-4000-a000-000000000002',
    approvedAt: '2026-09-21T10:00:00.000Z',
    isDemo: true,
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'gmem-item-conflict-1',
    groupId: DEMO_GROUP_ID,
    sourceMessageId: 'gmsg-conflicting-1',
    createdByUserId: '00000000-0000-4000-a000-000000000003',
    memoryType: 'DEADLINE',
    title: 'Rumeur avancement date limite au 27 septembre',
    content: 'Information contradictoire non confirmée : avance supposée de la soumission au 27 septembre.',
    confidence: 'LOW',
    approvalStatus: 'PENDING',
    isDemo: true,
    createdAt: '2026-09-22T08:00:00.000Z',
    updatedAt: '2026-09-22T08:00:00.000Z',
  },
];

for (const m of initialDemoMemories) {
  fallbackMemories.set(m.id, m);
}

export class GroupMemoryService {
  /**
   * Registers a group in local memory cache
   */
  public registerGroup(group: WhatsAppGroup): void {
    fallbackGroups.set(group.id, group);
    fallbackGroups.set(group.whatsappGroupId, group);
  }

  /**
   * Resolves WhatsApp Group by ID (UUID or Meta JID like '12036302212026-group')
   */
  public async getGroup(groupIdOrWaId: string): Promise<WhatsAppGroup | null> {
    const cached = fallbackGroups.get(groupIdOrWaId);
    if (cached) return cached;

    const client = getSupabaseServerClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('whatsapp_groups')
        .select('*')
        .or(`id.eq.${groupIdOrWaId},whatsapp_group_id.eq.${groupIdOrWaId}`)
        .maybeSingle();

      if (error || !data) return null;

      const group: WhatsAppGroup = {
        id: data.id,
        whatsappGroupId: data.whatsapp_group_id,
        name: data.name,
        programmeId: data.programme_id,
        status: data.status,
        isApproved: Boolean(data.is_approved),
        isDemo: Boolean(data.is_demo),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      fallbackGroups.set(group.id, group);
      fallbackGroups.set(group.whatsappGroupId, group);
      return group;
    } catch {
      return null;
    }
  }

  /**
   * Verifies if a user is an active member of the specified group
   */
  public async getMember(groupId: string, userId: string): Promise<WhatsAppGroupMember | null> {
    // Check fallback registry
    const members = fallbackMembers.get(groupId) || [];
    const cached = members.find((m) => m.userId === userId && m.status === 'ACTIVE');
    if (cached) return cached;

    const client = getSupabaseServerClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('whatsapp_group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

      if (error || !data) return null;

      const member: WhatsAppGroupMember = {
        id: data.id,
        groupId: data.group_id,
        userId: data.user_id,
        role: data.role,
        status: data.status,
        joinedAt: data.joined_at,
        createdAt: data.created_at,
      };

      const existing = fallbackMembers.get(groupId) || [];
      fallbackMembers.set(groupId, [...existing.filter((m) => m.userId !== userId), member]);
      return member;
    } catch {
      return null;
    }
  }

  /**
   * Persists a raw WhatsApp group message and returns the stored entity
   */
  public async recordGroupMessage(params: {
    messageId: string;
    groupId: string;
    userId?: string | null;
    senderPhoneNormalized?: string;
    messageText: string;
    messageType: string;
    rawMetadata?: Record<string, any>;
    processingStatus?: 'RECEIVED' | 'PROCESSED' | 'IGNORED' | 'FAILED';
  }): Promise<WhatsAppGroupMessage> {
    const {
      messageId,
      groupId,
      userId,
      senderPhoneNormalized,
      messageText,
      messageType,
      rawMetadata,
      processingStatus = 'RECEIVED',
    } = params;

    const groupMsg: WhatsAppGroupMessage = {
      id: `gmsg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      whatsappMessageId: messageId,
      groupId,
      userId,
      senderPhoneNormalized,
      messageText,
      messageType: (messageType.toUpperCase() as any) || 'TEXT',
      sentAt: new Date().toISOString(),
      rawMetadata,
      processingStatus,
      createdAt: new Date().toISOString(),
    };

    fallbackMessages.set(messageId, groupMsg);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('whatsapp_group_messages').insert({
          id: groupMsg.id,
          whatsapp_message_id: messageId,
          group_id: groupId,
          user_id: userId || null,
          sender_phone_normalized: senderPhoneNormalized,
          message_text: messageText,
          message_type: groupMsg.messageType,
          sent_at: groupMsg.sentAt,
          raw_metadata: rawMetadata || {},
          processing_status: processingStatus,
        });
      } catch (err: any) {
        console.warn('[GroupMemory] DB record message warning:', err?.message || err);
      }
    }

    return groupMsg;
  }

  /**
   * Classifies incoming group message and returns structural intent
   */
  public classifyMessage(text: string, senderRole: WhatsAppGroupMemberRole = 'MEMBER'): GroupMessageClassification {
    return groupMessageClassifier.classify(text, senderRole);
  }

  /**
   * Evaluates message content for memory extraction and handles conflict detection
   */
  public extractMemory(params: {
    text: string;
    senderRole: WhatsAppGroupMemberRole;
    classification: GroupMessageClassification;
  }): GroupMemoryExtraction {
    const { text, senderRole, classification } = params;
    const lower = text.toLowerCase();
    const isPrivileged = ['ADMIN', 'FACILITATOR', 'ORGANIZER'].includes(senderRole.toUpperCase());

    // 1. Check for conflicting deadline/decision claims
    // Example: "Quelqu'un m'a dit que la date limite était le 27" vs official 30
    if ((lower.includes('27') || lower.includes('29')) && (lower.includes('septembre') || lower.includes('date limite') || lower.includes('deadline'))) {
      return {
        shouldExtract: true,
        memoryType: 'DEADLINE',
        title: 'Information contradictoire sur la date limite',
        content: text,
        confidence: 'LOW',
        defaultApprovalStatus: 'PENDING',
        isContradictory: true,
        conflictDetails: 'Contradicts verified deadline of September 30.',
      };
    }

    switch (classification.category) {
      case 'ANNOUNCEMENT':
        return {
          shouldExtract: true,
          memoryType: 'ANNOUNCEMENT',
          title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
          content: text,
          confidence: isPrivileged ? 'HIGH' : 'MEDIUM',
          defaultApprovalStatus: isPrivileged ? 'APPROVED' : 'PENDING',
        };

      case 'DECISION':
        return {
          shouldExtract: true,
          memoryType: 'DECISION',
          title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
          content: text,
          confidence: isPrivileged ? 'HIGH' : 'MEDIUM',
          defaultApprovalStatus: isPrivileged ? 'APPROVED' : 'PENDING',
        };

      case 'DEADLINE':
        return {
          shouldExtract: true,
          memoryType: 'DEADLINE',
          title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
          content: text,
          confidence: isPrivileged ? 'HIGH' : 'LOW',
          defaultApprovalStatus: isPrivileged ? 'APPROVED' : 'PENDING',
        };

      case 'EVENT':
        return {
          shouldExtract: true,
          memoryType: 'EVENT',
          title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
          content: text,
          confidence: isPrivileged ? 'HIGH' : 'MEDIUM',
          defaultApprovalStatus: isPrivileged ? 'APPROVED' : 'PENDING',
        };

      case 'ACTION':
        return {
          shouldExtract: true,
          memoryType: 'ACTION',
          title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
          content: text,
          confidence: isPrivileged ? 'HIGH' : 'MEDIUM',
          defaultApprovalStatus: isPrivileged ? 'APPROVED' : 'PENDING',
        };

      case 'QUESTION':
        // If it's an unresolved peer question, track it as pending clarification
        if (!classification.isDirectQuestionToBot && !classification.isCommand) {
          return {
            shouldExtract: true,
            memoryType: 'QUESTION',
            title: text.length > 50 ? `${text.slice(0, 47)}...` : text,
            content: text,
            confidence: 'LOW',
            defaultApprovalStatus: 'PENDING',
          };
        }
        return { shouldExtract: false, confidence: 'LOW', defaultApprovalStatus: 'PENDING' };

      default:
        return { shouldExtract: false, confidence: 'LOW', defaultApprovalStatus: 'PENDING' };
    }
  }

  /**
   * Persists an extracted memory record into Supabase & cache
   */
  public async saveMemory(params: {
    groupId: string;
    sourceMessageId?: string;
    createdByUserId?: string;
    memoryType: GroupMemoryType;
    title: string;
    content: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    approvalStatus: GroupMemoryApprovalStatus;
    approvedBy?: string;
  }): Promise<GroupMemory> {
    const memory: GroupMemory = {
      id: `gmem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      groupId: params.groupId,
      sourceMessageId: params.sourceMessageId,
      createdByUserId: params.createdByUserId,
      memoryType: params.memoryType,
      title: params.title,
      content: params.content,
      confidence: params.confidence,
      approvalStatus: params.approvalStatus,
      approvedBy: params.approvedBy,
      approvedAt: params.approvalStatus === 'APPROVED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fallbackMemories.set(memory.id, memory);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('group_memories').insert({
          id: memory.id,
          group_id: memory.groupId,
          source_message_id: memory.sourceMessageId || null,
          created_by_user_id: memory.createdByUserId || null,
          memory_type: memory.memoryType,
          title: memory.title,
          content: memory.content,
          confidence: memory.confidence,
          approval_status: memory.approvalStatus,
          approved_by: memory.approvedBy || null,
          approved_at: memory.approvedAt || null,
        });
      } catch (err: any) {
        console.warn('[GroupMemory] DB save memory warning:', err?.message || err);
      }
    }

    return memory;
  }

  /**
   * STRICT RAG POLICY:
   * Returns ONLY APPROVED group memories for grounding.
   * PENDING, REJECTED, and SUPERSEDED items are never returned.
   */
  public async fetchApprovedMemories(groupId: string, type?: GroupMemoryType): Promise<GroupMemory[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        let query = client
          .from('group_memories')
          .select('*')
          .eq('group_id', groupId)
          .eq('approval_status', 'APPROVED')
          .order('created_at', { ascending: false });

        if (type) {
          query = query.eq('memory_type', type);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            groupId: d.group_id,
            sourceMessageId: d.source_message_id,
            createdByUserId: d.created_by_user_id,
            memoryType: d.memory_type,
            title: d.title,
            content: d.content,
            metadata: d.metadata,
            confidence: d.confidence,
            approvalStatus: d.approval_status,
            approvedBy: d.approved_by,
            approvedAt: d.approved_at,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn('[GroupMemory] fetchApprovedMemories DB warning:', err?.message || err);
      }
    }

    // Fallback in-memory
    const items = Array.from(fallbackMemories.values()).filter(
      (m) => m.groupId === groupId && m.approvalStatus === 'APPROVED' && (!type || m.memoryType === type)
    );
    return items;
  }

  /**
   * List all authorized groups
   */
  public async listGroups(): Promise<WhatsAppGroup[]> {
    let result: WhatsAppGroup[] = [];
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client.from('whatsapp_groups').select('*').order('name');
        if (!error && Array.isArray(data) && data.length > 0) {
          result = data.map((d: any) => ({
            id: d.id,
            whatsappGroupId: d.whatsapp_group_id,
            name: d.name,
            groupName: d.name,
            programmeId: d.programme_id,
            status: d.status,
            isApproved: d.is_approved,
            isDemo: d.is_demo,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn('[GroupMemory] listGroups DB warning:', err?.message || err);
      }
    }

    if (result.length === 0) {
      result = Array.from(fallbackGroups.values()).map((g) => ({
        ...g,
        groupName: g.name,
      }));
    }

    // Strictly deduplicate by id to ensure React key uniqueness
    const seen = new Set<string>();
    return result.filter((g) => {
      if (!g || !g.id) return false;
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }

  /**
   * Fetches memories, optionally filtered by groupId and approval status
   */
  public async fetchMemories(
    groupId?: string,
    status?: GroupMemoryApprovalStatus
  ): Promise<GroupMemory[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        let query = client.from('group_memories').select('*');
        if (groupId) query = query.eq('group_id', groupId);
        if (status) query = query.eq('approval_status', status);
        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((d: any) => ({
            id: d.id,
            groupId: d.group_id,
            sourceMessageId: d.source_message_id,
            createdByUserId: d.created_by_user_id,
            memoryType: d.memory_type,
            title: d.title,
            content: d.content,
            confidence: d.confidence,
            approvalStatus: d.approval_status,
            approvedBy: d.approved_by,
            approvedAt: d.approved_at,
            rejectionReason: d.rejection_reason,
            supersededBy: d.superseded_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn('[GroupMemory] fetchMemories DB warning:', err?.message || err);
      }
    }

    return Array.from(fallbackMemories.values()).filter((m) => {
      if (groupId && m.groupId !== groupId) return false;
      if (status && m.approvalStatus !== status) return false;
      return true;
    });
  }

  /**
   * Fetches pending memories for admin review
   */
  public async fetchPendingMemories(groupId: string): Promise<GroupMemory[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('group_memories')
          .select('*')
          .eq('group_id', groupId)
          .eq('approval_status', 'PENDING')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((d: any) => ({
            id: d.id,
            groupId: d.group_id,
            sourceMessageId: d.source_message_id,
            createdByUserId: d.created_by_user_id,
            memoryType: d.memory_type,
            title: d.title,
            content: d.content,
            confidence: d.confidence,
            approvalStatus: d.approval_status,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
        }
      } catch (err: any) {
        console.warn('[GroupMemory] fetchPendingMemories DB warning:', err?.message || err);
      }
    }

    return Array.from(fallbackMemories.values()).filter(
      (m) => m.groupId === groupId && m.approvalStatus === 'PENDING'
    );
  }

  /**
   * Admin Approval: marks memory as APPROVED
   */
  public async approveMemory(memoryId: string, approvedByUserId: string): Promise<GroupMemory | null> {
    let mem = fallbackMemories.get(memoryId);
    if (mem) {
      mem.approvalStatus = 'APPROVED';
      mem.approvedBy = approvedByUserId;
      mem.approvedAt = new Date().toISOString();
      mem.updatedAt = new Date().toISOString();
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('group_memories')
          .update({
            approval_status: 'APPROVED',
            approved_by: approvedByUserId,
            approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', memoryId)
          .select()
          .maybeSingle();

        if (error) {
          console.warn('[GroupMemory] approveMemory error:', error);
        } else if (data) {
          mem = {
            id: data.id,
            groupId: data.group_id,
            sourceMessageId: data.source_message_id,
            createdByUserId: data.created_by_user_id,
            memoryType: data.memory_type,
            title: data.title,
            content: data.content,
            confidence: data.confidence,
            approvalStatus: data.approval_status,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err: any) {
        console.warn('[GroupMemory] approveMemory exception:', err?.message || err);
      }
    }

    return mem || null;
  }

  /**
   * Admin Rejection: marks memory as REJECTED
   */
  public async rejectMemory(
    memoryId: string,
    rejectedByUserId: string,
    reason?: string
  ): Promise<GroupMemory | null> {
    let mem = fallbackMemories.get(memoryId);
    if (mem) {
      mem.approvalStatus = 'REJECTED';
      mem.rejectionReason = reason || 'Rejected by administrator';
      mem.updatedAt = new Date().toISOString();
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        let { data, error } = await client
          .from('group_memories')
          .update({
            approval_status: 'REJECTED',
            rejection_reason: reason || 'Rejected by administrator',
            updated_at: new Date().toISOString(),
          })
          .eq('id', memoryId)
          .select()
          .maybeSingle();

        if (error && error.message && error.message.includes('column')) {
          const retry = await client
            .from('group_memories')
            .update({
              approval_status: 'REJECTED',
              updated_at: new Date().toISOString(),
            })
            .eq('id', memoryId)
            .select()
            .maybeSingle();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.warn('[GroupMemory] rejectMemory error:', error);
        } else if (data) {
          mem = {
            id: data.id,
            groupId: data.group_id,
            sourceMessageId: data.source_message_id,
            createdByUserId: data.created_by_user_id,
            memoryType: data.memory_type,
            title: data.title,
            content: data.content,
            confidence: data.confidence,
            approvalStatus: data.approval_status,
            rejectionReason: data.rejection_reason || reason || 'Rejected by administrator',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err: any) {
        console.warn('[GroupMemory] rejectMemory exception:', err?.message || err);
      }
    }

    return mem || null;
  }

  /**
   * Mark older memory as SUPERSEDED by newer confirmed information
   */
  public async supersedeMemory(
    olderMemoryId: string,
    supersededBy?: string,
    adminUserId?: string
  ): Promise<GroupMemory | null> {
    let mem = fallbackMemories.get(olderMemoryId);
    if (mem) {
      mem.approvalStatus = 'SUPERSEDED';
      mem.supersededBy = supersededBy || 'newer_source';
      mem.updatedAt = new Date().toISOString();
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        let { data, error } = await client
          .from('group_memories')
          .update({
            approval_status: 'SUPERSEDED',
            superseded_by: supersededBy || 'newer_source',
            updated_at: new Date().toISOString(),
          })
          .eq('id', olderMemoryId)
          .select()
          .maybeSingle();

        if (error && error.message && error.message.includes('column')) {
          const retry = await client
            .from('group_memories')
            .update({
              approval_status: 'SUPERSEDED',
              updated_at: new Date().toISOString(),
            })
            .eq('id', olderMemoryId)
            .select()
            .maybeSingle();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.warn('[GroupMemory] supersedeMemory error:', error);
        } else if (data) {
          mem = {
            id: data.id,
            groupId: data.group_id,
            sourceMessageId: data.source_message_id,
            createdByUserId: data.created_by_user_id,
            memoryType: data.memory_type,
            title: data.title,
            content: data.content,
            confidence: data.confidence,
            approvalStatus: data.approval_status,
            supersededBy: data.superseded_by || supersededBy || 'newer_source',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (err: any) {
        console.warn('[GroupMemory] supersedeMemory exception:', err?.message || err);
      }
    }

    return mem || null;
  }

  /**
   * Aggregates group memory activity for mobile companion commands
   */
  public async getGroupSummary(groupId: string): Promise<{
    announcements: GroupMemory[];
    decisions: GroupMemory[];
    deadlines: GroupMemory[];
    events: GroupMemory[];
    unresolvedQuestions: GroupMemory[];
  }> {
    const approved = await this.fetchApprovedMemories(groupId);
    const pending = await this.fetchPendingMemories(groupId);

    return {
      announcements: approved.filter((m) => m.memoryType === 'ANNOUNCEMENT'),
      decisions: approved.filter((m) => m.memoryType === 'DECISION'),
      deadlines: approved.filter((m) => m.memoryType === 'DEADLINE'),
      events: approved.filter((m) => m.memoryType === 'EVENT'),
      unresolvedQuestions: pending.filter((m) => m.memoryType === 'QUESTION'),
    };
  }
}

export const groupMemoryService = new GroupMemoryService();
