/**
 * Current User Service (Ask UniBot Phase 3.3)
 * Provides access to the authenticated Supabase user and their public profile.
 * Does not assume any hardcoded user identities.
 */

import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseClient';
import { UserProfile } from '../types';

let cachedProfile: UserProfile | null = null;

export async function getCurrentAuthUser(): Promise<User | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  } catch (err) {
    console.warn('getCurrentAuthUser exception:', err);
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch('/api/user/profile', { headers });
    if (res.ok) {
      const data = await res.json();
      if (data && data.email) {
        cachedProfile = data as UserProfile;
        return cachedProfile;
      }
    }
  } catch (err) {
    console.warn('getCurrentProfile fetch error:', err);
  }
  return cachedProfile;
}

export async function updateCurrentProfile(updates: Partial<UserProfile>): Promise<boolean> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      if (cachedProfile) {
        cachedProfile = { ...cachedProfile, ...updates };
      }
      return true;
    }
  } catch (err) {
    console.warn('updateCurrentProfile fetch error:', err);
  }
  return false;
}
