'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, formatCurrency, timeAgo, formatDate, withTimeout } from '@/lib/supabase';
import { useAuth, isSessionExpired, clearLoginTs } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface School {
  id: string; name: string; slug: string; city: string; state: string;
  subscriptionTier: string; subscriptionStatus: string; studentSlab: string;
  studentCount: number; collectionRate: number; totalCollected: number;
  totalPending: number; messageCount: number; lastLoginAt: string | null;
  activeParents: number; contactEmail: string; createdAt: string;
  deliveryRate: number;
}

interface PlatformStats {
  totalSchools: number; activeSchools: number; trialSchools: number; expiredSchools: number;
  totalStudents: number; totalFeeCollected: number; totalFeePending: number;
  totalMessages: number; mrr: number; mrrGrowth: number;
  trialConversionRate: number; atRiskCount: number;
}

const PLAN_PRICES: Record<string, number> = {
  starter: 399900, growth: 599900, pro: 999900, enterprise: 1999900,
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', pro: 'Pro', enterprise: 'Enterprise',
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [mrrChartData, setMrrChartData] = useState<any[]>([]);
  const [topSchoolsData, setTopSchoolsData] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', city: '', state: 'Uttar Pradesh', board: 'CBSE', principalName: '',
    contactPhone: '', contactEmail: '', subscriptionTier: 'starter',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [adding, setAdding] = useState(false);
  const [loadingStale, setLoadingStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (user?.role !== 'super_admin') { if (!silent) setLoading(false); return; }
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [schoolsRes, studentsRes, feesRes, messagesRes, usersRes, activityRes] = await withTimeout(
        Promise.all([
          supabase.from('schools').select('*').order('created_at', { ascending: false }),
          supabase.from('students').select('id, school_id, status'),
          supabase.from('fee_records').select('school_id, paid_amount, total_amount, status, payment_date'),
          supabase.from('messages').select('id, school_id, delivered_count, sent_count, created_at, type'),
          supabase.from('users').select('id, school_id, last_login_at, role').neq('role', 'super_admin'),
          supabase.from('activity_log').select('id, action, description, entity_type, created_at, school_id').order('created_at', { ascending: false }).limit(20),
        ]),
        15000,
        'Admin data fetch',
      );

      const studentsBySchool: Record<string, number> = {};
      (studentsRes.data || []).filter(s => s.status === 'active').forEach(s => {
        studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] || 0) + 1;
      });

      const feeBySchool: Record<string, { collected: number; total: number; pending: number }> = {};
      (feesRes.data || []).forEach(f => {
        if (!feeBySchool[f.school_id]) feeBySchool[f.school_id] = { collected: 0, total: 0, pending: 0 };
        feeBySchool[f.school_id].collected += f.paid_amount;
        feeBySchool[f.school_id].total += f.total_amount;
        if (f.status !== 'paid' && f.status !== 'waived') {
          feeBySchool[f.school_id].pending += (f.total_amount - f.paid_amount);
        }
      });

      const messagesBySchool: Record<string, { total: number; delivered: number }> = {};
      (messagesRes.data || []).forEach(m => {
        if (!messagesBySchool[m.school_id]) messagesBySchool[m.school_id] = { total: 0, delivered: 0 };
        messagesBySchool[m.school_id].total += (m.sent_count || 0);
        messagesBySchool[m.school_id].delivered += (m.delivered_count || 0);
      });

      const lastLoginBySchool: Record<string, string | null> = {};
      const parentCountBySchool: Record<string, number> = {};
      (usersRes.data || []).forEach(u => {
        if (u.school_id) {
          if (!lastLoginBySchool[u.school_id] || (u.last_login_at && u.last_login_at > (lastLoginBySchool[u.school_id] || ''))) {
            lastLoginBySchool[u.school_id] = u.last_login_at;
          }
          parentCountBySchool[u.school_id] = (parentCountBySchool[u.school_id] || 0) + 1;
        }
      });

      const mapped: School[] = (schoolsRes.data || []).map(s => {
        const msgData = messagesBySchool[s.id] || { total: 0, delivered: 0 };
        return {
          id: s.id, name: s.name, slug: s.slug || '', city: s.city || '-', state: s.state || '-',
          subscriptionTier: s.subscription_tier, subscriptionStatus: s.subscription_status,
          studentSlab: s.student_slab, contactEmail: s.contact_email || '',
          studentCount: studentsBySchool[s.id] || 0,
          collectionRate: feeBySchool[s.id]?.total > 0 ? Math.round((feeBySchool[s.id].collected / feeBySchool[s.id].total) * 100) : 0,
          totalCollected: feeBySchool[s.id]?.collected || 0,
          totalPending: feeBySchool[s.id]?.pending || 0,
          messageCount: msgData.total,
          deliveryRate: msgData.total > 0 ? Math.round((msgData.delivered / msgData.total) * 100) : 0,
          lastLoginAt: lastLoginBySchool[s.id] || null,
          activeParents: parentCountBySchool[s.id] || 0,
          createdAt: s.created_at,
        };
      });
      setSchools(mapped);

      const totalFeeCollected = (feesRes.data || []).reduce((s, f) => s + f.paid_amount, 0);
      const totalFeePending = (feesRes.data || []).filter(f => f.status !== 'paid' && f.status !== 'waived').reduce((s, f) => s + (f.total_amount - f.paid_amount), 0);
      const activeSchools = mapped.filter(s => s.subscriptionStatus === 'active');
      const trialSchools = mapped.filter(s => s.subscriptionStatus === 'trial');
      const expiredSchools = mapped.filter(s => s.subscriptionStatus === 'expired');
      const mrr = activeSchools.reduce((sum, s) => sum + (PLAN_PRICES[s.subscriptionTier] || 0), 0);

      setStats({
        totalSchools: mapped.length,
        activeSchools: activeSchools.length,
        trialSchools: trialSchools.length,
        expiredSchools: expiredSchools.length,
        totalStudents: (studentsRes.data || []).filter(s => s.status === 'active').length,
        totalFeeCollected, totalFeePending,
        totalMessages: (messagesRes.data || []).length,
        mrr,
        mrrGrowth: 0,
        trialConversionRate: (trialSchools.length + activeSchools.length) > 0
          ? Math.round((activeSchools.length / (trialSchools.length + activeSchools.length)) * 100) : 0,
        atRiskCount: mapped.filter(s => s.lastLoginAt && new Date().getTime() - new Date(s.lastLoginAt).getTime() > 7 * 86400000).length,
      });

      // MRR chart (show current MRR as last 6 months projection from active schools)
      const chart = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const monthFees = (feesRes.data || []).filter(f => f.payment_date && f.payment_date >= mStart && f.payment_date <= mEnd).reduce((s, f) => s + f.paid_amount, 0);
        chart.push({ month: monthName, revenue: Math.round(monthFees / 100) });
      }
      setMrrChartData(chart);

      // Top schools by messages
      const schoolMsgCounts = mapped.filter(s => s.messageCount > 0).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
      setTopSchoolsData(schoolMsgCounts.map(s => ({ name: s.name.length > 18 ? s.name.slice(0, 18) + '...' : s.name, messages: s.messageCount })));

      // Activity log
      const schoolNames: Record<string, string> = {};
      mapped.forEach(s => { schoolNames[s.id] = s.name; });
      setActivityLog((activityRes.data || []).map(a => ({
        id: a.id, action: a.action, description: a.description, time: a.created_at,
        schoolName: a.school_id ? schoolNames[a.school_id] || '' : 'Platform',
      })));

      setLastUpdated(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      if (!silent) setError(err.message || 'Failed to load data. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 24-hour hard session check on mount — if the recorded login time is
  // older than 24h, force sign-out and redirect. No visibility listener: we
  // never check auth on tab focus (that would log users out for network
  // blips or idle tabs). See Issues 2 & 8 in the auth overhaul spec.
  useEffect(() => {
    if (isSessionExpired()) {
      clearLoginTs();
      supabase.auth.signOut().finally(() => router.replace('/login'));
    }
  }, [router]);

  // Back/Forward cache protection — if the user navigates here via the
  // browser's bfcache (back/forward button), force a reload so stale data
  // and stale auth state are discarded. See Issue 3 in the spec.
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (!loading) { setLoadingStale(false); return; }
    const timer = setTimeout(() => setLoadingStale(true), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleAddSchool = async () => {
    if (!addForm.name || !addForm.adminEmail || !addForm.adminName || !addForm.adminPassword) {
      toast.error('Please fill all required fields'); return;
    }
    setAdding(true);
    try {
      const slug = addForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: schoolData, error: schoolError } = await supabase.from('schools').insert({
        name: addForm.name, slug, city: addForm.city, state: addForm.state,
        board: addForm.board, principal_name: addForm.principalName,
        contact_phone: addForm.contactPhone, contact_email: addForm.contactEmail,
        subscription_tier: addForm.subscriptionTier, subscription_status: 'trial',
      }).select().single();
      if (schoolError) throw schoolError;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: addForm.adminEmail, password: addForm.adminPassword,
        options: { data: { full_name: addForm.adminName, role: 'school_admin' } },
      });
      if (signUpError) throw signUpError;
      if (signUpData.user) {
        await supabase.from('users').insert({
          auth_id: signUpData.user.id, email: addForm.adminEmail, name: addForm.adminName,
          role: 'school_admin', school_id: schoolData.id,
        });
      }
      toast.success('School added successfully');
      setShowAddSchool(false);
      setAddForm({ name: '', city: '', state: 'Uttar Pradesh', board: 'CBSE', principalName: '', contactPhone: '', contactEmail: '', subscriptionTier: 'starter', adminName: '', adminEmail: '', adminPassword: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add school');
    } finally { setAdding(false); }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <AppLayout><div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  if (user.role !== 'super_admin') {
    return <AppLayout><div className="text-center py-12"><p className="text-[#64748B]">Access denied. Super admin only.</p></div></AppLayout>;
  }

  const filteredSchools = schools.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && s.subscriptionStatus !== filterStatus) return false;
    return true;
  });

  const getActionIcon = (action: string) => {
    const map: Record<string, string> = { student_added: 'UserPlusIcon', fee_created: 'BanknotesIcon', payment_received: 'CheckCircleIcon', message_sent: 'ChatBubbleLeftIcon', attendance_marked: 'ClipboardDocumentCheckIcon' };
    return map[action] || 'InformationCircleIcon';
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (s === 'trial') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  };

  const planColor = (t: string) => {
    const m: Record<string, string> = { starter: 'bg-slate-50 text-slate-600', growth: 'bg-blue-50 text-blue-700', pro: 'bg-purple-50 text-purple-700', enterprise: 'bg-amber-50 text-amber-700' };
    return m[t] || 'bg-slate-50 text-slate-600';
  };

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 focus:border-[#0D9488] transition-colors";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">Platform Overview</h1>
            {lastUpdated && <p className="text-[#94A3B8] text-xs mt-0.5">Last updated: {lastUpdated}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> All systems operational
            </span>
            <button onClick={() => setShowAddSchool(true)} className="bg-[#0D9488] text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A70] transition-colors flex items-center gap-1.5">
              <Icon name="PlusIcon" size={16} className="text-white" /> Add School
            </button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon name="ExclamationTriangleIcon" size={40} className="text-amber-400 mb-3" />
            <p className="text-[#1E293B] font-semibold mb-1">Failed to load data</p>
            <p className="text-[#64748B] text-sm mb-4">{error}</p>
            <button onClick={() => { setError(null); fetchData(); }} className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-[#0B7A70]">Retry</button>
          </div>
        ) : loading ? (
          loadingStale ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-[#64748B] mb-4">Data is taking longer than expected to load.</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg">Reload</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl p-5 border border-[#E2E8F0] animate-pulse"><div className="h-3 bg-gray-200 rounded w-24 mb-3" /><div className="h-7 bg-gray-200 rounded w-16 mb-2" /><div className="h-2.5 bg-gray-100 rounded w-32" /></div>)}
            </div>
          )
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">Monthly Revenue (MRR)</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1.5">{formatCurrency(stats?.mrr || 0)}</p>
                <p className="text-[#94A3B8] text-xs mt-1">From {stats?.activeSchools || 0} active plans</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">Active Schools</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1.5">{stats?.activeSchools || 0}</p>
                <p className="text-[#94A3B8] text-xs mt-1">{stats?.trialSchools || 0} trial &middot; {stats?.expiredSchools || 0} expired</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">Trial Conversion</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1.5">{stats?.trialConversionRate || 0}%</p>
                <p className="text-[#94A3B8] text-xs mt-1">{stats?.activeSchools || 0} of {(stats?.activeSchools || 0) + (stats?.trialSchools || 0)} converted</p>
              </div>
              <div className={`bg-white rounded-xl p-5 border ${(stats?.atRiskCount || 0) > 0 ? 'border-amber-200' : 'border-[#E2E8F0]'}`}>
                <p className="text-[#64748B] text-xs font-medium uppercase tracking-wide">At-Risk Schools</p>
                <p className={`text-2xl font-bold mt-1.5 ${(stats?.atRiskCount || 0) > 0 ? 'text-amber-600' : 'text-[#1E293B]'}`}>{stats?.atRiskCount || 0}</p>
                <p className="text-[#94A3B8] text-xs mt-1">No login in 7+ days</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Revenue Trend (6 Months)</h3>
                {mrrChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mrrChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">No revenue data yet</div>}
              </div>
              <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Top Schools by Messages</h3>
                {topSchoolsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={topSchoolsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} width={120} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Bar dataKey="messages" fill="#0D9488" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">No message data yet</div>}
              </div>
            </div>

            {/* Activity + Schools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Activity Feed */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Platform Activity</h3>
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-[#94A3B8] text-sm">No recent activity</div>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto">
                    {activityLog.map(a => (
                      <div key={a.id} className="flex items-start gap-2.5">
                        <div className="w-7 h-7 bg-[#F1F5F9] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon name={getActionIcon(a.action)} size={14} className="text-[#64748B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#1E293B]">{a.description || a.action.replace(/_/g, ' ')}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {a.schoolName && <span className="text-[11px] text-[#94A3B8]">{a.schoolName}</span>}
                            <span className="text-[11px] text-[#CBD5E1]">{timeAgo(a.time)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Schools Table */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0]">
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#1E293B]">All Schools ({filteredSchools.length})</h3>
                  <div className="flex items-center gap-2">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0D9488] w-40" />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0D9488]">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="trial">Trial</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                </div>

                {filteredSchools.length === 0 ? (
                  <div className="p-12 text-center">
                    <Icon name="BuildingOfficeIcon" size={36} className="text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-[#1E293B] font-medium mb-1">No schools found</p>
                    <p className="text-[#94A3B8] text-sm mb-4">{searchQuery || filterStatus ? 'Try a different search or filter' : 'Add your first school to get started'}</p>
                    {!searchQuery && !filterStatus && (
                      <button onClick={() => setShowAddSchool(true)} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-medium">Add First School</button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#E2E8F0]">
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">School</th>
                          <th className="text-left px-3 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Students</th>
                          <th className="text-left px-3 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Plan</th>
                          <th className="text-left px-3 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">Status</th>
                          <th className="text-left px-3 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide hidden lg:table-cell">Delivery %</th>
                          <th className="text-left px-3 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide hidden lg:table-cell">MRR</th>
                          <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSchools.map(s => (
                          <tr key={s.id} className="border-b border-[#F1F5F9] last:border-0 hover:bg-[#FAFBFC] transition-colors">
                            <td className="px-5 py-3">
                              <p className="text-sm font-medium text-[#1E293B]">{s.name}</p>
                              <p className="text-[11px] text-[#94A3B8]">{s.city} &middot; Joined {formatDate(s.createdAt)}</p>
                            </td>
                            <td className="px-3 py-3 text-sm text-[#1E293B]">{s.studentCount}</td>
                            <td className="px-3 py-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${planColor(s.subscriptionTier)}`}>{PLAN_LABELS[s.subscriptionTier] || s.subscriptionTier}</span></td>
                            <td className="px-3 py-3"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(s.subscriptionStatus)}`}>{s.subscriptionStatus}</span></td>
                            <td className="px-3 py-3 hidden lg:table-cell">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${s.deliveryRate >= 90 ? 'bg-emerald-500' : s.deliveryRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.deliveryRate}%` }} />
                                </div>
                                <span className="text-xs text-[#64748B]">{s.deliveryRate}%</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-[#1E293B] hidden lg:table-cell">{formatCurrency(PLAN_PRICES[s.subscriptionTier] || 0)}</td>
                            <td className="px-5 py-3 text-right">
                              <button onClick={async () => {
                                const newStatus = s.subscriptionStatus === 'active' ? 'expired' : 'active';
                                await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', s.id);
                                toast.success(`School ${newStatus}`); fetchData();
                              }} className="text-[#0D9488] text-xs font-medium hover:underline">
                                {s.subscriptionStatus === 'active' ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add School Modal */}
      {showAddSchool && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E293B]">Add New School</h2>
              <button onClick={() => setShowAddSchool(false)} className="text-[#94A3B8] hover:text-[#64748B]">
                <Icon name="XMarkIcon" size={20} className="text-[#94A3B8]" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">School Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'School Name *', key: 'name' }, { label: 'City', key: 'city' },
                    { label: 'State', key: 'state' }, { label: 'Board', key: 'board' },
                    { label: 'Principal Name', key: 'principalName' }, { label: 'Contact Phone', key: 'contactPhone' },
                    { label: 'Contact Email', key: 'contactEmail' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">{f.label}</label>
                      <input type="text" value={(addForm as any)[f.key]} onChange={e => setAddForm(f2 => ({ ...f2, [f.key]: e.target.value }))} className={inputClass} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Plan</label>
                    <select value={addForm.subscriptionTier} onChange={e => setAddForm(f => ({ ...f, subscriptionTier: e.target.value }))} className={inputClass}>
                      {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">First Admin User</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Admin Name *', key: 'adminName', type: 'text' },
                    { label: 'Admin Email *', key: 'adminEmail', type: 'email' },
                    { label: 'Admin Password *', key: 'adminPassword', type: 'password' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-[#64748B] mb-1">{f.label}</label>
                      <input type={f.type} value={(addForm as any)[f.key]} onChange={e => setAddForm(f2 => ({ ...f2, [f.key]: e.target.value }))} className={inputClass} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-6 py-4 flex gap-3">
              <button onClick={() => setShowAddSchool(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-[#F8FAFC]">Cancel</button>
              <button onClick={handleAddSchool} disabled={adding} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A70] disabled:opacity-60">{adding ? 'Adding...' : 'Add School'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
