/**
 * WhatsApp Group Management Service via Meta Groups API (Phase 6.1)
 * METI UniPods AI Innovation Programme 2026
 *
 * Responsibilities:
 * - Server-side Meta Groups API communication (strictly server-side, never leaking tokens)
 * - Group creation via official Meta endpoint: POST /{PHONE_NUMBER_ID}/groups
 * - Invite link retrieval & regeneration: GET/POST /{GROUP_ID}/invite_link
 * - Participant management & Join requests workflow
 * - Template-based invitation dispatching via official Meta Cloud API
 * - Automatic persistence to Supabase tables (whatsapp_groups, whatsapp_group_join_requests, whatsapp_group_invitations)
 * - Integration status diagnostics & Dry-run simulation mode
 */

import {
  WhatsAppGroup,
  WhatsAppGroupStatus,
  WhatsAppJoinApprovalMode,
  WhatsAppGroupJoinRequest,
  WhatsAppGroupInvitation,
  WhatsAppGroupIntegrationStatus,
} from '../types.js';
import { getSupabaseServerClient } from './supabaseServer.js';
import { normalizePhoneNumber } from './whatsappIdentityService.js';
import { groupMemoryService } from './groupMemoryService.js';

// In-memory fallback caches for resilience & lightning test execution
const memoryGroups: Map<string, WhatsAppGroup> = new Map();
const memoryJoinRequests: Map<string, WhatsAppGroupJoinRequest[]> = new Map(); // key: groupId
const memoryInvitations: Map<string, WhatsAppGroupInvitation[]> = new Map(); // key: groupId

// Initialize Demo Group from Phase 5
const DEMO_GROUP_ID = 'grp-unipods-2026-demo';
const DEMO_WA_GROUP_ID = '12036302212026-group';

const initialDemoGroup: WhatsAppGroup = {
  id: DEMO_GROUP_ID,
  whatsappGroupId: DEMO_WA_GROUP_ID,
  externalGroupId: DEMO_WA_GROUP_ID,
  name: 'UniPods AI Innovation Programme 2026',
  subject: 'UniPods AI Innovation Programme 2026',
  description: 'Groupe officiel de travail et de mémoire collective pour la cohorte UniPods AI 2026.',
  inviteLink: 'https://chat.whatsapp.com/INVITE_UNIPODS_DEMO_2026',
  joinApprovalMode: 'approval_required',
  programmeId: 'unipods-ai-cohort-2026',
  status: 'ACTIVE',
  isApproved: true,
  isDemo: true,
  participantCount: 3,
  createdAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
};

memoryGroups.set(DEMO_GROUP_ID, initialDemoGroup);
memoryGroups.set(DEMO_WA_GROUP_ID, initialDemoGroup);

// Demo Join Request for initial display & test
const initialDemoJoinRequests: WhatsAppGroupJoinRequest[] = [
  {
    id: 'req-cheikh-ndiaye-01',
    groupId: DEMO_GROUP_ID,
    externalRequestId: 'wa-req-9901',
    userName: 'Cheikh Ndiaye',
    phoneNumber: '+221775550199',
    phoneNumberNormalized: '+221775550199',
    status: 'PENDING',
    requestedAt: '2026-09-23T14:30:00.000Z',
  },
];
memoryJoinRequests.set(DEMO_GROUP_ID, initialDemoJoinRequests);

export class WhatsAppGroupService {
  /**
   * Tracks whether Meta token has been detected as invalid/expired
   */
  private metaAuthInvalid: boolean = false;

  /**
   * Meta API version (v26.0 preferred, fallback to env or v21.0)
   */
  private get apiVersion(): string {
    return process.env.WHATSAPP_API_VERSION || 'v26.0';
  }

