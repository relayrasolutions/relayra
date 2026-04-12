'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, formatCurrency, timeAgo } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface School {
  id: string; name: string; slug: string; city: string; state: string;
  subscriptionTier: string; subscriptionStatus: string; studentSlab: string;
  studentCount: number; collectionRate: number; totalCollected: number;
  totalPending: number; messageCount: number; lastLoginAt: string | null;
  activeParents: number; contactEmail: string;
}

interface PlatformStats {
  totalSchools: number; activeSchools: number; trialSchools: number;
  totalStudents: number; totalFeeCollected: number; totalFeePending: number;
  totalMessages: number; mrr: number;
}

interface AlertItem {
  id: string; type: 'warning' | 'danger' | 'info';
  message: string; schoolName: string; time: string;
}

const PLAN_PRICES: Record<string, number> = {
  starter: 2999, growth: 5999, pro: 9999, enterprise: 19999,
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', city: '', state: 'Uttar Pradesh', board: 'CBSE', principalName: '',
    contactPhone: '', contactEmail: '', subscriptionTier: 'starter',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    if (user?.role !== 'super_admin') return;
    setLoading(true);
    try {
      const [schoolsRes, studentsRes, feesRes, messagesRes, usersRes] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('students').select('id, school_id, status'),
        supabase.from('fee_records').select('school_id, paid_amount, total_amount, status, payment_date'),
        supabase.from('messages').select('id, school_id'),
        supabase.from('users').select('id, school_id, last_login_at, role').neq('role', 'super_admin'),
      ]);

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

      const messagesBySchool: Record<string, number> = {};
      (messagesRes.data || []).forEach(m => {
        messagesBySchool[m.school_id] = (messagesBySchool[m.school_id] || 0) + 1;
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

      const mapped: School[] = (schoolsRes.data || []).map(s => ({
        id: s.id, name: s.name, slug: s.slug || '', city: s.city || '-',
        state: s.state || '-',
        subscriptionTier: s.subscription_tier, subscriptionStatus: s.subscription_status,
        studentSlab: s.student_slab, contactEmail: s.contact_email || '',
        studentCount: studentsBySchool[s.id] || 0,
        collectionRate: feeBySchool[s.id]?.total > 0 ? Math.round((feeBySchool[s.id].collected / feeBySchool[s.id].total) * 100) : 0,
        totalCollected: feeBySchool[s.id]?.collected || 0,
        totalPending: feeBySchool[s.id]?.pending || 0,
        messageCount: messagesBySchool[s.id] || 0,
        lastLoginAt: lastLoginBySchool[s.id] || null,
        activeParents: parentCountBySchool[s.id] || 0,
      }));
      setSchools(mapped);

      const totalFeeCollected = (feesRes.data || []).reduce((s, f) => s + f.paid_amount, 0);
      const totalFeePending = (feesRes.data || []).filter(f => f.status !== 'paid' && f.status !== 'waived').reduce((s, f) => s + (f.total_amount - f.paid_amount), 0);
      const mrr = mapped.filter(s => s.subscriptionStatus === 'active').reduce((sum, s) => sum + (PLAN_PRICES[s.subscriptionTier] || 0), 0);

      setStats({
        totalSchools: mapped.length,
        activeSchools: mapped.filter(s => s.subscriptionStatus === 'active').length,
        trialSchools: mapped.filter(s => s.subscriptionStatus === 'trial').length,
        totalStudents: (studentsRes.data || []).filter(s => s.status === 'active').length,
        totalFeeCollected, totalFeePending,
        totalMessages: (messagesRes.data || []).length,
        mrr,
      });

      // Generate alerts
      const alertList: AlertItem[] = [];
      mapped.forEach(s => {
        if (s.collectionRate < 50 && s.studentCount > 0) {
          alertList.push({ id: `low-fee-${s.id}`, type: 'danger', message: `Fee collection at ${s.collectionRate}%`, schoolName: s.name, time: 'Now' });
        }
        if (s.lastLoginAt && new Date().getTime() - new Date(s.lastLoginAt).getTime() > 7 * 86400000) {
          alertList.push({ id: `inactive-${s.id}`, type: 'warning', message: 'No login in 7+ days', schoolName: s.name, time: s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'Never' });
        }
        if (s.subscriptionStatus === 'trial') {
          alertList.push({ id: `trial-${s.id}`, type: 'info', message: 'Trial account — follow up for conversion', schoolName: s.name, time: 'Active' });
        }
      });
      setAlerts(alertList.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

      // Create admin user record (password-based, no invite needed)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: addForm.adminEmail,
        password: addForm.adminPassword,
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
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return <AppLayout><div className="text-center py-12"><p className="text-[#64748B]">Loading...</p></div></AppLayout>;
  }

  if (user.role !== 'super_admin') {
    return <AppLayout><div className="text-center py-12"><p className="text-[#64748B]">Access denied. Super admin only.</p></div></AppLayout>;
  }

  const filteredSchools = schools.filter(s => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTier && s.subscriptionTier !== filterTier) return false;
    if (filterStatus && s.subscriptionStatus !== filterStatus) return false;
    return true;
  });

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = {
      starter: 'bg-gray-100 text-gray-700', growth: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700', enterprise: 'bg-amber-100 text-amber-700',
    };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[tier] || 'bg-gray-100 text-gray-700'}`;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700', trial: 'bg-yellow-100 text-yellow-700', expired: 'bg-red-100 text-red-700',
    };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || 'bg-gray-100 text-gray-700'}`;
  };

  const alertIcon = (type: string) => {
    if (type === 'danger') return '🔴';
    if (type === 'warning') return '🟡';
    return '🔵';
  };

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]";
  const labelClass = "block text-sm font-medium text-[#1E293B] mb-1";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Platform Overview</h1>
            <p className="text-[#64748B] text-sm">Relayra Solutions — Super Admin</p>
          </div>
          <button onClick={() => setShowAddSchool(true)} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add School
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <>
            {/* Platform Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm">Total Schools</p>
                <p className="text-3xl font-bold text-[#1E293B] mt-1">{stats?.totalSchools || 0}</p>
                <p className="text-xs text-[#64748B] mt-1">{stats?.activeSchools || 0} active, {stats?.trialSchools || 0} trial</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm">Monthly Revenue (MRR)</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">Rs. {((stats?.mrr || 0)).toLocaleString('en-IN')}</p>
                <p className="text-xs text-[#64748B] mt-1">From {stats?.activeSchools || 0} active plans</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm">Total Students</p>
                <p className="text-3xl font-bold text-[#1E293B] mt-1">{(stats?.totalStudents || 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-[#64748B] mt-1">Across all schools</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <p className="text-[#64748B] text-sm">Fee Collection</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{formatCurrency(stats?.totalFeeCollected || 0)}</p>
                <p className="text-xs text-red-500 mt-1">{formatCurrency(stats?.totalFeePending || 0)} pending</p>
              </div>
            </div>

            {/* Second row: plan breakdown + system stats + alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan Breakdown */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="text-[#1E293B] font-semibold mb-4">Plan Breakdown</h3>
                <div className="space-y-3">
                  {['starter', 'growth', 'pro', 'enterprise'].map(tier => {
                    const count = schools.filter(s => s.subscriptionTier === tier).length;
                    const pct = schools.length > 0 ? Math.round((count / schools.length) * 100) : 0;
                    return (
                      <div key={tier} className="flex items-center gap-3">
                        <span className={tierBadge(tier)}>{tier}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0D9488] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-medium text-[#1E293B] w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Stats */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="text-[#1E293B] font-semibold mb-4">System Stats</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Messages Sent', value: (stats?.totalMessages || 0).toLocaleString('en-IN'), icon: '💬' },
                    { label: 'Fee Records', value: 'Platform-wide', icon: '💰' },
                    { label: 'Active Users', value: schools.reduce((sum, s) => sum + s.activeParents, 0).toString(), icon: '👥' },
                    { label: 'Total Schools', value: (stats?.totalSchools || 0).toString(), icon: '🏫' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 py-1">
                      <span className="text-lg">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm text-[#1E293B] font-medium">{item.label}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#1E293B]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert Feed */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="text-[#1E293B] font-semibold mb-4">Alerts</h3>
                {alerts.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-3xl mb-1">✅</p>
                    <p className="text-[#64748B] text-sm">All clear — no alerts</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {alerts.map(a => (
                      <div key={a.id} className="flex items-start gap-2 p-2 bg-[#F8FAFC] rounded-lg">
                        <span className="text-sm">{alertIcon(a.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1E293B] truncate">{a.schoolName}</p>
                          <p className="text-xs text-[#64748B]">{a.message}</p>
                        </div>
                        <span className="text-xs text-[#94A3B8] flex-shrink-0">{a.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* School Health Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#1E293B]">Schools ({filteredSchools.length})</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search schools..."
                    className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] w-48"
                  />
                  <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">All Plans</option>
                    {['starter', 'growth', 'pro', 'enterprise'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>

              {filteredSchools.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-12 text-center">
                  <p className="text-5xl mb-3">🏫</p>
                  <p className="text-[#1E293B] font-semibold">No schools found</p>
                  <button onClick={() => setShowAddSchool(true)} className="mt-4 bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold">Add First School</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredSchools.map(s => (
                    <div key={s.id} className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#1E293B] truncate">{s.name}</h4>
                          <p className="text-xs text-[#64748B]">{s.city}, {s.state}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <span className={tierBadge(s.subscriptionTier)}>{s.subscriptionTier}</span>
                          <span className={statusBadge(s.subscriptionStatus)}>{s.subscriptionStatus}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-[#F8FAFC] rounded-lg p-2">
                          <p className="text-xs text-[#64748B]">Students</p>
                          <p className="text-lg font-bold text-[#1E293B]">{s.studentCount}</p>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-lg p-2">
                          <p className="text-xs text-[#64748B]">Fee Rate</p>
                          <p className={`text-lg font-bold ${s.collectionRate >= 75 ? 'text-green-600' : s.collectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{s.collectionRate}%</p>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-lg p-2">
                          <p className="text-xs text-[#64748B]">Messages</p>
                          <p className="text-lg font-bold text-[#1E293B]">{s.messageCount}</p>
                        </div>
                        <div className="bg-[#F8FAFC] rounded-lg p-2">
                          <p className="text-xs text-[#64748B]">Users</p>
                          <p className="text-lg font-bold text-[#1E293B]">{s.activeParents}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                        <p className="text-xs text-[#94A3B8]">
                          Last login: {s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'Never'}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            const newStatus = s.subscriptionStatus === 'active' ? 'expired' : 'active';
                            await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', s.id);
                            toast.success(`School ${newStatus}`); fetchData();
                          }} className="text-[#0D9488] text-xs font-medium hover:underline">
                            {s.subscriptionStatus === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add School Modal */}
      {showAddSchool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">Add New School</h2>
              <button onClick={() => setShowAddSchool(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-3">School Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'School Name *', key: 'name' }, { label: 'City', key: 'city' },
                    { label: 'State', key: 'state' }, { label: 'Board', key: 'board' },
                    { label: 'Principal Name', key: 'principalName' }, { label: 'Contact Phone', key: 'contactPhone' },
                    { label: 'Contact Email', key: 'contactEmail' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <input type="text" value={(addForm as any)[f.key]} onChange={e => setAddForm(f2 => ({ ...f2, [f.key]: e.target.value }))} className={inputClass} />
                    </div>
                  ))}
                  <div>
                    <label className={labelClass}>Subscription Tier</label>
                    <select value={addForm.subscriptionTier} onChange={e => setAddForm(f => ({ ...f, subscriptionTier: e.target.value }))} className={inputClass}>
                      {['starter', 'growth', 'pro', 'enterprise'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-[#1E293B] mb-3">First Admin User</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Admin Name *', key: 'adminName', type: 'text' },
                    { label: 'Admin Email *', key: 'adminEmail', type: 'email' },
                    { label: 'Admin Password *', key: 'adminPassword', type: 'password' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <input type={f.type} value={(addForm as any)[f.key]} onChange={e => setAddForm(f2 => ({ ...f2, [f.key]: e.target.value }))} className={inputClass} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-6 py-4 flex gap-3">
              <button onClick={() => setShowAddSchool(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddSchool} disabled={adding} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{adding ? 'Adding...' : 'Add School'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
