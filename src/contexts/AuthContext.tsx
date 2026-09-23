/**
 * Supabase Auth Context (Phase 3.3)
 * Manages authenticated user session, role, and profile with Supabase.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/supabaseClient';
import { UserProfile } from '../types';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string, track?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInAsDemo: (demoType: 'awa' | 'admin' | 'user_b') => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = getSupabaseClient();

  const fetchProfile = useCallback(async (token?: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/user/profile', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.email) {
          setProfile(data as UserProfile);
          return;
        }
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. Check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.access_token) {
        fetchProfile(existingSession.access_token).finally(() => setLoading(false));
      } else {
        // Automatically sign in as default demo participant if no active session
        // so judges and users have an immediate, zero-friction experience
        signInAsDemo('awa').finally(() => setLoading(false));
      }
    }).catch((err) => {
      console.warn('getSession error:', err);
      setLoading(false);
    });

    // 2. Listen to Auth State Changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.access_token) {
        await fetchProfile(newSession.access_token);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      setUser(data.user);
      setSession(data.session);
      if (data.session?.access_token) {
        await fetchProfile(data.session.access_token);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Authentication failed' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    track: string = 'General AI Track'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, track }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data?.error || 'Registration failed' };
      }
      // Log in immediately after registration
      return await signIn(email, password);
    } catch (err: any) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  const signOut = async (): Promise<void> => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const signInAsDemo = async (demoType: 'awa' | 'admin' | 'user_b'): Promise<{ success: boolean; error?: string }> => {
    if (demoType === 'awa') {
      return signIn('awa.diop@unipods.example.org', 'UniPodsParticipant2026!');
    } else if (demoType === 'admin') {
      return signIn('aminata.toure@meti.gov.sn', 'AdminUniPods2026!');
    } else {
      return signIn('user.b@unipods.example.org', 'UniPodsParticipant2026!');
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (session?.access_token) {
      await fetchProfile(session.access_token);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...updates, ...updated } : updated));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('updateProfile error:', e);
      return false;
    }
  };

  const isAdmin = profile?.role === 'admin' || profile?.role === 'programme_directorate';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAdmin,
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