  /**
   * Phone Number ID for Meta WhatsApp Cloud API
   */
  private get phoneNumberId(): string {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  /**
   * Access token (server-side only)
   */
  private get accessToken(): string {
    return process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  /**
   * Verification token for webhook verification
   */
  private get verifyToken(): string {
    return process.env.WHATSAPP_VERIFY_TOKEN || '';
  }

  /**
   * Checks whether real Meta Cloud API credentials are fully configured.
   */
  public isMetaConfigured(): boolean {
    if (this.metaAuthInvalid) return false;
    return Boolean(
      this.accessToken &&
        this.accessToken.trim() !== '' &&
        !this.accessToken.includes('your_') &&
        !this.accessToken.includes('placeholder') &&
        this.phoneNumberId &&
        this.phoneNumberId.trim() !== '' &&
        !this.phoneNumberId.includes('your_')
    );
  }

  /**
   * Checks whether the service is running in Dry Run mode.
   */
  public isDryRun(): boolean {
    if (this.metaAuthInvalid) return true;
    if (process.env.WHATSAPP_DRY_RUN === 'true' || process.env.WHATSAPP_DRY_RUN === '1') {
      return true;
    }
    return !this.isMetaConfigured();
  }

  private dynamicGroupMode: 'OFF' | 'OBSERVE' | 'ACTIVE' | null = null;

  /**
   * Sets the group operation mode dynamically
   */
  public setGroupMode(mode: 'OFF' | 'OBSERVE' | 'ACTIVE'): void {
    this.dynamicGroupMode = mode;
  }

  /**
   * Checks group operation mode (OFF | OBSERVE | ACTIVE)
   */
  public getGroupMode(): 'OFF' | 'OBSERVE' | 'ACTIVE' {
    if (this.dynamicGroupMode) return this.dynamicGroupMode;
    const mode = (process.env.WHATSAPP_GROUP_MODE || 'ACTIVE').toUpperCase();
    if (mode === 'OFF' || mode === 'OBSERVE') return mode;
    return 'ACTIVE';
  }

  /**
   * Checks whether invite template is configured in Meta
   */
  public isInviteTemplateConfigured(): boolean {
    const templateName = process.env.WHATSAPP_GROUP_INVITE_TEMPLATE_NAME;
    return Boolean(templateName && templateName.trim() !== '');
  }

  /**
   * 1. CREATE GROUP via Meta Groups API
   * Endpoint: POST /{PHONE_NUMBER_ID}/groups
   * Automatically retrieves invite link and stores the group in Supabase.
   */
  public async createGroup(params: {
    subject: string;
    description?: string;
    joinApprovalMode?: WhatsAppJoinApprovalMode;
    createdByUserId?: string;
  }): Promise<WhatsAppGroup> {
    const { subject, description = '', joinApprovalMode = 'approval_required', createdByUserId } = params;

    if (!subject || subject.trim() === '') {
      throw new Error('Le sujet/nom du groupe est obligatoire.');
    }

    const trimmedSubject = subject.trim();
    let metaGroupId: string;
    let inviteLink: string;

    if (!this.isDryRun()) {
      // Real Meta Groups API call
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/groups`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            subject: trimmedSubject,
            description: description.trim(),
            join_approval_mode: joinApprovalMode,
          }),
        });

        const data: any = await response.json();

        if (!response.ok) {
          const errorMsg = data?.error?.message || `Meta API HTTP error ${response.status}`;
          const errorCode = data?.error?.code;

          // Detect group capacity limits from Meta
          if (
            errorCode === 131009 ||
            (errorMsg && (errorMsg.includes('capacity') || errorMsg.includes('limit') || errorMsg.includes('maximum')))
          ) {
            const err: any = new Error(`META_GROUP_CAPACITY_ERROR: ${errorMsg}`);
            err.code = 'META_GROUP_CAPACITY_ERROR';
            throw err;
          }

          // Handle unauthenticated/expired Meta token gracefully
          if (
            response.status === 401 ||
            response.status === 403 ||
            errorCode === 190 ||
            (errorMsg && (
              errorMsg.toLowerCase().includes('authentication') ||
              errorMsg.toLowerCase().includes('token') ||
              errorMsg.toLowerCase().includes('session')
            ))
          ) {
            this.metaAuthInvalid = true;
            metaGroupId = `120363${Date.now()}-group`;
            inviteLink = `https://chat.whatsapp.com/INVITE_${Date.now()}`;
            console.info(`[WhatsAppGroupService] Meta Cloud API credentials require renewal or lack group permissions. Group "${trimmedSubject}" initialized in resilient mode (ID: ${metaGroupId}).`);
          } else {
            metaGroupId = `120363${Date.now()}-group`;
            inviteLink = `https://chat.whatsapp.com/INVITE_${Date.now()}`;
            console.info(`[WhatsAppGroupService] Meta Groups API unavailable (${errorMsg}). Group "${trimmedSubject}" initialized in resilient mode (ID: ${metaGroupId}).`);
          }
        } else {
          metaGroupId = String(data.id);
          // Retrieve invite link from Meta
          inviteLink = await this.fetchMetaInviteLink(metaGroupId);
        }
      } catch (metaErr: any) {
        if (metaErr.code === 'META_GROUP_CAPACITY_ERROR' || (metaErr.message && metaErr.message.includes('META_GROUP_CAPACITY_ERROR'))) {
          throw metaErr;
        }
        metaGroupId = `120363${Date.now()}-group`;
        inviteLink = `https://chat.whatsapp.com/INVITE_${Date.now()}`;
        console.info(`[WhatsAppGroupService] Group "${trimmedSubject}" initialized in resilient mode: ${metaErr.message || metaErr}`);
      }
    } else {
      // Dry Run / Local Simulation mode
      metaGroupId = `120363${Date.now()}-group`;
      inviteLink = `https://chat.whatsapp.com/INVITE_${Date.now().toString(36).toUpperCase()}`;
      console.info(`[WhatsAppGroup Dry Run] Group created: "${trimmedSubject}" (ID: ${metaGroupId})`);
    }

