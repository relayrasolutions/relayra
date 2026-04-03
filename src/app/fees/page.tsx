'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

interface FeeRecord {
  id: string; studentId: string; studentName: string; class: string; section: string;
  feeType: string; description: string | null; totalAmount: number; paidAmount: number;
  dueDate: string; status: string; paymentDate: string | null; paymentMethod: string | null;
  receiptNumber: string | null; escalationLevel: number;
}

interface FeeStats {
  totalGenerated: number; totalCollected: number; totalPending: number; collectionRate: number;
}

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const FEE_TYPES = ['tuition', 'transport', 'exam', 'admission', 'lab', 'library', 'sports', 'uniform', 'other'];

export default function FeesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'records'>('overview');
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<FeeRecord | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  // Create fee form
  const [createForm, setCreateForm] = useState({
    targetType: 'single', studentSearch: '', studentId: '', selectedClass: '', selectedSection: '',
    feeType: 'tuition', description: '', amount: '', dueDate: '', isRecurring: false, recurringFreq: 'monthly',
  });
  const [studentOptions, setStudentOptions] = useState<{ id: string; name: string; class: string; section: string }[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [creating, setCreating] = useState(false);

  // Pay form
  const [payForm, setPayForm] = useState({ method: 'cash', reference: '', amount: '' });
  const [paying, setPaying] = useState(false);

  const fetchFees = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      let query = supabase.from('fee_records').select(`
        id, student_id, fee_type, description, total_amount, paid_amount, due_date,
        status, payment_date, payment_method, receipt_number, escalation_level,
        students!inner(name, class, section)
      `).eq('school_id', user.schoolId);

      if (filterClass) query = query.eq('students.class', filterClass);
      if (filterType) query = query.eq('fee_type', filterType);
      if (filterStatus) query = query.eq('status', filterStatus);
      query = query.order('due_date', { ascending: false }).limit(200);

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map((f: any) => ({
        id: f.id, studentId: f.student_id,
        studentName: f.students?.name || '', class: f.students?.class || '', section: f.students?.section || '',
        feeType: f.fee_type, description: f.description, totalAmount: f.total_amount,
        paidAmount: f.paid_amount, dueDate: f.due_date, status: f.status,
        paymentDate: f.payment_date, paymentMethod: f.payment_method,
        receiptNumber: f.receipt_number, escalationLevel: f.escalation_level,
      }));
      setFees(mapped);

      // Stats
      const allFees = mapped;
      const totalGenerated = allFees.reduce((s, f) => s + f.totalAmount, 0);
      const totalCollected = allFees.reduce((s, f) => s + f.paidAmount, 0);
      const totalPending = totalGenerated - totalCollected;
      setStats({ totalGenerated, totalCollected, totalPending, collectionRate: totalGenerated > 0 ? Math.round((totalCollected / totalGenerated) * 100) : 0 });

      // Pie
      const paid = allFees.filter(f => f.status === 'paid').length;
      const pending = allFees.filter(f => f.status === 'pending' || f.status === 'partial').length;
      const overdue = allFees.filter(f => f.status === 'overdue').length;
      setPieData([{ name: 'Paid', value: paid }, { name: 'Pending', value: pending }, { name: 'Overdue', value: overdue }]);

      // Monthly bar
      const monthly: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        const amount = allFees.filter(f => f.paymentDate && f.paymentDate >= mStart && f.paymentDate <= mEnd).reduce((s, f) => s + f.paidAmount, 0);
        monthly.push({ month: monthName, amount: Math.round(amount / 100) });
      }
      setMonthlyData(monthly);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, filterClass, filterType, filterStatus]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  useEffect(() => {
    const fetchStudentCount = async () => {
      if (!user?.schoolId || createForm.targetType === 'single') return;
      let query = supabase.from('students').select('id', { count: 'exact' }).eq('school_id', user.schoolId).eq('status', 'active');
      if (createForm.targetType === 'class' && createForm.selectedClass) {
        query = query.eq('class', createForm.selectedClass);
        if (createForm.selectedSection) query = query.eq('section', createForm.selectedSection);
      }
      const { count } = await query;
      setStudentCount(count || 0);
    };
    fetchStudentCount();
  }, [createForm.targetType, createForm.selectedClass, createForm.selectedSection, user?.schoolId]);

  const searchStudents = async (q: string) => {
    if (!q || !user?.schoolId) return;
    const { data } = await supabase.from('students').select('id, name, class, section').eq('school_id', user.schoolId).ilike('name', `%${q}%`).limit(10);
    setStudentOptions(data || []);
  };

  const handleCreateFee = async () => {
    if (!createForm.feeType || !createForm.amount || !createForm.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }
    const amountPaisa = Math.round(parseFloat(createForm.amount) * 100);
    if (isNaN(amountPaisa) || amountPaisa <= 0) {
      toast.error('Invalid amount');
      return;
    }
    setCreating(true);
    try {
      let studentIds: string[] = [];
      if (createForm.targetType === 'single') {
        if (!createForm.studentId) { toast.error('Please select a student'); setCreating(false); return; }
        studentIds = [createForm.studentId];
      } else {
        let q = supabase.from('students').select('id').eq('school_id', user!.schoolId).eq('status', 'active');
        if (createForm.targetType === 'class' && createForm.selectedClass) {
          q = q.eq('class', createForm.selectedClass);
          if (createForm.selectedSection) q = q.eq('section', createForm.selectedSection);
        }
        const { data } = await q;
        studentIds = (data || []).map(s => s.id);
      }

      const records = studentIds.map(sid => ({
        school_id: user!.schoolId, student_id: sid,
        fee_type: createForm.feeType, description: createForm.description || null,
        total_amount: amountPaisa, paid_amount: 0,
        due_date: createForm.dueDate, status: 'pending',
        is_recurring: createForm.isRecurring,
        recurring_frequency: createForm.isRecurring ? createForm.recurringFreq : null,
        created_by: user!.id,
      }));

      const { error } = await supabase.from('fee_records').insert(records);
      if (error) throw error;

      await supabase.from('activity_log').insert({
        school_id: user!.schoolId, user_id: user!.id,
        action: 'fee_created', description: `Created ${createForm.feeType} fee for ${studentIds.length} student(s) - Rs. ${createForm.amount}`,
        entity_type: 'fee',
      });

      toast.success(`Fee created for ${studentIds.length} student(s)`);
      setShowCreateModal(false);
      setCreateForm({ targetType: 'single', studentSearch: '', studentId: '', selectedClass: '', selectedSection: '', feeType: 'tuition', description: '', amount: '', dueDate: '', isRecurring: false, recurringFreq: 'monthly' });
      fetchFees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create fee');
    } finally {
      setCreating(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!showPayModal) return;
    const amountPaisa = Math.round(parseFloat(payForm.amount) * 100);
    if (isNaN(amountPaisa) || amountPaisa <= 0) { toast.error('Invalid amount'); return; }
    setPaying(true);
    try {
      const today = new Date();
      const serial = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
      const receipt = `RLY-DPS-${today.getFullYear()}${(today.getMonth()+1).toString().padStart(2,'0')}${today.getDate().toString().padStart(2,'0')}-${serial}`;
      const newPaid = showPayModal.paidAmount + amountPaisa;
      const newStatus = newPaid >= showPayModal.totalAmount ? 'paid' : 'partial';

      const { error } = await supabase.from('fee_records').update({
        paid_amount: newPaid, status: newStatus,
        payment_date: today.toISOString(), payment_method: payForm.method,
        receipt_number: receipt,
      }).eq('id', showPayModal.id);
      if (error) throw error;

      await supabase.from('activity_log').insert({
        school_id: user!.schoolId, user_id: user!.id,
        action: 'payment_received',
        description: `Payment received for ${showPayModal.studentName} - ${formatCurrency(amountPaisa)} via ${payForm.method}`,
        entity_type: 'fee', entity_id: showPayModal.id,
      });

      toast.success('Payment recorded successfully');
      setShowPayModal(null);
      setPayForm({ method: 'cash', reference: '', amount: '' });
      fetchFees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setPaying(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700', partial: 'bg-orange-100 text-orange-700',
      waived: 'bg-gray-100 text-gray-600',
    };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`;
  };

  const PIE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1E293B]">Fee Management</h1>
          <button onClick={() => setShowCreateModal(true)} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create Fee
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {(['overview', 'records'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>{tab}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : activeTab === 'overview' ? (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Generated', value: formatCurrency(stats?.totalGenerated || 0), color: 'text-[#1E293B]' },
                { label: 'Total Collected', value: formatCurrency(stats?.totalCollected || 0), color: 'text-green-600' },
                { label: 'Total Pending', value: formatCurrency(stats?.totalPending || 0), color: 'text-red-600' },
                { label: 'Collection Rate', value: `${stats?.collectionRate || 0}%`, color: stats && stats.collectionRate >= 75 ? 'text-green-600' : 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                  <p className="text-[#64748B] text-sm">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="font-semibold text-[#1E293B] mb-4">Fee Status Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="font-semibold text-[#1E293B] mb-4">Monthly Collection (Rs.)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Collected']} />
                    <Bar dataKey="amount" fill="#0D9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] flex flex-wrap gap-3">
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                <option value="">All Types</option>
                {FEE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                <option value="">All Status</option>
                {['pending', 'paid', 'partial', 'overdue', 'waived'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              {fees.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-5xl mb-3">💰</p>
                  <p className="text-[#1E293B] font-semibold">No fee records found</p>
                  <button onClick={() => setShowCreateModal(true)} className="mt-4 bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold">Create Fee</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <tr>
                        {['Student', 'Class', 'Fee Type', 'Total', 'Paid', 'Due Date', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {fees.map(f => (
                        <tr key={f.id} className="hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 font-medium text-[#1E293B]">{f.studentName}</td>
                          <td className="px-4 py-3 text-[#64748B]">{f.class}-{f.section}</td>
                          <td className="px-4 py-3 text-[#64748B] capitalize">{f.feeType}</td>
                          <td className="px-4 py-3 text-[#1E293B]">{formatCurrency(f.totalAmount)}</td>
                          <td className="px-4 py-3 text-green-600">{formatCurrency(f.paidAmount)}</td>
                          <td className="px-4 py-3 text-[#64748B]">{formatDate(f.dueDate)}</td>
                          <td className="px-4 py-3"><span className={statusBadge(f.status)}>{f.status}</span></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {f.status !== 'paid' && f.status !== 'waived' && (
                                <button onClick={() => { setShowPayModal(f); setPayForm({ method: 'cash', reference: '', amount: ((f.totalAmount - f.paidAmount) / 100).toString() }); }} className="text-[#0D9488] hover:text-[#0f766e] text-xs font-medium">Pay</button>
                              )}
                              {f.status !== 'waived' && f.status !== 'paid' && (
                                <button onClick={async () => {
                                  if (!confirm('Waive this fee?')) return;
                                  await supabase.from('fee_records').update({ status: 'waived' }).eq('id', f.id);
                                  toast.success('Fee waived'); fetchFees();
                                }} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Waive</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Fee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">Create Fee</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Target</label>
                <div className="flex gap-3">
                  {['single', 'class', 'school'].map(t => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={t} checked={createForm.targetType === t} onChange={e => setCreateForm(f => ({ ...f, targetType: e.target.value }))} />
                      <span className="text-sm capitalize">{t === 'single' ? 'Single Student' : t === 'class' ? 'Entire Class' : 'Entire School'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {createForm.targetType === 'single' && (
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Student</label>
                  <input type="text" value={createForm.studentSearch} onChange={e => { setCreateForm(f => ({ ...f, studentSearch: e.target.value, studentId: '' })); searchStudents(e.target.value); }}
                    placeholder="Search student name..." className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                  {studentOptions.length > 0 && !createForm.studentId && (
                    <div className="border border-[#E2E8F0] rounded-lg mt-1 max-h-40 overflow-y-auto">
                      {studentOptions.map(s => (
                        <button key={s.id} onClick={() => { setCreateForm(f => ({ ...f, studentId: s.id, studentSearch: `${s.name} (${s.class}-${s.section})` })); setStudentOptions([]); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[#F1F5F9] last:border-0">
                          {s.name} — Class {s.class}-{s.section}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {createForm.targetType === 'class' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Class</label>
                    <select value={createForm.selectedClass} onChange={e => setCreateForm(f => ({ ...f, selectedClass: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                      <option value="">Select Class</option>
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">Section (optional)</label>
                    <select value={createForm.selectedSection} onChange={e => setCreateForm(f => ({ ...f, selectedSection: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                      <option value="">All Sections</option>
                      {['A','B','C','D'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {createForm.targetType !== 'single' && studentCount > 0 && (
                <p className="text-sm text-[#0D9488] font-medium">This will create fee records for {studentCount} students.</p>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Fee Type *</label>
                <select value={createForm.feeType} onChange={e => setCreateForm(f => ({ ...f, feeType: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                  {FEE_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Description</label>
                <input type="text" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Amount (Rs.) *</label>
                  <input type="number" value={createForm.amount} onChange={e => setCreateForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Due Date *</label>
                  <input type="date" value={createForm.dueDate} onChange={e => setCreateForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="recurring" checked={createForm.isRecurring} onChange={e => setCreateForm(f => ({ ...f, isRecurring: e.target.checked }))} className="rounded" />
                <label htmlFor="recurring" className="text-sm text-[#1E293B]">Recurring fee</label>
                {createForm.isRecurring && (
                  <select value={createForm.recurringFreq} onChange={e => setCreateForm(f => ({ ...f, recurringFreq: e.target.value }))} className="px-3 py-1 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-6 py-4 flex gap-3">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateFee} disabled={creating} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                {creating ? 'Creating...' : 'Create Fee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">Record Payment</h2>
            <div className="bg-[#F8FAFC] rounded-lg p-3 mb-4 text-sm">
              <p><span className="text-[#64748B]">Student:</span> <span className="font-medium">{showPayModal.studentName}</span></p>
              <p><span className="text-[#64748B]">Fee Type:</span> <span className="capitalize">{showPayModal.feeType}</span></p>
              <p><span className="text-[#64748B]">Total:</span> {formatCurrency(showPayModal.totalAmount)}</p>
              <p><span className="text-[#64748B]">Remaining:</span> <span className="text-red-600 font-medium">{formatCurrency(showPayModal.totalAmount - showPayModal.paidAmount)}</span></p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Payment Method</label>
                <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                  {['cash', 'cheque', 'upi', 'card', 'netbanking'].map(m => <option key={m} value={m} className="capitalize">{m.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Reference Number (optional)</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))} placeholder="Transaction ID / Cheque No." className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Amount (Rs.)</label>
                <input type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPayModal(null)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleMarkPaid} disabled={paying} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                {paying ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
