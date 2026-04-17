'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, AppUser, withTimeout } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
});

// ---------- 24-hour hard session limit ----------
// Regardless of Supabase's token refresh, we force a logout 24 hours after
// the user's last actual login. The timestamp lives in localStorage so it
// survives tab close. We only check this on page-load / initial auth — NOT
// on tab focus (see Issue 2 in the auth overhaul spec).
const LOGIN_TS_KEY = 'relayra_login_time';
const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getLoginTs(): number | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LOGIN_TS_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function setLoginTs(ts: number): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(LOGIN_TS_KEY, String(ts));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function clearLoginTs(): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(LOGIN_TS_KEY);
  } catch {
    // ignore
  }
}

export function isSessionExpired(): boolean {
  const ts = getLoginTs();
  if (ts === null) return false;
  return Date.now() - ts > SESSION_MAX_MS;
}

// ---------- User lookup ----------
async function fetchAppUser(authId: string, userEmail?: string): Promise<AppUser | null> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('users').select('*').eq('auth_id', authId).single(),
      5000,
      'User lookup',
    );

    if (!error && data) {
      return {
        id: data.id,
        authId: data.auth_id,
        email: data.email,
        role: data.role,
        schoolId: data.school_id,
        name: data.name,
        phone: data.phone,
        isActive: data.is_active,
      };
    }

    // No record found — try to auto-provision by email
    if (userEmail) {
      try {
        const { data: provisionedData, error: provisionError } = await withTimeout(
          supabase.rpc('auto_provision_user', { p_auth_id: authId, p_email: userEmail }),
          5000,
          'Auto-provision',
        );

        if (!provisionError && provisionedData && provisionedData.length > 0) {
          const pd = provisionedData[0];
          return {
            id: pd.id,
            authId: pd.auth_id,
            email: pd.email,
            role: pd.role,
            schoolId: pd.school_id,
            name: pd.name,
            phone: null,
            isActive: pd.is_active,
          };
        }
      } catch {
        // Auto-provision failed — fall through
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session: currentSession } } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'Session refresh',
      );
      if (currentSession?.user) {
        const appUser = await fetchAppUser(currentSession.user.id, currentSession.user.email);
        setUser(appUser);
      }
    } catch {
      // ignore — refreshUser is a best-effort call
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Hard safety timeout: if initial auth check takes >5s, unblock UI.
    // Dashboards will then redirect to /login on their own if user is null.
    const safetyTimer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        // 24-hour hard limit: if login timestamp is older than 24h, force sign-out
        if (isSessionExpired()) {
          try { await supabase.auth.signOut(); } catch {}
          clearLoginTs();
          if (!cancelled) {
            setSession(null);
            setUser(null);
          }
          return;
        }

        const { data: { session: s }, error } = await withTimeout(
          supabase.auth.getSession(),
          5000,
          'getSession',
        );
        if (cancelled) return;
        if (error) {
          // Stale/invalid session — clear silently
          try { await supabase.auth.signOut(); } catch {}
          clearLoginTs();
          setSession(null);
          setUser(null);
          return;
        }
        setSession(s);
        if (s?.user) {
          // Pre-existing session with no recorded login time — treat as fresh
          // so we don't surprise-logout users who signed in before this feature.
          if (getLoginTs() === null) setLoginTs(Date.now());

          const appUser = await fetchAppUser(s.user.id, s.user.email);
          if (!cancelled) setUser(appUser);
        }
      } catch {
        // Network / timeout — treat as signed out, but do NOT redirect from here.
        // The landing page is public and dashboards own their own redirect logic.
        if (!cancelled) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      try {
        setSession(s);

        if (s?.user) {
          // Record login timestamp only on real SIGNED_IN events.
          // TOKEN_REFRESHED preserves the original stamp.
          if (event === 'SIGNED_IN') {
            setLoginTs(Date.now());
          }

          const appUser = await fetchAppUser(s.user.id, s.user.email);
          if (!cancelled) setUser(appUser);

          if (event === 'SIGNED_IN') {
            // Fire-and-forget — never block auth state on this
            supabase.from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('auth_id', s.user.id)
              .then(() => {}, () => {});
          }
        } else {
          clearLoginTs();
          setUser(null);
        }
      } catch {
        // Swallow — never let auth state handler hang the UI
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000,
        'Sign in',
      );
      if (error) {
        // Map Supabase errors to user-friendly messages
        const msg = error.message || '';
        if (/invalid login credentials/i.test(msg)) {
          return { error: 'Invalid login credentials. Please check your email and password.' };
        }
        return { error: msg };
      }
      setLoginTs(Date.now());
      return { error: null };
    } catch (e: any) {
      const msg = e?.message || '';
      if (/timed out/i.test(msg) || /network/i.test(msg) || /fetch/i.test(msg)) {
        return { error: 'Connection error. Please check your internet and try again.' };
      }
      return { error: msg || 'Sign in failed. Please try again.' };
    }
  };

  const signOut = async () => {
    // Clear local state first so UI updates immediately
    clearLoginTs();
    setUser(null);
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
