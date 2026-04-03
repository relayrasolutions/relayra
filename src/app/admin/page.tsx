'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, formatCurrency } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface School {
  id: string; name: string; city: string; subscriptionTier: string;
  subscriptionStatus: string; studentSlab: string; studentCount?: number;
  collectionRate?: number;
}

interface PlatformStats {
  totalSchools: number; activeSchools: number; trialSchools: number;
  totalStudents: number; totalFeeCollected: number; totalMessages: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'schools' | 'analytics'>('schools');
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', city: '', state: 'Uttar Pradesh', board: 'CBSE', principalName: '',
    contactPhone: '', contactEmail: '', subscriptionTier: 'starter',
    adminName: '', adminEmail: '', adminPhone: '',
  });
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    if (user?.role !== 'super_admin') return;
    setLoading(true);
    try {
      const { data: schoolsData } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      const { data: studentsData } = await supabase.from('students').select('id, school_id, status');
      const { data: feesData } = await supabase.from('fee_records').select('school_id, paid_amount, total_amount');
      const { data: messagesData } = await supabase.from('messages').select('id');

      const studentsBySchool: Record<string, number> = {};
      (studentsData || []).filter(s => s.status === 'active').forEach(s => {
        studentsBySchool[s.school_id] = (studentsBySchool[s.school_id] || 0) + 1;
      });

      const feeBySchool: Record<string, { collected: number; total: number }> = {};
      (feesData || []).forEach(f => {
        if (!feeBySchool[f.school_id]) feeBySchool[f.school_id] = { collected: 0, total: 0 };
        feeBySchool[f.school_id].collected += f.paid_amount;
        feeBySchool[f.school_id].total += f.total_amount;
      });

      const mapped = (schoolsData || []).map(s => ({
        id: s.id, name: s.name, city: s.city || '-',
        subscriptionTier: s.subscription_tier, subscriptionStatus: s.subscription_status,
        studentSlab: s.student_slab,
        studentCount: studentsBySchool[s.id] || 0,
        collectionRate: feeBySchool[s.id]?.total > 0 ? Math.round((feeBySchool[s.id].collected / feeBySchool[s.id].total) * 100) : 0,
      }));
      setSchools(mapped);

      const totalFeeCollected = (feesData || []).reduce((s, f) => s + f.paid_amount, 0);
      setStats({
        totalSchools: mapped.length,
        activeSchools: mapped.filter(s => s.subscriptionStatus === 'active').length,
        trialSchools: mapped.filter(s => s.subscriptionStatus === 'trial').length,
        totalStudents: (studentsData || []).filter(s => s.status === 'active').length,
        totalFeeCollected,
        totalMessages: (messagesData || []).length,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddSchool = async () => {
    if (!addForm.name || !addForm.adminEmail || !addForm.adminName) {
      toast.error('Please fill all required fields');
      return;
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

      // Create admin user via auth invite
      const { data: authData } = await supabase.auth.admin.inviteUserByEmail(addForm.adminEmail, {
        data: { name: addForm.adminName, role: 'school_admin' },
      });
      if (authData.user) {
        await supabase.from('users').insert({
          auth_id: authData.user.id, email: addForm.adminEmail, name: addForm.adminName,
          role: 'school_admin', school_id: schoolData.id, phone: addForm.adminPhone,
        });
      }

      toast.success('School added and admin invited');
      setShowAddSchool(false);
      setAddForm({ name: '', city: '', state: 'Uttar Pradesh', board: 'CBSE', principalName: '', contactPhone: '', contactEmail: '', subscriptionTier: 'starter', adminName: '', adminEmail: '', adminPhone: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add school');
    } finally {
      setAdding(false);
    }
  };

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

  if (user?.role !== 'super_admin') {
    return <AppLayout><div className="text-center py-12"><p className="text-[#64748B]">Access denied. Super admin only.</p></div></AppLayout>;
  }

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]";
  const labelClass = "block text-sm font-medium text-[#1E293B] mb-1";

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Super Admin Panel</h1>
            <p className="text-[#64748B] text-sm">Platform-wide management</p>
          </div>
          {activeTab === 'schools' && (
            <button onClick={() => setShowAddSchool(true)} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add New School
            </button>
          )}
        </div>

        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {(['schools', 'analytics'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>{tab === 'schools' ? 'Schools' : 'Platform Analytics'}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : activeTab === 'schools' ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            {schools.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-5xl mb-3">🏫</p>
                <p className="text-[#1E293B] font-semibold">No schools yet</p>
                <button onClick={() => setShowAddSchool(true)} className="mt-4 bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold">Add First School</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>{['School Name', 'City', 'Plan', 'Status', 'Students', 'Collection Rate', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {schools.map(s => (
                      <tr key={s.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-medium text-[#1E293B]">{s.name}</td>
                        <td className="px-4 py-3 text-[#64748B]">{s.city}</td>
                        <td className="px-4 py-3"><span className={tierBadge(s.subscriptionTier)}>{s.subscriptionTier}</span></td>
                        <td className="px-4 py-3"><span className={statusBadge(s.subscriptionStatus)}>{s.subscriptionStatus}</span></td>
                        <td className="px-4 py-3 text-[#64748B]">{s.studentCount}</td>
                        <td className="px-4 py-3"><span className={`font-semibold ${(s.collectionRate || 0) >= 75 ? 'text-green-600' : 'text-red-600'}`}>{s.collectionRate}%</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const newStatus = s.subscriptionStatus === 'active' ? 'expired' : 'active';
                              await supabase.from('schools').update({ subscription_status: newStatus }).eq('id', s.id);
                              toast.success(`School ${newStatus}`); fetchData();
                            }} className="text-[#0D9488] text-xs font-medium hover:underline">
                              {s.subscriptionStatus === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Schools', value: stats?.totalSchools || 0, sub: `${stats?.activeSchools || 0} active, ${stats?.trialSchools || 0} trial` },
                { label: 'Total Students', value: (stats?.totalStudents || 0).toLocaleString('en-IN'), sub: 'Active students' },
                { label: 'Total Fee Collected', value: formatCurrency(stats?.totalFeeCollected || 0), sub: 'Platform-wide' },
                { label: 'Total Messages Sent', value: (stats?.totalMessages || 0).toLocaleString('en-IN'), sub: 'All schools' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                  <p className="text-[#64748B] text-sm">{s.label}</p>
                  <p className="text-2xl font-bold text-[#1E293B] mt-1">{s.value}</p>
                  <p className="text-xs text-[#64748B] mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
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
                    { label: 'Admin Name *', key: 'adminName' },
                    { label: 'Admin Email *', key: 'adminEmail' },
                    { label: 'Admin Phone', key: 'adminPhone' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelClass}>{f.label}</label>
                      <input type="text" value={(addForm as any)[f.key]} onChange={e => setAddForm(f2 => ({ ...f2, [f.key]: e.target.value }))} className={inputClass} />
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
