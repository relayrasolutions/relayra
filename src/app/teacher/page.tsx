'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, formatPhone, timeAgo, withTimeout } from '@/lib/supabase';
import { useAuth, isSessionExpired, clearLoginTs } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';
import toast from 'react-hot-toast';

interface Student {
  id: string; name: string; rollNumber: string | null;
  class: string; section: string; parentName: string;
  parentPhone: string; religion: string | null;
}

interface MessageItem {
  id: string; title: string | null; body: string;
  type: string; sentAt: string | null; recipientCount: number;
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', fullLabel: 'Present', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', activeColor: 'bg-emerald-100 text-emerald-800 border-emerald-400 ring-1 ring-emerald-400' },
  { value: 'absent', label: 'A', fullLabel: 'Absent', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', activeColor: 'bg-red-100 text-red-800 border-red-400 ring-1 ring-red-400' },
  { value: 'late', label: 'L', fullLabel: 'Late', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', activeColor: 'bg-amber-100 text-amber-800 border-amber-400 ring-1 ring-amber-400' },
  { value: 'half_day', label: 'H', fullLabel: 'Half Day', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', activeColor: 'bg-blue-100 text-blue-800 border-blue-400 ring-1 ring-blue-400' },
];

type TabType = 'attendance' | 'students' | 'messages';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function TeacherPage() {
  const { user, session, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStale, setLoadingStale] = useState(false);
  const [assignedClass, setAssignedClass] = useState('');
  const [assignedSection, setAssignedSection] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!user?.schoolId) { if (!silent) setLoading(false); return; }
    if (!silent) {
      setLoading(true);
      setLoaded(false);
      setError(null);
    }
    try {
      const { data: userData } = await withTimeout(
        supabase.from('users').select('assigned_class, assigned_section').eq('id', user.id).single(),
        10000,
        'Teacher profile fetch',
      );
      const cls = userData?.assigned_class || '';
      const sec = userData?.assigned_section || '';
      setAssignedClass(cls);
      setAssignedSection(sec);

      if (!cls) { setLoading(false); return; }

      const { data: studentsData } = await withTimeout(
        supabase.from('students')
          .select('id, name, roll_number, class, section, parent_name, parent_phone, religion')
          .eq('school_id', user.schoolId).eq('class', cls).eq('section', sec || 'A').eq('status', 'active').order('roll_number'),
        10000,
        'Students fetch',
      );

      const { data: attData } = await withTimeout(
        supabase.from('attendance')
          .select('student_id, status').eq('school_id', user.schoolId).eq('date', today)
          .in('student_id', (studentsData || []).map(s => s.id)),
        10000,
        'Attendance fetch',
      );

      const attMap: Record<string, string> = {};
      (attData || []).forEach(a => { attMap[a.student_id] = a.status; });

      setStudents((studentsData || []).map(s => ({
        id: s.id, name: s.name, rollNumber: s.roll_number, class: s.class, section: s.section,
        parentName: s.parent_name, parentPhone: s.parent_phone, religion: s.religion,
      })));
      setAttendance(attMap);

      const { data: msgData } = await withTimeout(
        supabase.from('messages')
          .select('id, title, body, type, sent_at, recipient_count')
          .eq('school_id', user.schoolId).order('created_at', { ascending: false }).limit(20),
        10000,
        'Messages fetch',
      );

      setMessages((msgData || []).map(m => ({
        id: m.id, title: m.title, body: m.body, type: m.type,
        sentAt: m.sent_at, recipientCount: m.recipient_count,
      })));
      if (!silent) setLoaded(true);
    } catch (err: any) {
      console.error('Failed to load teacher data:', err);
      if (!silent) setError(err.message || 'Failed to load data.');
    } finally { if (!silent) setLoading(false); }
  }, [user?.schoolId, user?.id, today]);

  useEffect(() => { loadData(); }, [loadData]);

  // Redirect to /login ONLY when auth finished AND no session exists. If a
  // session is present but user hasn't resolved (reload-after-login race),
  // keep the spinner — never bounce to /login prematurely.
  useEffect(() => {
    if (!authLoading && !user && !session) router.replace('/login');
  }, [authLoading, user, session, router]);

  // Wrong role: route to the correct dashboard (NOT /login).
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'super_admin') router.replace('/admin');
      else if (user.role === 'school_admin') router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  // 24-hour hard session check on mount ONLY. No focus / visibility /
  // pageshow listeners anywhere — tab switches must never trigger auth work.
  // If the recorded login time is older than 24h, force sign-out.
  useEffect(() => {
    if (isSessionExpired()) {
      clearLoginTs();
      supabase.auth.signOut().finally(() => router.replace('/login'));
    }
  }, [router]);

  useEffect(() => {
    if (!loading) { setLoadingStale(false); return; }
    const timer = setTimeout(() => setLoadingStale(true), 15000);
    return () => clearTimeout(timer);
  }, [loading]);

  const markStatus = async (studentId: string, status: string) => {
    setSaving(studentId);
    try {
      const existing = attendance[studentId];
      if (existing) {
        await supabase.from('attendance').update({ status, marked_by: user!.id }).eq('student_id', studentId).eq('date', today);
      } else {
        await supabase.from('attendance').insert({
          school_id: user!.schoolId, student_id: studentId,
          date: today, status, marked_by: user!.id, marked_via: 'teacher_app',
        });
      }
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    } catch { toast.error('Failed to save'); }
    finally { setSaving(null); }
  };

  const markAllPresent = async () => {
    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length === 0) { toast.success('All students already marked'); return; }
    for (const s of unmarked) { await markStatus(s.id, 'present'); }
    toast.success(`Marked ${unmarked.length} students present`);
  };

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    half_day: Object.values(attendance).filter(s => s === 'half_day').length,
    unmarked: students.filter(s => !attendance[s.id]).length,
  };

  // Spinner while auth resolving, OR session exists but user not loaded,
  // OR user is wrong role and about to be redirected.
  if (authLoading || (session && !user) || (user && user.role !== 'school_staff') || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const sidebarNav = [
    { key: 'attendance' as TabType, label: 'Attendance', iconName: 'ClipboardDocumentCheckIcon' },
    { key: 'students' as TabType, label: 'My Students', iconName: 'UsersIcon' },
    { key: 'messages' as TabType, label: 'Messages', iconName: 'ChatBubbleLeftRightIcon' },
  ];

  const msgTypeBadge = (type: string) => {
    const m: Record<string, string> = {
      fee_reminder: 'bg-amber-50 text-amber-700', attendance: 'bg-blue-50 text-blue-700',
      notice: 'bg-slate-100 text-slate-700', emergency: 'bg-red-50 text-red-700',
      birthday: 'bg-pink-50 text-pink-700',
    };
    return m[type] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-[232px] bg-[#1E3A5F] flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <svg className="w-[18px] h-[18px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-[15px]">Relayra</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <Icon name="XMarkIcon" size={20} className="text-white/50" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-white/30 uppercase">Classroom</p>
          <div className="space-y-0.5">
            {sidebarNav.map(item => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  activeTab === item.key ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                }`}
              >
                <Icon name={item.iconName} size={18} className={activeTab === item.key ? 'text-white' : 'text-white/50'} />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-[#0D9488]/80 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate">{user.name}</p>
              <p className="text-white/35 text-[11px] truncate">Class Teacher</p>
            </div>
            <button onClick={async () => {
              // Clear state first (signOut empties user/session + localStorage),
              // wait a tick so React state settles, then navigate. See Issue 5.
              await signOut();
              await new Promise((r) => setTimeout(r, 100));
              router.replace('/login');
            }} className="text-white/35 hover:text-white" title="Sign out">
              <Icon name="ArrowRightOnRectangleIcon" size={16} className="text-white/35" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#E2E8F0] px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#64748B]">
              <Icon name="Bars3Icon" size={22} className="text-[#64748B]" />
            </button>
            <div>
              <p className="text-[#1E293B] font-semibold text-sm">{getGreeting()}, {user.name?.split(' ')[0]}</p>
              <p className="text-[#94A3B8] text-[11px]">Class {assignedClass}-{assignedSection} &middot; {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-red-700 font-medium text-sm mb-2">{error}</p>
              <button onClick={() => { setError(null); loadData(); }} className="text-sm text-[#0D9488] font-semibold hover:underline">Retry</button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-[#64748B] text-[11px] font-medium">My Students</p>
              <p className="text-xl font-bold text-[#1E293B] mt-1">{students.length}</p>
              <p className="text-[#94A3B8] text-[10px] mt-0.5">Class {assignedClass}-{assignedSection}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-[#64748B] text-[11px] font-medium">Attendance</p>
              {loaded ? (
                <>
                  <p className={`text-xl font-bold mt-1 ${counts.unmarked > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {counts.unmarked > 0 ? `${students.length - counts.unmarked}/${students.length}` : 'Done'}
                  </p>
                  <p className="text-[#94A3B8] text-[10px] mt-0.5">{counts.unmarked > 0 ? `${counts.unmarked} remaining` : 'All marked'}</p>
                </>
              ) : (
                <p className="text-lg font-bold text-[#94A3B8] mt-1">--</p>
              )}
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
              <p className="text-[#64748B] text-[11px] font-medium">Messages</p>
              <p className="text-xl font-bold text-[#1E293B] mt-1">{messages.length}</p>
              <p className="text-[#94A3B8] text-[10px] mt-0.5">Recent school messages</p>
            </div>
          </div>

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Date & Class Info */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0D9488]/10 rounded-lg flex items-center justify-center">
                    <Icon name="CalendarDaysIcon" size={20} className="text-[#0D9488]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1E293B] text-sm">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="text-[#94A3B8] text-xs">Class {assignedClass}-{assignedSection} &middot; {students.length} students</p>
                  </div>
                </div>
                {loaded && counts.unmarked > 0 && (
                  <button onClick={markAllPresent} className="bg-[#0D9488] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#0B7A70] transition-colors hidden sm:block">
                    Mark All Present
                  </button>
                )}
              </div>

              {/* Stats Bar */}
              {loaded && (
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: 'Present', count: counts.present, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { label: 'Absent', count: counts.absent, color: 'bg-red-50 text-red-700 border-red-200' },
                    { label: 'Late', count: counts.late, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Half', count: counts.half_day, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { label: 'Left', count: counts.unmarked, color: 'bg-slate-50 text-slate-600 border-slate-200' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg border p-2 text-center ${s.color}`}>
                      <p className="text-lg font-bold">{s.count}</p>
                      <p className="text-[10px] font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Mobile Mark All */}
              {loaded && counts.unmarked > 0 && (
                <button onClick={markAllPresent} className="w-full sm:hidden bg-[#0D9488] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#0B7A70] transition-colors">
                  Mark All Remaining Present ({counts.unmarked})
                </button>
              )}

              {/* Loading */}
              {loading && (
                loadingStale ? (
                  <div className="text-center py-12">
                    <p className="text-[#64748B] mb-4 text-sm">Taking longer than expected.</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#0D9488] text-white text-sm rounded-lg">Reload</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 animate-pulse">
                        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full" /><div className="flex-1"><div className="h-4 bg-gray-200 rounded w-32 mb-2" /><div className="h-3 bg-gray-100 rounded w-20" /></div></div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {!loading && !loaded && (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
                  <Icon name="ClipboardDocumentCheckIcon" size={36} className="text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-[#1E293B] font-semibold">No Class Assigned</p>
                  <p className="text-[#94A3B8] text-sm mt-1">Please contact your school administrator.</p>
                </div>
              )}

              {loaded && students.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
                  <Icon name="UsersIcon" size={36} className="text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-[#1E293B] font-semibold">No Students Found</p>
                  <p className="text-[#94A3B8] text-sm mt-1">No active students in your assigned class.</p>
                </div>
              )}

              {/* Student Attendance Cards */}
              <div className="space-y-2">
                {students.map((student, idx) => {
                  const currentStatus = attendance[student.id];
                  const isSaving = saving === student.id;
                  return (
                    <div key={student.id} className={`bg-white rounded-xl border p-4 transition-all ${
                      currentStatus === 'present' ? 'border-emerald-200' :
                      currentStatus === 'absent' ? 'border-red-200' :
                      currentStatus === 'late' ? 'border-amber-200' :
                      currentStatus === 'half_day' ? 'border-blue-200' : 'border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1E293B] text-sm">{idx + 1}. {student.name}</p>
                          <p className="text-[#94A3B8] text-[11px]">Roll: {student.rollNumber || 'N/A'}</p>
                        </div>
                        {isSaving && <div className="w-4 h-4 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />}
                        {!isSaving && currentStatus && <Icon name="CheckCircleIcon" size={16} className="text-emerald-500" />}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {STATUS_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => markStatus(student.id, opt.value)} disabled={isSaving}
                            className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                              currentStatus === opt.value ? opt.activeColor : opt.color
                            }`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {loaded && students.length > 0 && (
                <div className="bg-[#1E3A5F] rounded-xl p-4 text-white text-center">
                  <p className="text-sm font-medium">{counts.unmarked === 0 ? 'All students marked!' : `${counts.unmarked} students remaining`}</p>
                  <p className="text-white/50 text-xs mt-1">{counts.present}P &middot; {counts.absent}A &middot; {counts.late}L &middot; {counts.half_day}H</p>
                </div>
              )}
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="font-semibold text-[#1E293B] text-sm">Class {assignedClass}-{assignedSection}</h3>
                <p className="text-[11px] text-[#94A3B8]">{students.length} active students</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>
              ) : students.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
                  <Icon name="UsersIcon" size={36} className="text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-[#1E293B] font-semibold">No Students</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                  {students.map((s, idx) => (
                    <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-semibold">{s.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1E293B] text-sm">{idx + 1}. {s.name}</p>
                        <p className="text-[#94A3B8] text-[11px]">Roll: {s.rollNumber || 'N/A'} &middot; {s.parentName} &middot; {formatPhone(s.parentPhone)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div className="space-y-3">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <h3 className="font-semibold text-[#1E293B] text-sm">Recent Messages</h3>
                <p className="text-[11px] text-[#94A3B8]">Messages sent by your school</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-[#E2E8F0]">
                  <Icon name="ChatBubbleLeftRightIcon" size={36} className="text-[#CBD5E1] mx-auto mb-3" />
                  <p className="text-[#1E293B] font-semibold">No Messages</p>
                  <p className="text-[#94A3B8] text-sm mt-1">Messages will appear here once sent.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                  {messages.map(m => (
                    <div key={m.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${msgTypeBadge(m.type)}`}>{m.type.replace(/_/g, ' ')}</span>
                        <span className="text-[11px] text-[#CBD5E1]">{m.sentAt ? timeAgo(m.sentAt) : 'Pending'}</span>
                      </div>
                      <p className="text-[13px] text-[#1E293B] font-medium">{m.title || m.type.replace(/_/g, ' ')}</p>
                      <p className="text-[12px] text-[#94A3B8] line-clamp-2 mt-0.5">{m.body}</p>
                      <p className="text-[11px] text-[#CBD5E1] mt-1">{m.recipientCount} recipients</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
