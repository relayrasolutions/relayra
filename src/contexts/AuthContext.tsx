'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, AppUser } from '@/lib/supabase';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppUser = async (authId: string, userEmail?: string): Promise<AppUser | null> => {
    try {
      // First try to fetch existing record
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

      // If no record found and we have an email, try to auto-provision
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
          // Auto-provision failed, return null
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
      if (s?.user) {
        const appUser = await fetchAppUser(s.user.id, s.user.email);
        setUser(appUser);
        if (event === 'SIGNED_IN') {
          await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('auth_id', s.user.id);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
