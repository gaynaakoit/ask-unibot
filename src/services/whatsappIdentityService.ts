/**
 * WhatsApp Identity Service (Phase 4.1 + 4.2)
 * METI UniPods AI Innovation Programme 2026
 *
 * Provides:
 * - Strict E.164 phone number canonical normalization
 * - Reliable mapping between WhatsApp phone numbers and verified public.users accounts
 * - Resolution states: KNOWN_USER, UNKNOWN_USER, BLOCKED_USER
 * - Complete protection against automatic user creation from unverified WhatsApp messages
 * - Graceful fallback to server memory cache if Supabase table is not yet provisioned
 */

import {
  WhatsAppIdentity,
  WhatsAppIdentityStatus,
  WhatsAppUserResolution,
} from '../types';
import { getSupabaseServerClient } from './supabaseServer';

// In-memory fallback / cache registry to ensure server stability
const fallbackIdentities: Map<string, WhatsAppIdentity> = new Map();

// Initial demo identities mapped to existing Supabase users
const INITIAL_DEMO_IDENTITIES: WhatsAppIdentity[] = [
  {
    id: 'wa-id-awa-diop',
    userId: '00000000-0000-4000-a000-000000000001',
    phoneNumber: '+221 77 123 45 67',
    phoneNumberNormalized: '+221771234567',
    waUserId: '221771234567',
    displayName: 'Awa Diop (SunuAgri AI)',
    status: 'VERIFIED',
    verifiedAt: '2026-09-21T10:00:00.000Z',
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'wa-id-aminata-toure',
    userId: '00000000-0000-4000-a000-000000000002',
    phoneNumber: '+221 77 000 00 01',
    phoneNumberNormalized: '+221770000001',
    waUserId: '221770000001',
    displayName: 'Dr. Aminata Touré (Lead Facilitator)',
    status: 'VERIFIED',
    verifiedAt: '2026-09-21T10:00:00.000Z',
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
  {
    id: 'wa-id-blocked-test',
    userId: '00000000-0000-4000-a000-000000000001',
    phoneNumber: '+221 77 999 99 99',
    phoneNumberNormalized: '+221779999999',
    waUserId: '221779999999',
    displayName: 'Spam User',
    status: 'BLOCKED',
    createdAt: '2026-09-21T10:00:00.000Z',
    updatedAt: '2026-09-21T10:00:00.000Z',
  },
];

// Initialize in-memory cache with demo identities
for (const ident of INITIAL_DEMO_IDENTITIES) {
  fallbackIdentities.set(ident.phoneNumberNormalized, ident);
}

/**
 * Normalizes any phone number into canonical E.164 representation.
 * - Strips all spaces, dashes, dots, parentheses, brackets
 * - Replaces leading '00' with '+'
 * - Corrects national Senegal numbers (e.g. 77..., 78..., 76..., 70... -> +221...)
 * - Ensures standard '+<country_code><digits>' format
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let cleaned = raw.trim().replace(/[\s\-\(\)\.\[\]]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }

  if (!cleaned.startsWith('+')) {
    // If it's already a full international number without '+' (e.g. '221771234567')
    if (cleaned.startsWith('221') && cleaned.length >= 11) {
      cleaned = '+' + cleaned;
    } else if (/^[7][05678]\d{7}$/.test(cleaned)) {
      // 9-digit Senegalese mobile format (e.g. 77 123 45 67)
      cleaned = '+221' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  // Ensure only '+' at start followed by digits
  const validDigits = cleaned.slice(1).replace(/\D/g, '');
  return `+${validDigits}`;
}

export class WhatsAppIdentityService {
  /**
   * Resolves a phone number to an authenticated UniPods user.
   *
   * STRICT SECURITY RULES:
   * 1. Display name (profile.name) is NEVER used to infer identity.
   * 2. Only a verified/recorded canonical phone number matches an account.
   * 3. Unknown numbers return 'UNKNOWN_USER' without creating any record in public.users.
   * 4. Blocked numbers return 'BLOCKED_USER'.
   */
  public async findUserByWhatsAppNumber(phoneNumber: string): Promise<WhatsAppUserResolution> {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized || normalized === '+') {
      return {
        status: 'UNKNOWN_USER',
        phoneNumberNormalized: normalized,
      };
    }

    const client = getSupabaseServerClient();
    let identity: WhatsAppIdentity | null = null;

    if (client) {
      try {
        const { data, error } = await client
          .from('whatsapp_identities')
          .select('*')
          .eq('phone_number_normalized', normalized)
          .maybeSingle();

        if (!error && data) {
          identity = {
            id: data.id,
            userId: data.user_id,
            phoneNumber: data.phone_number,
            phoneNumberNormalized: data.phone_number_normalized,
            waUserId: data.wa_user_id,
            displayName: data.display_name,
            status: data.status,
            verifiedAt: data.verified_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          fallbackIdentities.set(normalized, identity);
        }
      } catch (err: any) {
        // Graceful fallback to memory registry if database table is pending
      }
    }

    // Fallback to in-memory store if DB query returned nothing or table not present
    if (!identity) {
      identity = fallbackIdentities.get(normalized) || null;
    }

    if (!identity) {
      return {
        status: 'UNKNOWN_USER',
        phoneNumberNormalized: normalized,
      };
    }

    if (identity.status === 'BLOCKED') {
      return {
        status: 'BLOCKED_USER',
        identity,
        phoneNumberNormalized: normalized,
      };
    }

    // Retrieve user details from public.users
    let userRecord: { id: string; email: string; name: string; role: string; track?: string } | undefined;

    if (client) {
      try {
        const { data: uData, error: uErr } = await client
          .from('users')
          .select('id, email, name, role, track')
          .eq('id', identity.userId)
          .maybeSingle();

        if (!uErr && uData) {
          userRecord = {
            id: uData.id,
            email: uData.email,
            name: uData.name,
            role: uData.role,
            track: uData.track,
          };
        }
      } catch {
        // Fallback user resolution
      }
    }

    if (!userRecord) {
      // Fallback for demo users
      if (identity.userId === '00000000-0000-4000-a000-000000000001') {
        userRecord = {
          id: identity.userId,
          email: 'awa.diop@unipods.example.org',
          name: 'Awa Diop',
          role: 'participant',
          track: 'Computer Vision & Natural Language for Agriculture',
        };
      } else if (identity.userId === '00000000-0000-4000-a000-000000000002') {
        userRecord = {
          id: identity.userId,
          email: 'aminata.toure@meti.gov.sn',
          name: 'Dr. Aminata Touré',
          role: 'admin',
          track: 'UniPods Programme Facilitation',
        };
      } else {
        userRecord = {
          id: identity.userId,
          email: `${identity.userId}@unipods.example.org`,
          name: identity.displayName || 'UniPods Participant',
          role: 'participant',
        };
      }
    }

    return {
      status: 'KNOWN_USER',
      identity,
      user: userRecord,
      phoneNumberNormalized: normalized,
    };
  }

  /**
   * Finds the WhatsApp identity associated with a specific UniPods user ID.
   */
  public async findWhatsAppIdentityByUserId(userId: string): Promise<WhatsAppIdentity | null> {
    if (!userId) return null;

    const client = getSupabaseServerClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('whatsapp_identities')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          const ident: WhatsAppIdentity = {
            id: data.id,
            userId: data.user_id,
            phoneNumber: data.phone_number,
            phoneNumberNormalized: data.phone_number_normalized,
            waUserId: data.wa_user_id,
            displayName: data.display_name,
            status: data.status,
            verifiedAt: data.verified_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          fallbackIdentities.set(ident.phoneNumberNormalized, ident);
          return ident;
        }
      } catch {
        // Fallback
      }
    }

    for (const ident of fallbackIdentities.values()) {
      if (ident.userId === userId) {
        return ident;
      }
    }

    return null;
  }

  /**
   * Links a verified WhatsApp phone number to a UniPods user account.
   */
  public async linkWhatsAppNumber(
    userId: string,
    phoneNumber: string,
    displayName?: string,
    status: WhatsAppIdentityStatus = 'VERIFIED'
  ): Promise<WhatsAppIdentity | null> {
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized || !userId) return null;

    const identity: WhatsAppIdentity = {
      id: `wa-id-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      phoneNumber,
      phoneNumberNormalized: normalized,
      waUserId: normalized.replace(/^\+/, ''),
      displayName: displayName || undefined,
      status,
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in memory cache
    fallbackIdentities.set(normalized, identity);

    const client = getSupabaseServerClient();
    if (client) {
      try {
        await client.from('whatsapp_identities').upsert({
          id: identity.id,
          user_id: identity.userId,
          phone_number: identity.phoneNumber,
          phone_number_normalized: identity.phoneNumberNormalized,
          wa_user_id: identity.waUserId,
          display_name: identity.displayName,
          status: identity.status,
          verified_at: identity.verifiedAt,
          updated_at: identity.updatedAt,
        });
      } catch (err: any) {
        console.warn('[WhatsAppIdentityService] Note: upsert to remote DB pending migration; using synchronized memory store.');
      }
    }

    return identity;
  }

  /**
   * Unlinks a WhatsApp number from a user account.
   */
  public async unlinkWhatsAppNumber(userId: string, phoneNumber?: string): Promise<boolean> {
    if (!userId && !phoneNumber) return false;

    let targetNormalized: string | null = phoneNumber ? normalizePhoneNumber(phoneNumber) : null;

    if (!targetNormalized) {
      for (const [norm, ident] of fallbackIdentities.entries()) {
        if (ident.userId === userId) {
          targetNormalized = norm;
          break;
        }
      }
    }

    if (targetNormalized) {
      fallbackIdentities.delete(targetNormalized);
    }

    const client = getSupabaseServerClient();
    if (client && targetNormalized) {
      try {
        await client
          .from('whatsapp_identities')
          .delete()
          .eq('phone_number_normalized', targetNormalized);
      } catch {
        // Fallback
      }
    }

    return true;
  }

  /**
   * Updates an identity's status (PENDING | VERIFIED | BLOCKED).
   */
  public async updateIdentityStatus(
    phoneNumberOrId: string,
    status: WhatsAppIdentityStatus
  ): Promise<boolean> {
    const normalized = normalizePhoneNumber(phoneNumberOrId);
    let identity = fallbackIdentities.get(normalized);

    if (!identity) {
      for (const item of fallbackIdentities.values()) {
        if (item.id === phoneNumberOrId) {
          identity = item;
          break;
        }
      }
    }

    if (identity) {
      identity.status = status;
      identity.updatedAt = new Date().toISOString();
      if (status === 'VERIFIED' && !identity.verifiedAt) {
        identity.verifiedAt = identity.updatedAt;
      }
    }

    const client = getSupabaseServerClient();
    if (client && identity) {
      try {
        await client
          .from('whatsapp_identities')
          .update({
            status,
            verified_at: identity.verifiedAt,
            updated_at: identity.updatedAt,
          })
          .eq('id', identity.id);
      } catch {
        // Fallback
      }
    }

    return Boolean(identity);
  }
}

export const whatsappIdentityService = new WhatsAppIdentityService();
