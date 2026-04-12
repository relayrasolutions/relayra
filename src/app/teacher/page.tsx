'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, formatPhone, timeAgo } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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
  { value: 'present', label: 'P', fullLabel: 'Present', icon: '✅', color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  { value: 'absent', label: 'A', fullLabel: 'Absent', icon: '❌', color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'late', label: 'L', fullLabel: 'Late', icon: '⏰', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' },
  { value: 'half_day', label: 'H', fullLabel: 'Half Day', icon: '🕐', color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
];

type TabType = 'attendance' | 'students' | 'messages';

export default function TeacherPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingStale, setLoadingStale] = useState(false);
  const [assignedClass, setAssignedClass] = useState('');
  const [assignedSection, setAssignedSection] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const loadData = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setLoaded(false);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('assigned_class, assigned_section')
        .eq('id', user.id)
        .single();

      const cls = userData?.assigned_class || '';
      const sec = userData?.assigned_section || '';
      setAssignedClass(cls);
      setAssignedSection(sec);

      if (!cls) {
        toast.error('No class assigned. Please contact admin.');
        setLoading(false);
        return;
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, roll_number, class, section, parent_name, parent_phone, religion')
        .eq('school_id', user.schoolId)
        .eq('class', cls)
        .eq('section', sec || 'A')
        .eq('status', 'active')
        .order('roll_number');

      const { data: attData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('school_id', user.schoolId)
        .eq('date', today)
        .in('student_id', (studentsData || []).map(s => s.id));

      const attMap: Record<string, string> = {};
      (attData || []).forEach(a => { attMap[a.student_id] = a.status; });

      setStudents((studentsData || []).map(s => ({
        id: s.id, name: s.name, rollNumber: s.roll_number, class: s.class, section: s.section,
        parentName: s.parent_name, parentPhone: s.parent_phone, religion: s.religion,
      })));
      setAttendance(attMap);

      // Load recent messages for this school
      const { data: msgData } = await supabase
        .from('messages')
        .select('id, title, body, type, sent_at, recipient_count')
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false })
        .limit(20);

      setMessages((msgData || []).map(m => ({
        id: m.id, title: m.title, body: m.body, type: m.type,
        sentAt: m.sent_at, recipientCount: m.recipient_count,
      })));

      setLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, user?.id, today]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  // Re-fetch data when tab becomes visible again (handles idle/sleep)
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        loadData();
      } else {
        router.replace('/login');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [loadData, router]);

  // Skeleton timeout — if loading takes >15s, show stale state
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
        await supabase.from('attendance').update({ status, marked_by: user!.id })
          .eq('student_id', studentId).eq('date', today);
      } else {
        await supabase.from('attendance').insert({
          school_id: user!.schoolId, student_id: studentId,
          date: today, status, marked_by: user!.id, marked_via: 'teacher_app',
        });
      }
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const markAllPresent = async () => {
    const unmarked = students.filter(s => !attendance[s.id]);
    if (unmarked.length === 0) { toast.success('All students already marked'); return; }
    for (const s of unmarked) {
      await markStatus(s.id, 'present');
    }
    toast.success(`Marked ${unmarked.length} students present`);
  };

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    half_day: Object.values(attendance).filter(s => s === 'half_day').length,
    unmarked: students.filter(s => !attendance[s.id]).length,
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><p className="text-[#64748B]">Loading...</p></div>;
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'attendance', label: 'Attendance', icon: '📋' },
    { key: 'students', label: 'Students', icon: '👨‍🎓' },
    { key: 'messages', label: 'Messages', icon: '💬' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold">Relayra</h1>
            <p className="text-white/60 text-xs">Teacher Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-white/60 text-xs">Class {assignedClass}-{assignedSection}</p>
            </div>
            <button onClick={async () => { await signOut(); window.location.href = '/login'; }} className="text-white/50 hover:text-white" title="Sign out">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-[72px] z-10">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-center text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-[#64748B] hover:text-[#1E293B]'}`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <>
            {/* Date & Class Info */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0D9488]/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#0D9488]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">{todayDisplay}</p>
                  <p className="text-[#64748B] text-xs">Class {assignedClass}-{assignedSection} · {students.length} students</p>
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            {loaded && (
              <div className="grid grid-cols-5 gap-2 mb-4">
                {[
                  { label: 'Present', count: counts.present, color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Absent', count: counts.absent, color: 'bg-red-50 text-red-700 border-red-200' },
                  { label: 'Late', count: counts.late, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { label: 'Half', count: counts.half_day, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'Left', count: counts.unmarked, color: 'bg-gray-50 text-gray-700 border-gray-200' },
                ].map(s => (
                  <div key={s.label} className={`rounded-lg border p-2 text-center ${s.color}`}>
                    <p className="text-lg font-bold">{s.count}</p>
                    <p className="text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Mark All Present */}
            {loaded && counts.unmarked > 0 && (
              <button onClick={markAllPresent} className="w-full mb-4 py-3 bg-[#0D9488] text-white rounded-xl font-semibold text-sm hover:bg-[#0B7A70] transition-colors">
                ✅ Mark All Remaining Present ({counts.unmarked})
              </button>
            )}

            {/* Loading */}
            {loading && (
              loadingStale ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-[#64748B] mb-4">Data is taking longer than expected to load.</p>
                  <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#0D9488] text-white text-sm font-semibold rounded-lg hover:bg-[#0f766e] transition-colors">Reload</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-32 mb-2" /><div className="h-3 bg-gray-100 rounded w-20" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* No class assigned */}
            {!loading && !loaded && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-[#1E293B] font-semibold">No Class Assigned</p>
                <p className="text-[#64748B] text-sm mt-1">Please contact your school administrator to assign a class.</p>
              </div>
            )}

            {/* Student Attendance Cards */}
            {loaded && students.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👨‍🎓</div>
                <p className="text-[#1E293B] font-semibold">No Students Found</p>
                <p className="text-[#64748B] text-sm mt-1">No active students in your assigned class.</p>
              </div>
            )}

            <div className="space-y-3">
              {students.map((student, idx) => {
                const currentStatus = attendance[student.id];
                const isSaving = saving === student.id;
                return (
                  <div key={student.id} className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                    currentStatus === 'present' ? 'border-green-200 bg-green-50/30' :
                    currentStatus === 'absent' ? 'border-red-200 bg-red-50/30' :
                    currentStatus === 'late' ? 'border-yellow-200 bg-yellow-50/30' :
                    currentStatus === 'half_day' ? 'border-blue-200 bg-blue-50/30' : 'border-[#E2E8F0]'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{student.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E293B] text-sm">{idx + 1}. {student.name}</p>
                        <p className="text-[#64748B] text-xs">Roll: {student.rollNumber || 'N/A'}</p>
                      </div>
                      {isSaving && (
                        <svg className="animate-spin w-4 h-4 text-[#0D9488]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {!isSaving && currentStatus && <span className="text-green-500 text-sm">✓</span>}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => markStatus(student.id, opt.value)} disabled={isSaving}
                          className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                            currentStatus === opt.value ? opt.color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}>
                          <span className="block text-base">{opt.icon}</span>{opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {loaded && students.length > 0 && (
              <div className="mt-6 bg-[#1E3A5F] rounded-xl p-4 text-white text-center">
                <p className="text-sm font-medium">{counts.unmarked === 0 ? '✅ All students marked!' : `${counts.unmarked} students remaining`}</p>
                <p className="text-white/60 text-xs mt-1">
                  {counts.present} Present · {counts.absent} Absent · {counts.late} Late · {counts.half_day} Half Day
                </p>
              </div>
            )}
          </>
        )}

        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 mb-4">
              <h3 className="font-semibold text-[#1E293B]">Class {assignedClass}-{assignedSection} Students</h3>
              <p className="text-xs text-[#64748B]">{students.length} active students</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin w-6 h-6 text-[#0D9488] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">👨‍🎓</div>
                <p className="text-[#1E293B] font-semibold">No Students</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((s, idx) => (
                  <div key={s.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">{s.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E293B] text-sm">{idx + 1}. {s.name}</p>
                        <p className="text-[#64748B] text-xs">Roll: {s.rollNumber || 'N/A'} · {s.religion || 'Not Specified'}</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#F8FAFC] rounded-lg p-2">
                        <p className="text-[#64748B]">Parent</p>
                        <p className="text-[#1E293B] font-medium">{s.parentName}</p>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-lg p-2">
                        <p className="text-[#64748B]">Phone</p>
                        <p className="text-[#1E293B] font-medium">{formatPhone(s.parentPhone)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4 mb-4">
              <h3 className="font-semibold text-[#1E293B]">Recent Messages</h3>
              <p className="text-xs text-[#64748B]">Messages sent by your school</p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <svg className="animate-spin w-6 h-6 text-[#0D9488] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-[#1E293B] font-semibold">No Messages</p>
                <p className="text-[#64748B] text-sm mt-1">No messages have been sent yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map(m => (
                  <div key={m.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1E293B] text-sm">{m.title || m.type.replace('_', ' ')}</p>
                        <p className="text-xs text-[#64748B]">{m.sentAt ? timeAgo(m.sentAt) : 'Pending'} · {m.recipientCount} recipients</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.type === 'emergency' ? 'bg-red-100 text-red-700' :
                        m.type === 'fee_reminder' ? 'bg-amber-100 text-amber-700' :
                        m.type === 'attendance' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{m.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-[#64748B] line-clamp-2">{m.body}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
