'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, withTimeout } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing in...');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn, user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated — use replace so back button doesn't return here
  useEffect(() => {
    if (!authLoading && authUser) {
      if (authUser.role === 'super_admin') router.replace('/admin');
      else if (authUser.role === 'school_staff') router.replace('/teacher');
      else router.replace('/dashboard');
    }
  }, [authLoading, authUser, router]);

  // Hard 10s timeout on the sign-in flow. If still loading after 10s, bail out.
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      toast.error('Login timed out. Please try again.');
    }, 10000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    setLoadingMessage('Signing in...');

    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error || 'Invalid credentials');
      setLoading(false);
      return;
    }

    setLoadingMessage('Loading your profile...');

    try {
      // Get the authenticated session (timed)
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        5000,
        'Session fetch',
      );
      if (!session?.user) {
        toast.error('Session not found. Please try again.');
        setLoading(false);
        return;
      }

      const authUserId = session.user.id;
      const userEmail = session.user.email || email;

      // Try to fetch existing user record (timed)
      let userData: { role: string; school_id: string | null; name: string } | null = null;
      try {
        const { data, error: fetchError } = await withTimeout(
          supabase.from('users').select('role, school_id, name').eq('auth_id', authUserId).single(),
          5000,
          'User lookup',
        );
        if (!fetchError && data) userData = data as typeof userData;
      } catch (e) {
        console.error('User lookup failed:', e);
      }

      // If no record found, auto-provision via RPC
      if (!userData) {
        setLoadingMessage('Setting up your account...');
        try {
          const { data: provisionedData, error: provisionError } = await withTimeout(
            supabase.rpc('auto_provision_user', { p_auth_id: authUserId, p_email: userEmail }),
            5000,
            'Auto-provision',
          );
          if (!provisionError && provisionedData && provisionedData.length > 0) {
            userData = provisionedData[0];
          }
        } catch (e) {
          console.error('Auto-provision failed:', e);
        }

        // Fallback: direct upsert based on known demo emails
        if (!userData) {
          const roleMap: Record<string, { role: string; name: string }> = {
            'admin@relayrasolutions.com': { role: 'super_admin', name: 'Relayra Admin' },
            'admin@dps-moradabad.com': { role: 'school_admin', name: 'DPS Admin' },
            'teacher.7a@dps-moradabad.com': { role: 'school_staff', name: 'Class 7-A Teacher' },
          };

          const mapped = roleMap[userEmail.toLowerCase()];
          if (mapped) {
            let schoolId: string | null = null;
            if (mapped.role !== 'super_admin') {
              try {
                const { data: schoolData } = await withTimeout(
                  supabase.from('schools').select('id').eq('slug', 'dps-moradabad').single(),
                  5000,
                  'School lookup',
                );
                schoolId = schoolData?.id || null;
              } catch { /* ignore */ }
            }

            try {
              await withTimeout(
                supabase.from('users').upsert({
                  auth_id: authUserId,
                  email: userEmail,
                  role: mapped.role,
                  name: mapped.name,
                  school_id: schoolId,
                  assigned_class: userEmail === 'teacher.7a@dps-moradabad.com' ? '7' : null,
                  assigned_section: userEmail === 'teacher.7a@dps-moradabad.com' ? 'A' : null,
                  is_active: true,
                }, { onConflict: 'auth_id' }),
                5000,
                'User upsert',
              );
              userData = { role: mapped.role, school_id: schoolId, name: mapped.name };
            } catch (e) {
              console.error('Fallback upsert failed:', e);
            }
          }
        }

        if (!userData) {
          toast.error('Login failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      setLoadingMessage('Redirecting...');

      // Redirect based on role — use replace so back button won't return to login
      if (userData.role === 'super_admin') {
        router.replace('/admin');
      } else if (userData.role === 'school_staff') {
        router.replace('/teacher');
      } else {
        router.replace('/dashboard');
      }
    } catch (err) {
      console.error('Login redirect error:', err);
      toast.error('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        10000,
        'Password reset',
      );
      if (error) toast.error(error.message);
      else toast.success('Password reset email sent!');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] to-[#0D9488] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A5F] rounded-2xl mb-4">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.05 12.05 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Relayra Solutions</h1>
          <p className="text-[#64748B] text-sm mt-1">School Operations Dashboard</p>
        </div>

        {/* Account access info */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 text-xs text-slate-600">
          <p>School administrators: Use the credentials provided by your Relayra account manager.</p>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="mb-6 bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-[#0D9488] flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-teal-700 font-medium">{loadingMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#1E293B] text-sm"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1E293B] mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] text-[#1E293B] text-sm pr-12"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B]"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingMessage}
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={handleForgotPassword}
            disabled={forgotLoading || loading}
            className="text-[#0D9488] text-sm hover:underline disabled:opacity-60"
          >
            {forgotLoading ? 'Sending...' : 'Forgot Password?'}
          </button>
        </div>
      </div>
    </div>
  );
}
