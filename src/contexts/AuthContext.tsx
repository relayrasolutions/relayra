'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, AppUser } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  sessionExpired: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
  checkSession: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();

  const fetchAppUser = async (authId: string, userEmail?: string): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

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

      if (userEmail) {
        try {
          const { data: provisionedData, error: provisionError } = await supabase
            .rpc('auto_provision_user', {
              p_auth_id: authId,
              p_email: userEmail,
            });

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
          // Auto-provision failed
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      const appUser = await fetchAppUser(currentSession.user.id, currentSession.user.email);
      setUser(appUser);
    }
  };

  // Check if session is still valid — returns true if valid
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s?.user) {
        setSession(s);
        setSessionExpired(false);
        return true;
      }
      // No session — expired
      setSession(null);
      setUser(null);
      setSessionExpired(true);
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const appUser = await fetchAppUser(s.user.id, s.user.email);
        setUser(appUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSessionExpired(true);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        setSessionExpired(false);
      }

      if (s?.user) {
        const appUser = await fetchAppUser(s.user.id, s.user.email);
        setUser(appUser);
        if (event === 'SIGNED_IN') {
          setSessionExpired(false);
          await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('auth_id', s.user.id);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tab visibility handler — check session when user returns to tab
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      // Only check if we had a user (i.e., was logged in before)
      if (!user) return;

      const valid = await checkSession();
      if (!valid) {
        toast.error('Session expired, please login again');
        router.replace('/login');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, checkSession, router]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setSessionExpired(false);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, sessionExpired, signIn, signOut, refreshUser, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
