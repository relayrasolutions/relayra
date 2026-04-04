'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing in...');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    setLoadingMessage('Signing in...');

    console.log('[Login] Step 1: Calling Supabase Auth signInWithPassword for:', email);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      console.error('[Login] Step 1 FAILED — signIn returned error:', signInError);
      toast.error(signInError || 'Invalid credentials');
      setLoading(false);
      return;
    }

    console.log('[Login] Step 1 SUCCESS — Supabase Auth login succeeded');
    setLoadingMessage('Loading your profile...');

    try {
      // Step 2: Get the authenticated session to retrieve UUID
      console.log('[Login] Step 2: Getting session to retrieve auth UUID...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[Login] Step 2 FAILED — getSession error:', sessionError);
        toast.error('Session error. Please try again.');
        setLoading(false);
        return;
      }

      if (!session?.user) {
        console.error('[Login] Step 2 FAILED — No session/user found after successful login');
        toast.error('Session not found. Please try again.');
        setLoading(false);
        return;
      }

      const authUserId = session.user.id;
      const userEmail = session.user.email || email;
      console.log('[Login] Step 2 SUCCESS — Auth UUID:', authUserId, '| Email:', userEmail);

      // Step 3: Use SECURITY DEFINER RPC to find/create user record (bypasses RLS)
      console.log('[Login] Step 3: Calling upsert_user_on_login RPC for auth_id =', authUserId);
      setLoadingMessage('Setting up your account...');

      const { data: rpcData, error: rpcError } = await supabase
        .rpc('upsert_user_on_login', {
          p_auth_id: authUserId,
          p_email: userEmail,
        });

      console.log('[Login] Step 3 RPC result — data:', rpcData, '| error:', rpcError);

      if (rpcError) {
        console.error('[Login] Step 3 RPC FAILED:', rpcError);
        toast.error('Could not load user profile. Please contact support.');
        setLoading(false);
        return;
      }

      const userData = rpcData && rpcData.length > 0 ? rpcData[0] : null;

      if (!userData) {
        console.error('[Login] Step 3 — RPC returned empty result');
        toast.error('User profile not found. Please contact support.');
        setLoading(false);
        return;
      }

      console.log('[Login] Step 3 SUCCESS — User resolved. Role:', userData.role);

      // Step 4: Redirect based on role
      setLoadingMessage('Redirecting...');
      console.log('[Login] Step 4: Redirecting. Role =', userData.role);

      if (userData.role === 'super_admin') {
        console.log('[Login] Step 4 → Redirecting to /admin');
        router.push('/admin');
      } else if (userData.role === 'school_staff') {
        console.log('[Login] Step 4 → Redirecting to /teacher');
        router.push('/teacher');
      } else {
        console.log('[Login] Step 4 → Redirecting to /dashboard');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('[Login] Unexpected error in post-login flow:', err);
      toast.error('Login succeeded but redirect failed. Please refresh.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent!');
    }
    setForgotLoading(false);
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

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-xs text-blue-700">
          <p className="font-semibold mb-1">Demo Credentials:</p>
          <p>Super Admin: admin@relayrasolutions.com / Relayra@2026</p>
          <p>School Admin: admin@dps-moradabad.com / Demo@1234</p>
          <p>Teacher: teacher.7a@dps-moradabad.com / Teacher@1234</p>
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