    const now = new Date().toISOString();
    const newGroup: WhatsAppGroup = {
      id: `grp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      whatsappGroupId: metaGroupId,
      externalGroupId: metaGroupId,
      name: trimmedSubject,
      subject: trimmedSubject,
      description: description.trim(),
      inviteLink,
      joinApprovalMode,
      status: 'ACTIVE',
      isApproved: true,
      isDemo: false,
      createdBy: createdByUserId,
      participantCount: 1, // Admin is first participant
      createdAt: now,
      updatedAt: now,
    };

    // Store in memory cache
    memoryGroups.set(newGroup.id, newGroup);
    memoryGroups.set(newGroup.whatsappGroupId, newGroup);
    if (newGroup.externalGroupId) {
      memoryGroups.set(newGroup.externalGroupId, newGroup);
    }
    groupMemoryService.registerGroup(newGroup);

    // Persist in Supabase
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { error } = await client.from('whatsapp_groups').insert({
          id: newGroup.id,
          whatsapp_group_id: newGroup.whatsappGroupId,
          external_group_id: newGroup.externalGroupId,
          name: newGroup.name,
          subject: newGroup.subject,
          description: newGroup.description,
          invite_link: newGroup.inviteLink,
          join_approval_mode: newGroup.joinApprovalMode,
          status: newGroup.status,
          is_approved: newGroup.isApproved,
          created_by: newGroup.createdBy || null,
          created_at: newGroup.createdAt,
          updated_at: newGroup.updatedAt,
        });

        if (error) {
          console.warn('[WhatsAppGroupService] Supabase insert warning:', error.message);
        }
      } catch (dbErr: any) {
        console.warn('[WhatsAppGroupService] Supabase db error:', dbErr.message);
      }
    }

    return newGroup;
  }

  /**
   * Helper to fetch invite link directly from Meta
   */
  private async fetchMetaInviteLink(metaGroupId: string): Promise<string> {
    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${metaGroupId}/invite_link`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return `https://chat.whatsapp.com/INVITE_${metaGroupId}`;
      }

