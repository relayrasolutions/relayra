'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, formatCurrency, timeAgo } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalStudents: number;
  newThisMonth: number;
  presentToday: number;
  totalToday: number;
  attendanceMarked: boolean;
  feeCollectedMonth: number;
  feePending: number;
  messagesToday: number;
  pendingQueries: number;
}

interface ActivityItem {
  id: string;
  action: string;
  description: string | null;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string | null;
  color: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  exam: '📝 Exam', ptm: '👨‍👩‍👧 PTM', holiday: '🏖️ Holiday',
  event: '🎉 Event', result_day: '📊 Result Day', custom: '📌 Custom',
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeChartData, setFeeChartData] = useState<any[]>([]);
  const [attendanceChartData, setAttendanceChartData] = useState<any[]>([]);
  const [classWiseData, setClassWiseData] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyMsg, setEmergencyMsg] = useState('');
  const [emergencySending, setEmergencySending] = useState(false);
  const [loadingStale, setLoadingStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

      const [studentsRes, attendanceRes, feeRes, messagesRes, queriesRes, activityRes, eventsRes] = await Promise.all([
        supabase.from('students').select('id, created_at, class').eq('school_id', user.schoolId).eq('status', 'active'),
        supabase.from('attendance').select('status').eq('school_id', user.schoolId).eq('date', today),
        supabase.from('fee_records').select('paid_amount, total_amount, status, payment_date, students!inner(class)').eq('school_id', user.schoolId),
        supabase.from('messages').select('id').eq('school_id', user.schoolId).gte('created_at', today),
        supabase.from('parent_queries').select('id').eq('school_id', user.schoolId).eq('status', 'pending'),
        supabase.from('activity_log').select('id, action, description, created_at').eq('school_id', user.schoolId).order('created_at', { ascending: false }).limit(15),
        supabase.from('academic_calendar').select('id, title, event_type, start_date, end_date, color').eq('school_id', user.schoolId).gte('start_date', today).order('start_date').limit(5),
      ]);

      const students = studentsRes.data || [];
      const newThisMonth = students.filter(s => s.created_at >= monthStart).length;
      const attendance = attendanceRes.data || [];
      const presentToday = attendance.filter(a => a.status === 'present').length;
      const fees = feeRes.data || [];
      const feeCollectedMonth = fees.filter((f: any) => f.payment_date && f.payment_date >= monthStart).reduce((sum: number, f: any) => sum + (f.paid_amount || 0), 0);
      const feePending = fees.filter((f: any) => f.status !== 'paid' && f.status !== 'waived').reduce((sum: number, f: any) => sum + (f.total_amount - f.paid_amount), 0);

      setStats({
        totalStudents: students.length,
        newThisMonth,
        presentToday,
        totalToday: attendance.length,
        attendanceMarked: attendance.length > 0,
        feeCollectedMonth,
        feePending,
        messagesToday: (messagesRes.data || []).length,
        pendingQueries: (queriesRes.data || []).length,
      });

      setActivityLog((activityRes.data || []).map(a => ({ id: a.id, action: a.action, description: a.description, createdAt: a.created_at })));

      setUpcomingEvents((eventsRes.data || []).map(e => ({
        id: e.id, title: e.title, eventType: e.event_type,
        startDate: e.start_date, endDate: e.end_date, color: e.color,
      })));

      // Fee chart - last 6 months
      const feeChart = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const amount = fees.filter((f: any) => f.payment_date && f.payment_date >= mStart && f.payment_date <= mEnd).reduce((sum: number, f: any) => sum + (f.paid_amount || 0), 0);
        feeChart.push({ month: monthName, amount: Math.round(amount / 100) });
      }
      setFeeChartData(feeChart);

      // Class-wise fee data
      const classMap: Record<string, { collected: number; pending: number }> = {};
      fees.forEach((f: any) => {
        const cls = f.students?.class || 'Unknown';
        if (!classMap[cls]) classMap[cls] = { collected: 0, pending: 0 };
        classMap[cls].collected += f.paid_amount || 0;
        if (f.status !== 'paid' && f.status !== 'waived') {
          classMap[cls].pending += (f.total_amount - f.paid_amount);
        }
      });
      const classOrder = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
      const classData = Object.entries(classMap)
        .sort(([a], [b]) => classOrder.indexOf(a) - classOrder.indexOf(b))
        .slice(0, 8)
        .map(([cls, data]) => ({
          class: `Cls ${cls}`,
          collected: Math.round(data.collected / 100),
          pending: Math.round(data.pending / 100),
        }));
      setClassWiseData(classData);

      // Attendance chart - last 14 days (single query instead of 14 sequential)
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      const startDateStr = fourteenDaysAgo.toISOString().split('T')[0];
      const { data: allAttData } = await supabase.from('attendance').select('date, status').eq('school_id', user.schoolId).gte('date', startDateStr).lte('date', today);

      const attByDate: Record<string, { total: number; present: number }> = {};
      (allAttData || []).forEach(a => {
        if (!attByDate[a.date]) attByDate[a.date] = { total: 0, present: 0 };
        attByDate[a.date].total++;
        if (a.status === 'present') attByDate[a.date].present++;
      });

      const attChart = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        const dayData = attByDate[dateStr] || { total: 0, present: 0 };
        attChart.push({ day: dayName, pct: dayData.total > 0 ? Math.round((dayData.present / dayData.total) * 100) : 0 });
      }
      setAttendanceChartData(attChart);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  // Re-fetch data when tab becomes visible again (handles idle/sleep)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchDashboard();
      } else {
        router.replace('/login');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchDashboard, router]);

  // Skeleton timeout — if loading takes >15s, show stale state
  useEffect(() => {
    if (!loading) { setLoadingStale(false); return; }
    const timer = setTimeout(() => setLoadingStale(true), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (authLoading || !user) {
    return (
      <AppLayout>
        <div className="text-center py-12"><p className="text-[#64748B]">Loading...</p></div>
      </AppLayout>
    );
  }

  const sendEmergency = async () => {
    if (!emergencyMsg.trim() || !user?.schoolId) return;
    setEmergencySending(true);
    try {
      const { data: students } = await supabase.from('students').select('id, parent_phone').eq('school_id', user.schoolId).eq('status', 'active');
      const { data: msgData, error } = await supabase.from('messages').insert({
        school_id: user.schoolId,
        type: 'emergency',
        title: 'Emergency Broadcast',
        body: emergencyMsg,
        target_type: 'all',
        recipient_count: (students || []).length,
        sent_count: (students || []).length,
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_by: user.id,
      }).select().single();

      if (!error && msgData && students) {
        await supabase.from('message_recipients').insert(students.map(s => ({
          message_id: msgData.id,
          student_id: s.id,
          parent_phone: s.parent_phone,
          status: 'sent',
        })));
        await supabase.from('activity_log').insert({
          school_id: user.schoolId,
          user_id: user.id,
          action: 'message_sent',
          description: `Emergency broadcast sent to ${students.length} parents`,
          entity_type: 'message',
          entity_id: msgData.id,
        });
      }
      toast.success('Emergency broadcast sent!');
      setEmergencyOpen(false);
      setEmergencyMsg('');
    } catch {
      toast.error('Failed to send emergency broadcast');
    } finally {
      setEmergencySending(false);
    }
  };

  const getAttendanceColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      student_added: '👨‍🎓', fee_created: '💰', payment_received: '✅',
      message_sent: '💬', attendance_marked: '📋',
    };
    return icons[action] || '📌';
  };

  const formatEventDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `In ${diff} days`;
  };

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-[#1E293B] font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-[#64748B] text-sm mb-4">{error}</p>
          <button onClick={() => { setError(null); fetchDashboard(); }} className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-[#0f766e] transition-colors">
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    if (loadingStale) {
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[#64748B] mb-4">Dashboard is taking longer than expected to load.</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-[#0f766e] transition-colors">
              Reload
            </button>
          </div>
        </AppLayout>
      );
    }
    return (
      <AppLayout>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </AppLayout>
    );
  }

  const attendancePct = stats && stats.totalToday > 0 ? Math.round((stats.presentToday / stats.totalToday) * 100) : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard</h1>
            <p className="text-[#64748B] text-sm">Welcome back, {user?.name}</p>
          </div>
          <button onClick={fetchDashboard} className="text-[#64748B] hover:text-[#1E293B] p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B] text-sm font-medium">Total Students</p>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1E293B]">{stats?.totalStudents || 0}</p>
            <p className="text-[#64748B] text-xs mt-1">+{stats?.newThisMonth || 0} new this month</p>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B] text-sm font-medium">Today&apos;s Attendance</p>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            {stats?.attendanceMarked ? (
              <>
                <p className={`text-3xl font-bold ${getAttendanceColor(attendancePct)}`}>{attendancePct}%</p>
                <p className="text-[#64748B] text-xs mt-1">{stats.presentToday}/{stats.totalToday} present</p>
              </>
            ) : (
              <>
                <p className="text-xl font-bold text-orange-500">Not marked</p>
                <p className="text-[#64748B] text-xs mt-1">⚠️ Attendance pending</p>
              </>
            )}
          </div>

          {/* Fee Collection */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B] text-sm font-medium">Fee Collection (Month)</p>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1E293B]">{formatCurrency(stats?.feeCollectedMonth || 0)}</p>
            <p className="text-[#64748B] text-xs mt-1">{formatCurrency(stats?.feePending || 0)} pending</p>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[#64748B] text-sm font-medium">Messages Today</p>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1E293B]">{stats?.messagesToday || 0}</p>
            <p className="text-[#64748B] text-xs mt-1">{stats?.pendingQueries || 0} parent queries pending</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/attendance" className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3 hover:border-[#0D9488] hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1E293B]">Upload Attendance</span>
          </Link>
          <Link href="/messages" className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3 hover:border-[#0D9488] hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1E293B]">Send Notice</span>
          </Link>
          <Link href="/reports" className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3 hover:border-[#0D9488] hover:shadow-md transition-all group">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-[#1E293B]">View Fee Report</span>
          </Link>
          <button onClick={() => setEmergencyOpen(true)} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 hover:bg-red-100 transition-all">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-red-700">🚨 Emergency Broadcast</span>
          </button>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <h3 className="text-[#1E293B] font-semibold mb-4">Fee Collection Trend (6 Months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={feeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`, 'Collected']} />
                <Line type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <h3 className="text-[#1E293B] font-semibold mb-4">Attendance Trend (14 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} />
                <Area type="monotone" dataKey="pct" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class-wise Fee Chart + Upcoming Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <h3 className="text-[#1E293B] font-semibold mb-4">Class-wise Fee Status</h3>
            {classWiseData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[#64748B] text-sm">No fee data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classWiseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="class" tick={{ fontSize: 11, fill: '#64748B' }} width={50} />
                  <Tooltip formatter={(v: number) => [`Rs. ${v.toLocaleString('en-IN')}`]} />
                  <Legend />
                  <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Upcoming Events Widget */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#1E293B] font-semibold">Upcoming Events</h3>
              <Link href="/calendar" className="text-[#0D9488] text-xs font-medium hover:underline">View all →</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">📅</div>
                <p className="text-[#64748B] text-sm">No upcoming events</p>
                <Link href="/calendar" className="text-[#0D9488] text-xs font-medium hover:underline mt-1 block">Add events →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(e => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">{e.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#64748B]">{formatEventDate(e.startDate)}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: e.color + '20', color: e.color }}>
                          {daysUntil(e.startDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
          <h3 className="text-[#1E293B] font-semibold mb-4">Recent Activity</h3>
          {activityLog.length === 0 ? (
            <div className="text-center py-8 text-[#64748B]">
              <p className="text-4xl mb-2">📋</p>
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityLog.map(item => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
                  <span className="text-xl">{getActionIcon(item.action)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1E293B]">{item.description || item.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{timeAgo(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Modal */}
      {emergencyOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-red-700">Emergency Broadcast</h2>
            </div>
            <p className="text-sm text-[#64748B] mb-4">This will send a message to ALL parents immediately.</p>
            <textarea
              value={emergencyMsg}
              onChange={e => setEmergencyMsg(e.target.value)}
              placeholder="Enter emergency message..."
              rows={4}
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setEmergencyOpen(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={sendEmergency} disabled={emergencySending || !emergencyMsg.trim()} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {emergencySending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
