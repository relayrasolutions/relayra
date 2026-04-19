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
    // Becomes true once initAuth has finished (success or failure). Until
    // then, onAuthStateChange events are ignored — otherwise the
    // INITIAL_SESSION event (which Supabase fires immediately after
    // subscribe) would race with initAuth's user fetch and flip loading to
    // false while user is still null, causing dashboards to redirect to
    // /login right after a successful login.
    let initialized = false;

    // Hard safety timeout: if initial auth check takes >5s, unblock UI.
    const safetyTimer = setTimeout(() => {
      if (!cancelled) {
        initialized = true;
        setLoading(false);
      }
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
          if (!cancelled && appUser) setUser(appUser);
          // If fetchAppUser returned null despite a valid session (network
          // blip, transient RLS issue), we DO NOT null-out user. Dashboards
          // will keep showing a spinner while the session exists; the user
          // can retry. Never auto-redirect to /login from a soft failure.
        }
      } catch {
        // Network / timeout — preserve existing state. Do NOT blank out
        // user/session here, because that would cause a redirect loop on
        // flaky networks. Real auth failures surface via the `error` branch
        // above or via explicit signOut().
      } finally {
        if (!cancelled) {
          initialized = true;
          clearTimeout(safetyTimer);
          setLoading(false);
        }
      }
    };

    initAuth();

    // onAuthStateChange handler — intentionally minimal.
    //
    // Two bugs this guards against:
    //
    // (1) BUG: Login → dashboard → bounce to /login. Root cause: Supabase
    //     fires INITIAL_SESSION immediately after subscribe. If we ran the
    //     handler before initAuth finished, loading would flip to false
    //     while user was still being fetched, and the dashboard redirect
    //     effect would fire. `initialized` prevents that.
    //
    // (2) BUG: Tab switch → logged out. Root cause: Supabase's
    //     autoRefreshToken uses the Page Visibility API. On tab focus it
    //     refreshes the token; if the refresh fails for any reason,
    //     Supabase emits SIGNED_OUT. We used to honor SIGNED_OUT here,
    //     which nuked state and bounced the user to /login. We now
    //     IGNORE SIGNED_OUT from this event stream entirely — the only
    //     paths that clear state are the explicit signOut() button and
    //     the 24-hour check on page load. A failed token refresh on tab
    //     focus can never log the user out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (cancelled) return;
      if (!initialized) return; // skip INITIAL_SESSION race

      try {
        if (event === 'SIGNED_IN') {
          // This only fires for real logins that happen after initial load
          // (e.g. a login that doesn't full-reload). The normal login flow
          // does window.location.href which re-runs initAuth on next load,
          // so this branch is a defensive fallback.
          setSession(s);
          setLoginTs(Date.now());
          if (s?.user) {
            const appUser = await fetchAppUser(s.user.id, s.user.email);
            if (!cancelled && appUser) setUser(appUser);
            supabase.from('users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('auth_id', s.user.id)
              .then(() => {}, () => {});
          }
        } else {
          // SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, PASSWORD_RECOVERY,
          // INITIAL_SESSION (if it sneaks past the initialized gate).
          // Update session object only. NEVER touch user state. NEVER
          // touch login timestamp. NEVER call setLoading — only initAuth
          // owns loading.
          if (s) setSession(s);
        }
      } catch {
        // Swallow — never let a failing handler clear state.
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
