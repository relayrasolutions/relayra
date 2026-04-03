'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  rollNumber: string | null;
  class: string;
  section: string;
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'P', fullLabel: 'Present', icon: '✅', color: 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' },
  { value: 'absent', label: 'A', fullLabel: 'Absent', icon: '❌', color: 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' },
  { value: 'late', label: 'L', fullLabel: 'Late', icon: '⏰', color: 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' },
  { value: 'half_day', label: 'H', fullLabel: 'Half Day', icon: '🕐', color: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200' },
];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const loadAttendance = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    setLoaded(false);
    try {
      // Get assigned class from user profile
      const { data: userData } = await supabase
        .from('users')
        .select('assigned_class, assigned_section')
        .eq('id', user.id)
        .single();

      const assignedClass = userData?.assigned_class || '';
      const assignedSection = userData?.assigned_section || '';

      if (!assignedClass) {
        toast.error('No class assigned. Please contact admin.');
        setLoading(false);
        return;
      }

      const { data: studentsData } = await supabase
        .from('students')
        .select('id, name, roll_number, class, section')
        .eq('school_id', user.schoolId)
        .eq('class', assignedClass)
        .eq('section', assignedSection || 'A')
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
      })));
      setAttendance(attMap);
      setLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, user?.id, today]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

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
    } catch (err: any) {
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#1E3A5F] text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Relayra</h1>
            <p className="text-white/60 text-xs">Teacher Portal</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-white/60 text-xs">school_staff</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
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
              <p className="text-[#64748B] text-xs">Today's Attendance</p>
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
              { label: 'Unmarked', count: counts.unmarked, color: 'bg-gray-50 text-gray-700 border-gray-200' },
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
          <button
            onClick={markAllPresent}
            className="w-full mb-4 py-3 bg-[#0D9488] text-white rounded-xl font-semibold text-sm hover:bg-[#0B7A70] transition-colors"
          >
            ✅ Mark All Remaining Present ({counts.unmarked})
          </button>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl border border-[#E2E8F0] p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No class assigned */}
        {!loading && !loaded && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-[#1E293B] font-semibold">No Class Assigned</p>
            <p className="text-[#64748B] text-sm mt-1">Please contact your school administrator to assign a class.</p>
          </div>
        )}

        {/* Student List */}
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
              <div
                key={student.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                  currentStatus === 'present' ? 'border-green-200 bg-green-50/30' :
                  currentStatus === 'absent' ? 'border-red-200 bg-red-50/30' :
                  currentStatus === 'late' ? 'border-yellow-200 bg-yellow-50/30' :
                  currentStatus === 'half_day'? 'border-blue-200 bg-blue-50/30' : 'border-[#E2E8F0]'
                }`}
              >
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
                  {!isSaving && currentStatus && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => markStatus(student.id, opt.value)}
                      disabled={isSaving}
                      className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                        currentStatus === opt.value
                          ? opt.color + 'ring-2 ring-offset-1 ring-current' :'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="block text-base">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {loaded && students.length > 0 && (
          <div className="mt-6 bg-[#1E3A5F] rounded-xl p-4 text-white text-center">
            <p className="text-sm font-medium">
              {counts.unmarked === 0 ? '✅ All students marked!' : `${counts.unmarked} students remaining`}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {counts.present} Present · {counts.absent} Absent · {counts.late} Late · {counts.half_day} Half Day
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