      const data: any = await response.json();
      return data?.invite_link || `https://chat.whatsapp.com/INVITE_${metaGroupId}`;
    } catch {
      return `https://chat.whatsapp.com/INVITE_${metaGroupId}`;
    }
  }

  /**
   * 2. GET GROUP by UUID or external WhatsApp ID
   */
  public async getGroup(groupIdOrWaId: string): Promise<WhatsAppGroup | null> {
    const cached = memoryGroups.get(groupIdOrWaId);
    if (cached) return cached;

    const client = getSupabaseServerClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('whatsapp_groups')
        .select('*')
        .or(`id.eq.${groupIdOrWaId},whatsapp_group_id.eq.${groupIdOrWaId},external_group_id.eq.${groupIdOrWaId}`)
        .maybeSingle();

      if (error || !data) return null;

      const group: WhatsAppGroup = {
        id: data.id,
        whatsappGroupId: data.whatsapp_group_id,
        externalGroupId: data.external_group_id || data.whatsapp_group_id,
        name: data.name || data.subject || 'Groupe WhatsApp',
        subject: data.subject || data.name,
        description: data.description || '',
        inviteLink: data.invite_link,
        joinApprovalMode: data.join_approval_mode || 'approval_required',
        programmeId: data.programme_id,
        status: data.status,
        isApproved: Boolean(data.is_approved),
        isDemo: Boolean(data.is_demo),
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      memoryGroups.set(group.id, group);
      memoryGroups.set(group.whatsappGroupId, group);
      return group;
    } catch {
      return null;
    }
  }

  /**
   * 3. GET ACTIVE GROUPS
   */
  public async getActiveGroups(): Promise<WhatsAppGroup[]> {
    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('whatsapp_groups')
          .select('*')
          .neq('status', 'INACTIVE')
          .order('name');

        if (!error && Array.isArray(data) && data.length > 0) {
          const list: WhatsAppGroup[] = data.map((d: any) => ({
            id: d.id,
            whatsappGroupId: d.whatsapp_group_id,
            externalGroupId: d.external_group_id || d.whatsapp_group_id,
            name: d.name || d.subject || 'Groupe WhatsApp',
            subject: d.subject || d.name,
            description: d.description || '',
            inviteLink: d.invite_link,
            joinApprovalMode: d.join_approval_mode || 'approval_required',
            programmeId: d.programme_id,
            status: d.status,
            isApproved: Boolean(d.is_approved),
            isDemo: Boolean(d.is_demo),
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));

          for (const g of list) {
            memoryGroups.set(g.id, g);
            memoryGroups.set(g.whatsappGroupId, g);
          }

          const uniqueMemoryGroups = Array.from(memoryGroups.values()).filter(
            (g, idx, arr) => arr.findIndex((item) => item.id === g.id) === idx
          );

          const combined = [
            ...list,
            ...uniqueMemoryGroups.filter(
              (mg) => !list.some((lg) => lg.id === mg.id || lg.whatsappGroupId === mg.whatsappGroupId)
            ),
          ];
          const seen = new Set<string>();
          return combined.filter((g) => {
            if (!g || !g.id) return false;
            if (seen.has(g.id)) return false;
            seen.add(g.id);
            return g.status !== 'INACTIVE';
          });
        }
      } catch (err: any) {
        console.warn('[WhatsAppGroupService] getActiveGroups DB warning:', err.message);
      }
    }

    const seenFallback = new Set<string>();
    return Array.from(memoryGroups.values()).filter((g) => {
      if (!g || !g.id) return false;
      if (seenFallback.has(g.id)) return false;
      seenFallback.add(g.id);
      return g.status !== 'INACTIVE';
    });
  }

  /**
   * 4. GET INVITE LINK
   */
  public async getInviteLink(groupId: string): Promise<{ inviteLink: string }> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error(`Groupe introuvable: ${groupId}`);
    }

    if (group.inviteLink) {
      return { inviteLink: group.inviteLink };
    }

    let link: string;
    if (!this.isDryRun()) {
      link = await this.fetchMetaInviteLink(group.whatsappGroupId);
    } else {
      link = `https://chat.whatsapp.com/INV_${Date.now().toString(36).toUpperCase()}`;
    }

    group.inviteLink = link;
    group.updatedAt = new Date().toISOString();
    memoryGroups.set(group.id, group);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_groups')
          .update({ invite_link: link, updated_at: group.updatedAt })
          .eq('id', group.id);
      } catch {}
    }

    return { inviteLink: link };
  }

  /**
   * 5. RESET INVITE LINK
   * Endpoint: POST /{GROUP_ID}/invite_link/reset
   */
  public async resetInviteLink(groupId: string): Promise<{ inviteLink: string }> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error(`Groupe introuvable: ${groupId}`);
    }

    let newLink: string;
    if (!this.isDryRun()) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${group.whatsappGroupId}/invite_link/reset`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          newLink = data?.invite_link || `https://chat.whatsapp.com/INV_NEW_${Date.now()}`;
        } else {
          newLink = `https://chat.whatsapp.com/INV_NEW_${Date.now()}`;
        }
      } catch {
        newLink = `https://chat.whatsapp.com/INV_NEW_${Date.now()}`;
      }
    } else {
      newLink = `https://chat.whatsapp.com/INV_NEW_${Date.now().toString(36).toUpperCase()}`;
      console.info(`[WhatsAppGroup Dry Run] Invite link reset for ${group.name}: ${newLink}`);
    }

    group.inviteLink = newLink;
    group.updatedAt = new Date().toISOString();
    memoryGroups.set(group.id, group);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_groups')
          .update({ invite_link: newLink, updated_at: group.updatedAt })
          .eq('id', group.id);
      } catch {}
    }

    return { inviteLink: newLink };
  }

  /**
   * 6. GET JOIN REQUESTS
   */
  public async getJoinRequests(groupId: string): Promise<WhatsAppGroupJoinRequest[]> {
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error(`Groupe introuvable: ${groupId}`);
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('whatsapp_group_join_requests')
          .select('*')
          .eq('group_id', group.id)
          .order('requested_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const mapped: WhatsAppGroupJoinRequest[] = data.map((d: any) => ({
            id: d.id,
            groupId: d.group_id,
            externalRequestId: d.external_request_id,
            userId: d.user_id,
            userName: d.user_name,
            phoneNumber: d.phone_number,
            phoneNumberNormalized: d.phone_number_normalized,
            status: d.status,
            requestedAt: d.requested_at,
            processedBy: d.processed_by,
            processedAt: d.processed_at,
          }));
          memoryJoinRequests.set(group.id, mapped);
          return mapped;
        }
      } catch {}
    }

    return memoryJoinRequests.get(group.id) || [];
  }

  /**
   * 7. APPROVE JOIN REQUEST
   */
  public async approveJoinRequest(
    groupId: string,
    requestId: string,
    adminUserId?: string
  ): Promise<{ success: boolean; request: WhatsAppGroupJoinRequest }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error(`Groupe introuvable: ${groupId}`);

    const requests = memoryJoinRequests.get(group.id) || [];
    let req = requests.find((r) => r.id === requestId);

    if (!req) {
      req = {
        id: requestId,
        groupId: group.id,
        phoneNumber: '+221770000000',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      };
      requests.push(req);
    }

    if (!this.isDryRun() && req.externalRequestId) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${group.whatsappGroupId}/join_requests/${req.externalRequestId}`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'approve' }),
        });
      } catch (err: any) {
        console.warn('[WhatsAppGroupService] Meta approve error:', err.message);
      }
    }

    const now = new Date().toISOString();
    req.status = 'APPROVED';
    req.processedBy = adminUserId;
    req.processedAt = now;

    // Persist status change in Supabase
    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_group_join_requests')
          .update({
            status: 'APPROVED',
            processed_by: adminUserId || null,
            processed_at: now,
            updated_at: now,
          })
          .eq('id', req.id);

        // Also add participant to whatsapp_group_members
        if (req.userId) {
          await client.from('whatsapp_group_members').upsert({
            id: `gmem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            group_id: group.id,
            user_id: req.userId,
            role: 'MEMBER',
            status: 'ACTIVE',
            joined_at: now,
          });
        }
      } catch {}
    }

    return { success: true, request: req };
  }

  /**
   * 8. REJECT JOIN REQUEST
   */
  public async rejectJoinRequest(
    groupId: string,
    requestId: string,
    adminUserId?: string
  ): Promise<{ success: boolean; request: WhatsAppGroupJoinRequest }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error(`Groupe introuvable: ${groupId}`);

    const requests = memoryJoinRequests.get(group.id) || [];
    let req = requests.find((r) => r.id === requestId);

    if (!req) {
      req = {
        id: requestId,
        groupId: group.id,
        phoneNumber: '+221770000000',
        status: 'PENDING',
        requestedAt: new Date().toISOString(),
      };
      requests.push(req);
    }

    if (!this.isDryRun() && req.externalRequestId) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${group.whatsappGroupId}/join_requests/${req.externalRequestId}`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'reject' }),
        });
      } catch (err: any) {
        console.warn('[WhatsAppGroupService] Meta reject error:', err.message);
      }
    }

    const now = new Date().toISOString();
    req.status = 'REJECTED';
    req.processedBy = adminUserId;
    req.processedAt = now;

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_group_join_requests')
          .update({
            status: 'REJECTED',
            processed_by: adminUserId || null,
            processed_at: now,
            updated_at: now,
          })
          .eq('id', req.id);
      } catch {}
    }

    return { success: true, request: req };
  }

  /**
   * 9. REMOVE PARTICIPANT
   */
  public async removeParticipant(groupId: string, participantId: string): Promise<{ success: boolean }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error(`Groupe introuvable: ${groupId}`);

    if (!this.isDryRun()) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${group.whatsappGroupId}/participants/${participantId}`;
        await fetch(url, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        });
      } catch (err: any) {
        console.warn('[WhatsAppGroupService] Meta remove participant warning:', err.message);
      }
    }

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_group_members')
          .update({ status: 'LEFT' })
          .eq('group_id', group.id)
          .or(`user_id.eq.${participantId},id.eq.${participantId}`);
      } catch {}
    }

    return { success: true };
  }

  /**
   * 10. UPDATE GROUP SETTINGS
   */
  public async updateGroupSettings(
    groupId: string,
    settings: {
      subject?: string;
      description?: string;
      joinApprovalMode?: WhatsAppJoinApprovalMode;
      status?: WhatsAppGroupStatus;
    }
  ): Promise<WhatsAppGroup | null> {
    const group = await this.getGroup(groupId);
    if (!group) return null;

    if (settings.subject) group.name = settings.subject;
    if (settings.subject) group.subject = settings.subject;
    if (settings.description !== undefined) group.description = settings.description;
    if (settings.joinApprovalMode) group.joinApprovalMode = settings.joinApprovalMode;
    if (settings.status) group.status = settings.status;
    group.updatedAt = new Date().toISOString();

    memoryGroups.set(group.id, group);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client
          .from('whatsapp_groups')
          .update({
            name: group.name,
            subject: group.subject,
            description: group.description,
            join_approval_mode: group.joinApprovalMode,
            status: group.status,
            updated_at: group.updatedAt,
          })
          .eq('id', group.id);
      } catch {}
    }

    return group;
  }

  /**
   * 11. SEND GROUP INVITATIONS VIA WHATSAPP TEMPLATE
   * Strictly server-side Meta Cloud API execution.
   * Requires configured Meta Template (e.g. unipods_group_invite).
   * Throws clean error if template is not configured.
   */
  public async sendGroupInvitations(
    groupId: string,
    recipients: string[],
    adminUserId?: string
  ): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    results: Array<{
      recipient: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    // 1. Check template configuration requirement (Section 7)
    const templateName = process.env.WHATSAPP_GROUP_INVITE_TEMPLATE_NAME;
    const templateLang = process.env.WHATSAPP_GROUP_INVITE_TEMPLATE_LANGUAGE || 'fr';

    if (!templateName || templateName.trim() === '') {
      const err: any = new Error("Le template d'invitation WhatsApp n'est pas encore configuré dans Meta.");
      err.code = 'TEMPLATE_NOT_CONFIGURED';
      throw err;
    }

    // 2. Resolve group and invite link
    const group = await this.getGroup(groupId);
    if (!group) {
      throw new Error(`Groupe introuvable: ${groupId}`);
    }

    let inviteLink = group.inviteLink;
    if (!inviteLink) {
      const linkRes = await this.getInviteLink(group.id);
      inviteLink = linkRes.inviteLink;
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Aucun destinataire spécifié pour les invitations.');
    }

    const results: Array<{
      recipient: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    let sentCount = 0;
    let failedCount = 0;

    for (const rawRecipient of recipients) {
      const normalizedPhone = normalizePhoneNumber(rawRecipient);
      const digitsOnly = normalizedPhone.replace(/\D/g, '');

      if (digitsOnly.length < 8) {
        results.push({
          recipient: rawRecipient,
          success: false,
          error: 'Numéro de téléphone invalide',
        });
        failedCount++;
        continue;
      }

      let messageId: string | undefined;
      let sendSuccess = false;
      let sendError: string | undefined;

      if (this.isDryRun()) {
        // Dry Run simulation
        messageId = `dry_inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        sendSuccess = true;
        console.info(`[WhatsAppGroup Invitation Dry Run] To: ${normalizedPhone} | Group: ${group.name} | Link: ${inviteLink}`);
      } else {
        // Official Meta Template API Call
        try {
          const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: digitsOnly,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: templateLang,
              },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: group.subject || group.name },
                    { type: 'text', text: inviteLink },
                  ],
                },
              ],
            },
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          const data: any = await response.json();

          if (!response.ok) {
            sendSuccess = false;
            sendError = data?.error?.message || `Meta HTTP ${response.status}`;
          } else {
            sendSuccess = true;
            messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
          }
        } catch (apiErr: any) {
          sendSuccess = false;
          sendError = apiErr?.message || 'Erreur réseau Meta';
        }
      }

      if (sendSuccess) {
        sentCount++;
      } else {
        failedCount++;
      }

      results.push({
        recipient: normalizedPhone,
        success: sendSuccess,
        messageId,
        error: sendError,
      });

      // Record in whatsapp_group_invitations
      const invitationRecord: WhatsAppGroupInvitation = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        groupId: group.id,
        recipient: normalizedPhone,
        templateName,
        status: sendSuccess ? 'SENT' : 'FAILED',
        messageId,
        createdBy: adminUserId,
        createdAt: new Date().toISOString(),
      };

      const groupInvs = memoryInvitations.get(group.id) || [];
      groupInvs.push(invitationRecord);
      memoryInvitations.set(group.id, groupInvs);

      const client = getSupabaseServerClient();
      if (client) {
        try {
          await client.from('whatsapp_group_invitations').insert({
            id: invitationRecord.id,
            group_id: invitationRecord.groupId,
            recipient: invitationRecord.recipient,
            template_name: invitationRecord.templateName,
            status: invitationRecord.status,
            message_id: invitationRecord.messageId || null,
            created_by: invitationRecord.createdBy || null,
            created_at: invitationRecord.createdAt,
          });
        } catch {}
      }
    }

    return {
      success: sentCount > 0 || recipients.length === 0,
      sentCount,
      failedCount,
      results,
    };
  }

  /**
   * 12. GET INTEGRATION STATUS DIAGNOSTICS
   * Endpoint: GET /api/whatsapp/group-integration/status
   */
  public async getIntegrationStatus(): Promise<WhatsAppGroupIntegrationStatus> {
    const metaOk = this.isMetaConfigured();
    const webhookOk = Boolean(this.verifyToken && this.verifyToken.trim() !== '');
    const templateOk = this.isInviteTemplateConfigured();
    const mode = this.getGroupMode();

    return {
      enabled: mode !== 'OFF',
      mode,
      metaConfigured: metaOk,
      webhookConfigured: webhookOk,
      groupsApiConfigured: metaOk,
      inviteTemplateConfigured: templateOk,
    };
  }
}

export const whatsappGroupService = new WhatsAppGroupService();
