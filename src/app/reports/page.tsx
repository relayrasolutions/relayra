'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fee' | 'attendance' | 'communication'>('fee');
  const [loading, setLoading] = useState(false);

  // Fee report state
  const [feeStats, setFeeStats] = useState({ generated: 0, collected: 0, pending: 0, overdue: 0, rate: 0 });
  const [monthlyFee, setMonthlyFee] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [classBreakdown, setClassBreakdown] = useState<any[]>([]);

  // Attendance report state
  const [attTrend, setAttTrend] = useState<any[]>([]);
  const [lowAttStudents, setLowAttStudents] = useState<any[]>([]);

  // Communication report state
  const [msgStats, setMsgStats] = useState<any[]>([]);

  const fetchFeeReport = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const { data: fees } = await supabase.from('fee_records').select(`
        total_amount, paid_amount, status, payment_date, due_date,
        students!inner(name, class, section)
      `).eq('school_id', user.schoolId);

      const all = fees || [];
      const generated = all.reduce((s, f) => s + f.total_amount, 0);
      const collected = all.reduce((s, f) => s + f.paid_amount, 0);
      const pending = all.filter(f => f.status === 'pending' || f.status === 'partial').reduce((s, f) => s + (f.total_amount - f.paid_amount), 0);
      const overdue = all.filter(f => f.status === 'overdue').reduce((s, f) => s + (f.total_amount - f.paid_amount), 0);
      setFeeStats({ generated, collected, pending, overdue, rate: generated > 0 ? Math.round((collected / generated) * 100) : 0 });

      // Monthly
      const monthly: any[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
        const amount = all.filter(f => f.payment_date && f.payment_date >= mStart && f.payment_date <= mEnd).reduce((s, f) => s + f.paid_amount, 0);
        monthly.push({ month: d.toLocaleString('default', { month: 'short' }), amount: Math.round(amount / 100) });
      }
      setMonthlyFee(monthly);

      // Class breakdown
      const classMap: Record<string, { generated: number; collected: number; students: Set<string> }> = {};
      all.forEach((f: any) => {
        const cls = f.students?.class || 'Unknown';
        if (!classMap[cls]) classMap[cls] = { generated: 0, collected: 0, students: new Set() };
        classMap[cls].generated += f.total_amount;
        classMap[cls].collected += f.paid_amount;
      });
      setClassBreakdown(Object.entries(classMap).map(([cls, v]) => ({
        class: cls, generated: v.generated, collected: v.collected,
        pending: v.generated - v.collected,
        rate: v.generated > 0 ? Math.round((v.collected / v.generated) * 100) : 0,
      })).sort((a, b) => parseInt(a.class) - parseInt(b.class)));

      // Defaulters
      const studentPending: Record<string, { name: string; class: string; section: string; pending: number; dueDate: string }> = {};
      all.filter(f => f.status !== 'paid' && f.status !== 'waived').forEach((f: any) => {
        const key = f.students?.name || 'Unknown';
        if (!studentPending[key]) studentPending[key] = { name: f.students?.name, class: f.students?.class, section: f.students?.section, pending: 0, dueDate: f.due_date };
        studentPending[key].pending += (f.total_amount - f.paid_amount);
        if (f.due_date < studentPending[key].dueDate) studentPending[key].dueDate = f.due_date;
      });
      setDefaulters(Object.values(studentPending).sort((a, b) => b.pending - a.pending).slice(0, 20));
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  const fetchAttReport = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      const { data: attData } = await supabase.from('attendance').select('student_id, status, date').eq('school_id', user.schoolId);
      const { data: studs } = await supabase.from('students').select('id, name, class, section').eq('school_id', user.schoolId).eq('status', 'active');

      // Trend last 14 days
      const trend: any[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayAtt = (attData || []).filter(a => a.date === dateStr);
        const total = dayAtt.length;
        const present = dayAtt.filter(a => a.status === 'present').length;
        trend.push({ day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), pct: total > 0 ? Math.round((present / total) * 100) : 0 });
      }
      setAttTrend(trend);

      // Low attendance students
      const low = (studs || []).map(s => {
        const sAtt = (attData || []).filter(a => a.student_id === s.id);
        const total = sAtt.length;
        const present = sAtt.filter(a => a.status === 'present').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;
        return { ...s, total, present, pct };
      }).filter(s => s.pct < 75).sort((a, b) => a.pct - b.pct);
      setLowAttStudents(low);
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  const fetchCommReport = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    const { data } = await supabase.from('messages').select('type, status, created_at').eq('school_id', user.schoolId);
    const typeMap: Record<string, number> = {};
    (data || []).forEach(m => { typeMap[m.type] = (typeMap[m.type] || 0) + 1; });
    setMsgStats(Object.entries(typeMap).map(([type, count]) => ({ type, count })));
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => {
    if (activeTab === 'fee') fetchFeeReport();
    else if (activeTab === 'attendance') fetchAttReport();
    else fetchCommReport();
  }, [activeTab, fetchFeeReport, fetchAttReport, fetchCommReport]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-[#1E293B]">Reports</h1>

        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {(['fee', 'attendance', 'communication'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
              {tab === 'fee' ? 'Fee Reports' : tab === 'attendance' ? 'Attendance Reports' : 'Communication'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : activeTab === 'fee' ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Generated', value: formatCurrency(feeStats.generated), color: 'text-[#1E293B]' },
                { label: 'Collected', value: formatCurrency(feeStats.collected), color: 'text-green-600' },
                { label: 'Pending', value: formatCurrency(feeStats.pending), color: 'text-yellow-600' },
                { label: 'Overdue', value: formatCurrency(feeStats.overdue), color: 'text-red-600' },
                { label: 'Collection Rate', value: `${feeStats.rate}%`, color: feeStats.rate >= 75 ? 'text-green-600' : 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
                  <p className="text-[#64748B] text-xs">{s.label}</p>
                  <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-4">Monthly Collection (12 Months)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyFee}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Collected']} />
                  <Bar dataKey="amount" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0]"><h3 className="font-semibold text-[#1E293B]">Class-wise Breakdown</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>{['Class', 'Generated', 'Collected', 'Pending', 'Rate %'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {classBreakdown.map(r => (
                      <tr key={r.class} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-medium text-[#1E293B]">Class {r.class}</td>
                        <td className="px-4 py-3 text-[#64748B]">{formatCurrency(r.generated)}</td>
                        <td className="px-4 py-3 text-green-600">{formatCurrency(r.collected)}</td>
                        <td className="px-4 py-3 text-red-600">{formatCurrency(r.pending)}</td>
                        <td className="px-4 py-3"><span className={`font-semibold ${r.rate >= 75 ? 'text-green-600' : 'text-red-600'}`}>{r.rate}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {defaulters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E8F0]"><h3 className="font-semibold text-[#1E293B]">Top Defaulters</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC]">
                      <tr>{['Student', 'Class', 'Pending Amount', 'Overdue Since'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {defaulters.map((d, i) => (
                        <tr key={i} className="hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 font-medium text-[#1E293B]">{d.name}</td>
                          <td className="px-4 py-3 text-[#64748B]">{d.class}-{d.section}</td>
                          <td className="px-4 py-3 text-red-600 font-semibold">{formatCurrency(d.pending)}</td>
                          <td className="px-4 py-3 text-[#64748B]">{formatDate(d.dueDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'attendance' ? (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-4">Daily Attendance Trend (14 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} />
                  <Line type="monotone" dataKey="pct" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {lowAttStudents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E2E8F0]">
                  <h3 className="font-semibold text-[#1E293B]">Students Below 75% Attendance ⚠️</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC]">
                      <tr>{['Student', 'Class', 'Total Days', 'Present', 'Attendance %'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {lowAttStudents.map(s => (
                        <tr key={s.id} className="bg-red-50">
                          <td className="px-4 py-3 font-medium text-[#1E293B]">{s.name}</td>
                          <td className="px-4 py-3 text-[#64748B]">{s.class}-{s.section}</td>
                          <td className="px-4 py-3 text-[#64748B]">{s.total}</td>
                          <td className="px-4 py-3 text-green-600">{s.present}</td>
                          <td className="px-4 py-3 text-red-600 font-bold">{s.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-4">Messages by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={msgStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
