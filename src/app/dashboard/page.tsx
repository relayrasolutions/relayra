'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, formatCurrency, timeAgo, formatDate, withTimeout } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalStudents: number; newThisMonth: number;
  presentToday: number; totalToday: number; attendanceMarked: boolean;
  feeCollectedMonth: number; feePending: number; feeTarget: number;
  defaulterCount: number; overdueAmount: number;
  messagesToday: number; deliveredToday: number; failedToday: number;
  pendingQueries: number;
}

interface DefaulterItem {
  id: string; studentName: string; class: string; section: string; amount: number; dueDate: string;
}

interface RecentMessage {
  id: string; type: string; title: string | null; body: string; recipientCount: number;
  sentCount: number; deliveredCount: number; status: string; sentAt: string | null; createdAt: string;
}

interface ActivityItem {
  id: string; action: string; description: string | null; createdAt: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeChartData, setFeeChartData] = useState<any[]>([]);
  const [attendanceChartData, setAttendanceChartData] = useState<any[]>([]);
  const [defaulters, setDefaulters] = useState<DefaulterItem[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [loadingStale, setLoadingStale] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user?.schoolId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [studentsRes, attendanceRes, feeRes, messagesRes, queriesRes, activityRes] = await withTimeout(
        Promise.all([
          supabase.from('students').select('id, created_at, class, section').eq('school_id', user.schoolId).eq('status', 'active'),
          supabase.from('attendance').select('status').eq('school_id', user.schoolId).eq('date', today),
          supabase.from('fee_records').select('id, student_id, paid_amount, total_amount, status, payment_date, due_date, students!inner(name, class, section)').eq('school_id', user.schoolId),
          supabase.from('messages').select('id, type, title, body, recipient_count, sent_count, delivered_count, status, sent_at, created_at').eq('school_id', user.schoolId).order('created_at', { ascending: false }).limit(10),
          supabase.from('parent_queries').select('id').eq('school_id', user.schoolId).eq('status', 'pending'),
          supabase.from('activity_log').select('id, action, description, created_at').eq('school_id', user.schoolId).order('created_at', { ascending: false }).limit(10),
        ]),
        15000,
        'Dashboard fetch',
      );

      const students = studentsRes.data || [];
      const attendance = attendanceRes.data || [];
      const fees = feeRes.data || [];
      const messages = messagesRes.data || [];

      const newThisMonth = students.filter(s => s.created_at >= monthStart).length;
      const presentToday = attendance.filter(a => a.status === 'present').length;
      const feeCollectedMonth = fees.filter((f: any) => f.payment_date && f.payment_date >= monthStart).reduce((sum: number, f: any) => sum + (f.paid_amount || 0), 0);
      const feePending = fees.filter((f: any) => f.status !== 'paid' && f.status !== 'waived').reduce((sum: number, f: any) => sum + (f.total_amount - f.paid_amount), 0);
      const feeTarget = fees.filter((f: any) => f.due_date && f.due_date >= monthStart).reduce((sum: number, f: any) => sum + (f.total_amount || 0), 0);

      // Defaulters
      const overdueFees = fees.filter((f: any) => f.status === 'overdue' || (f.status === 'pending' && f.due_date && f.due_date < today));
      const overdueAmount = overdueFees.reduce((sum: number, f: any) => sum + (f.total_amount - f.paid_amount), 0);
      setDefaulters(overdueFees.slice(0, 8).map((f: any) => ({
        id: f.id,
        studentName: f.students?.name || 'Unknown',
        class: f.students?.class || '-',
        section: f.students?.section || '-',
        amount: f.total_amount - f.paid_amount,
        dueDate: f.due_date,
      })));

      // Today's messages
      const todayMessages = messages.filter(m => m.created_at >= today);
      const deliveredToday = todayMessages.reduce((sum, m) => sum + (m.delivered_count || 0), 0);
      const sentToday = todayMessages.reduce((sum, m) => sum + (m.sent_count || 0), 0);

      setStats({
        totalStudents: students.length,
        newThisMonth,
        presentToday,
        totalToday: attendance.length,
        attendanceMarked: attendance.length > 0,
        feeCollectedMonth,
        feePending,
        feeTarget,
        defaulterCount: overdueFees.length,
        overdueAmount,
        messagesToday: todayMessages.length,
        deliveredToday,
        failedToday: sentToday - deliveredToday,
        pendingQueries: (queriesRes.data || []).length,
      });

      setRecentMessages(messages.slice(0, 6).map(m => ({
        id: m.id, type: m.type, title: m.title, body: m.body,
        recipientCount: m.recipient_count, sentCount: m.sent_count,
        deliveredCount: m.delivered_count, status: m.status,
        sentAt: m.sent_at, createdAt: m.created_at,
      })));

      setActivityLog((activityRes.data || []).map(a => ({
        id: a.id, action: a.action, description: a.description, createdAt: a.created_at,
      })));

      // Fee chart - last 6 months
      const feeChart = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const amount = fees.filter((f: any) => f.payment_date && f.payment_date >= mStart && f.payment_date <= mEnd).reduce((sum: number, f: any) => sum + (f.paid_amount || 0), 0);
        feeChart.push({ month: monthName, collected: Math.round(amount / 100) });
      }
      setFeeChartData(feeChart);

      // Attendance chart - last 14 days (single range query — NOT a loop of 14 queries)
      const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      const startDateStr = fourteenDaysAgo.toISOString().split('T')[0];
      const { data: allAttData } = await withTimeout(
        supabase.from('attendance').select('date, status').eq('school_id', user.schoolId).gte('date', startDateStr).lte('date', today),
        10000,
        'Attendance trend fetch',
      );
      const attByDate: Record<string, { total: number; present: number }> = {};
      (allAttData || []).forEach(a => {
        if (!attByDate[a.date]) attByDate[a.date] = { total: 0, present: 0 };
        attByDate[a.date].total++;
        if (a.status === 'present') attByDate[a.date].present++;
      });
      const attChart = [];
      let totalPct = 0; let chartDays = 0;
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        const dayData = attByDate[dateStr] || { total: 0, present: 0 };
        const pct = dayData.total > 0 ? Math.round((dayData.present / dayData.total) * 100) : 0;
        if (dayData.total > 0) { totalPct += pct; chartDays++; }
        attChart.push({ day: dayName, pct });
      }
      setAttendanceChartData(attChart);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally { setLoading(false); }
  }, [user?.schoolId]);

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [authLoading, user, router]);
  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) fetchDashboard(); else router.replace('/login');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchDashboard, router]);

  useEffect(() => {
    if (!loading) { setLoadingStale(false); return; }
    const timer = setTimeout(() => setLoadingStale(true), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (authLoading || !user) {
    return <AppLayout><div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div></AppLayout>;
  }

  const msgTypeBadge = (type: string) => {
    const m: Record<string, string> = {
      fee_reminder: 'bg-amber-50 text-amber-700', attendance: 'bg-blue-50 text-blue-700',
      notice: 'bg-slate-100 text-slate-700', emergency: 'bg-red-50 text-red-700',
      birthday: 'bg-pink-50 text-pink-700', circular: 'bg-purple-50 text-purple-700',
      festival: 'bg-emerald-50 text-emerald-700', event: 'bg-teal-50 text-teal-700',
    };
    return m[type] || 'bg-slate-100 text-slate-700';
  };

  const attendancePct = stats && stats.totalToday > 0 ? Math.round((stats.presentToday / stats.totalToday) * 100) : 0;
  const attColor = attendancePct >= 90 ? 'text-emerald-600' : attendancePct >= 75 ? 'text-amber-600' : 'text-red-600';

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon name="ExclamationTriangleIcon" size={40} className="text-amber-400 mb-3" />
          <p className="text-[#1E293B] font-semibold mb-1">Failed to load dashboard</p>
          <p className="text-[#64748B] text-sm mb-4">{error}</p>
          <button onClick={() => { setError(null); fetchDashboard(); }} className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg">Retry</button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        {loadingStale ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#64748B] mb-4">Dashboard is taking longer than expected.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg">Reload</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[1,2,3,4,5].map(i => <div key={i} className="bg-white rounded-xl p-5 border border-[#E2E8F0] animate-pulse"><div className="h-3 bg-gray-200 rounded w-20 mb-3" /><div className="h-7 bg-gray-200 rounded w-14" /></div>)}
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  const quickActions = [
    { href: '/messages', label: 'Send Notice', sub: 'to all parents', iconName: 'PaperAirplaneIcon', color: 'bg-blue-50 text-blue-600' },
    { href: '/fees', label: 'View Defaulters', sub: `${stats?.defaulterCount || 0} pending`, iconName: 'ExclamationCircleIcon', color: 'bg-red-50 text-red-600' },
    { href: '/attendance', label: 'Upload Attendance', sub: 'CSV import', iconName: 'ArrowUpTrayIcon', color: 'bg-emerald-50 text-emerald-600' },
    { href: '/reports', label: 'Generate Report', sub: 'fee + attendance', iconName: 'DocumentChartBarIcon', color: 'bg-amber-50 text-amber-600' },
    { href: '/messages', label: 'Parent Queries', sub: `${stats?.pendingQueries || 0} unread`, iconName: 'ChatBubbleLeftEllipsisIcon', color: 'bg-purple-50 text-purple-600' },
    { href: '/calendar', label: 'School Calendar', sub: 'events & holidays', iconName: 'CalendarDaysIcon', color: 'bg-teal-50 text-teal-600' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1E293B]">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
            <p className="text-[#94A3B8] text-xs mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={fetchDashboard} className="text-[#94A3B8] hover:text-[#64748B] p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors" title="Refresh">
            <Icon name="ArrowPathIcon" size={18} className="text-[#94A3B8]" />
          </button>
        </div>

        {/* Alert Banner */}
        {(stats?.defaulterCount || 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Icon name="ExclamationTriangleIcon" size={18} className="text-red-500" />
              <p className="text-sm text-red-700"><span className="font-semibold">{stats?.defaulterCount} fee defaulters</span> need follow-up &middot; {formatCurrency(stats?.overdueAmount || 0)} overdue</p>
            </div>
            <Link href="/fees" className="text-xs font-medium text-red-700 hover:underline whitespace-nowrap">View all</Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#64748B] text-xs font-medium">Total Students</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Icon name="UsersIcon" size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">{stats?.totalStudents || 0}</p>
            <p className="text-[#94A3B8] text-[11px] mt-0.5">+{stats?.newThisMonth || 0} this month</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#64748B] text-xs font-medium">Today&apos;s Attendance</p>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Icon name="ClipboardDocumentCheckIcon" size={16} className="text-emerald-600" />
              </div>
            </div>
            {stats?.attendanceMarked ? (
              <>
                <p className={`text-2xl font-bold ${attColor}`}>{attendancePct}%</p>
                <p className="text-[#94A3B8] text-[11px] mt-0.5">{stats.presentToday} present &middot; {stats.totalToday - stats.presentToday} absent</p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-amber-500">Not marked</p>
                <p className="text-amber-500 text-[11px] mt-0.5">Attendance pending</p>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#64748B] text-xs font-medium">Fee Collection</p>
              <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                <Icon name="BanknotesIcon" size={16} className="text-teal-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">{formatCurrency(stats?.feeCollectedMonth || 0)}</p>
            <p className="text-[#94A3B8] text-[11px] mt-0.5">{stats?.feeTarget ? `of ${formatCurrency(stats.feeTarget)} target` : 'This month'}</p>
          </div>

          <div className={`bg-white rounded-xl p-4 border ${(stats?.defaulterCount || 0) > 0 ? 'border-red-200' : 'border-[#E2E8F0]'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#64748B] text-xs font-medium">Pending Dues</p>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Icon name="ExclamationCircleIcon" size={16} className="text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.feePending || 0)}</p>
            <p className="text-[#94A3B8] text-[11px] mt-0.5">{stats?.defaulterCount || 0} defaulters</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#64748B] text-xs font-medium">Messages Today</p>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Icon name="ChatBubbleLeftRightIcon" size={16} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">{stats?.messagesToday || 0}</p>
            <p className="text-[#94A3B8] text-[11px] mt-0.5">{stats?.deliveredToday || 0} delivered &middot; {stats?.pendingQueries || 0} queries</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {quickActions.map(a => (
            <Link key={a.label} href={a.href} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 hover:border-[#0D9488]/30 hover:shadow-sm transition-all group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${a.color}`}>
                <Icon name={a.iconName} size={18} className={a.color.split(' ')[1]} />
              </div>
              <p className="text-[13px] font-medium text-[#1E293B] leading-tight">{a.label}</p>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">{a.sub}</p>
            </Link>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Fee Collection Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={feeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Collected']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Line type="monotone" dataKey="collected" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-4">Attendance Trend (14 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                <Area type="monotone" dataKey="pct" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defaulters + Recent Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fee Defaulters */}
          <div className="bg-white rounded-xl border border-[#E2E8F0]">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Fee Defaulters</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{defaulters.length} students &middot; {formatCurrency(stats?.overdueAmount || 0)} overdue</p>
              </div>
              {defaulters.length > 0 && (
                <Link href="/fees" className="text-xs font-medium text-[#0D9488] hover:underline">View all</Link>
              )}
            </div>
            {defaulters.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="CheckCircleIcon" size={32} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">No defaulters. All fees on track.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {defaulters.map(d => (
                  <div key={d.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#1E293B]">{d.studentName}</p>
                      <p className="text-[11px] text-[#94A3B8]">Class {d.class}-{d.section} &middot; Due {formatDate(d.dueDate)}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600">{formatCurrency(d.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-xl border border-[#E2E8F0]">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B]">Recent Messages</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{stats?.deliveredToday || 0} delivered today</p>
              </div>
              <Link href="/messages" className="text-xs font-medium text-[#0D9488] hover:underline">View all</Link>
            </div>
            {recentMessages.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="ChatBubbleLeftRightIcon" size={32} className="text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-sm text-[#64748B]">Messages will appear here once sent.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {recentMessages.map(m => (
                  <div key={m.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${msgTypeBadge(m.type)}`}>{m.type.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-[#CBD5E1]">{timeAgo(m.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-[#1E293B] line-clamp-1">{m.title || m.body}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-[#94A3B8]">{m.recipientCount} recipients</span>
                      {m.deliveredCount > 0 && <span className="text-[11px] text-emerald-600">{m.deliveredCount} delivered</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
