'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface Student {
  id: string; name: string; rollNumber: string | null;
  class: string; section: string;
}

interface AttendanceRecord {
  studentId: string; status: string;
}

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const STATUS_OPTIONS = [
  { value: 'present', label: 'P', icon: '✅', color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'absent', label: 'A', icon: '❌', color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'late', label: 'L', icon: '⏰', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { value: 'half_day', label: 'H', icon: '🕐', color: 'bg-blue-100 text-blue-700 border-blue-300' },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'mark' | 'reports' | 'alerts'>('mark');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Reports
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportClass, setReportClass] = useState('');

  // Alert rules
  const [alertRules, setAlertRules] = useState({ consecutiveAbsent: 2, monthlyAbsent: 5, ptmDayAlert: true });
  const [savingAlerts, setSavingAlerts] = useState(false);

  const loadAttendance = useCallback(async () => {
    if (!selectedClass || !selectedSection || !user?.schoolId) return;
    setLoading(true);
    setLoaded(false);
    try {
      const { data: studentsData } = await supabase
        .from('students').select('id, name, roll_number, class, section')
        .eq('school_id', user.schoolId).eq('class', selectedClass).eq('section', selectedSection)
        .eq('status', 'active').order('roll_number');

      const { data: attData } = await supabase
        .from('attendance').select('student_id, status')
        .eq('school_id', user.schoolId).eq('date', selectedDate)
        .in('student_id', (studentsData || []).map(s => s.id));

      const attMap: Record<string, string> = {};
      (attData || []).forEach(a => { attMap[a.student_id] = a.status; });

      setStudents((studentsData || []).map(s => ({ id: s.id, name: s.name, rollNumber: s.roll_number, class: s.class, section: s.section })));
      setAttendance(attMap);
      setLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, selectedDate, user?.schoolId]);

  const loadAlertRules = useCallback(async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('schools').select('consecutive_absent_alert, monthly_absent_alert, ptm_day_alert_enabled').eq('id', user.schoolId).single();
    if (data) {
      setAlertRules({
        consecutiveAbsent: data.consecutive_absent_alert || 2,
        monthlyAbsent: data.monthly_absent_alert || 5,
        ptmDayAlert: data.ptm_day_alert_enabled !== false,
      });
    }
  }, [user?.schoolId]);

  useEffect(() => { loadAlertRules(); }, [loadAlertRules]);

  const markStatus = async (studentId: string, status: string) => {
    setSaving(studentId);
    try {
      const existing = attendance[studentId];
      if (existing) {
        await supabase.from('attendance').update({ status, marked_by: user!.id }).eq('student_id', studentId).eq('date', selectedDate);
      } else {
        await supabase.from('attendance').insert({
          school_id: user!.schoolId, student_id: studentId,
          date: selectedDate, status, marked_by: user!.id, marked_via: 'dashboard',
        });
      }
      setAttendance(prev => ({ ...prev, [studentId]: status }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attendance');
    } finally {
      setSaving(null);
    }
  };

  const markAllPresent = async () => {
    if (!students.length) return;
    const unmarked = students.filter(s => !attendance[s.id]);
    for (const s of unmarked) {
      await markStatus(s.id, 'present');
    }
    toast.success('All students marked present');
  };

  const saveAlertRules = async () => {
    if (!user?.schoolId) return;
    setSavingAlerts(true);
    const { error } = await supabase.from('schools').update({
      consecutive_absent_alert: alertRules.consecutiveAbsent,
      monthly_absent_alert: alertRules.monthlyAbsent,
      ptm_day_alert_enabled: alertRules.ptmDayAlert,
    }).eq('id', user.schoolId);
    if (error) toast.error(error.message);
    else toast.success('Alert rules saved');
    setSavingAlerts(false);
  };

  const counts = {
    present: students.filter(s => attendance[s.id] === 'present').length,
    absent: students.filter(s => attendance[s.id] === 'absent').length,
    late: students.filter(s => attendance[s.id] === 'late').length,
    half_day: students.filter(s => attendance[s.id] === 'half_day').length,
    unmarked: students.filter(s => !attendance[s.id]).length,
  };

  const rowBg = (status: string | undefined) => {
    if (!status) return '';
    const map: Record<string, string> = { present: 'bg-green-50', absent: 'bg-red-50', late: 'bg-yellow-50', half_day: 'bg-blue-50' };
    return map[status] || '';
  };

  const loadReports = useCallback(async () => {
    if (!user?.schoolId) return;
    setReportLoading(true);
    try {
      let q = supabase.from('students').select('id, name, class, section').eq('school_id', user.schoolId).eq('status', 'active');
      if (reportClass) q = q.eq('class', reportClass);
      const { data: studs } = await q.order('class').order('name');

      const { data: attData } = await supabase.from('attendance').select('student_id, status, date').eq('school_id', user.schoolId);

      const report = (studs || []).map(s => {
        const sAtt = (attData || []).filter(a => a.student_id === s.id);
        const total = sAtt.length;
        const present = sAtt.filter(a => a.status === 'present').length;
        const absent = sAtt.filter(a => a.status === 'absent').length;
        const late = sAtt.filter(a => a.status === 'late').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { id: s.id, name: s.name, class: s.class, section: s.section, total, present, absent, late, pct };
      });
      setReportData(report);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReportLoading(false);
    }
  }, [user?.schoolId, reportClass]);

  useEffect(() => {
    if (activeTab === 'reports') loadReports();
  }, [activeTab, loadReports]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-[#1E293B]">Attendance</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {(['mark', 'reports', 'alerts'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>
              {tab === 'mark' ? 'Mark Attendance' : tab === 'reports' ? 'Reports' : 'Alert Rules'}
            </button>
          ))}
        </div>

        {activeTab === 'mark' ? (
          <div className="space-y-4">
            {/* Controls */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Class</label>
                  <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Section</label>
                  <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Section</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <button onClick={loadAttendance} disabled={!selectedClass || !selectedSection || loading} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                  {loading ? 'Loading...' : 'Load'}
                </button>
              </div>
            </div>

            {loaded && students.length > 0 && (
              <>
                {/* Summary */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Present', count: counts.present, color: 'bg-green-100 text-green-700' },
                    { label: 'Absent', count: counts.absent, color: 'bg-red-100 text-red-700' },
                    { label: 'Late', count: counts.late, color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'Half Day', count: counts.half_day, color: 'bg-blue-100 text-blue-700' },
                    { label: 'Unmarked', count: counts.unmarked, color: 'bg-gray-100 text-gray-600' },
                  ].map(s => (
                    <div key={s.label} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${s.color}`}>
                      {s.label}: {s.count}
                    </div>
                  ))}
                  <button onClick={markAllPresent} className="ml-auto bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700">
                    Mark All Present
                  </button>
                </div>

                {/* Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">S.No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Roll No</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Student Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {students.map((s, idx) => (
                        <tr key={s.id} className={`transition-colors ${rowBg(attendance[s.id])}`}>
                          <td className="px-4 py-3 text-[#64748B]">{idx + 1}</td>
                          <td className="px-4 py-3 text-[#64748B]">{s.rollNumber || '-'}</td>
                          <td className="px-4 py-3 font-medium text-[#1E293B]">{s.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => markStatus(s.id, opt.value)}
                                  disabled={saving === s.id}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${attendance[s.id] === opt.value ? opt.color + ' ring-2 ring-offset-1' : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-gray-50'} disabled:opacity-50`}
                                  title={opt.value}
                                >
                                  {saving === s.id ? '...' : opt.icon} {opt.label}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {loaded && students.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#E2E8F0]">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-[#1E293B] font-semibold">No students found</p>
                <p className="text-[#64748B] text-sm">No active students in Class {selectedClass}-{selectedSection}</p>
              </div>
            )}
          </div>
        ) : activeTab === 'reports' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] flex gap-3">
              <select value={reportClass} onChange={e => setReportClass(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={loadReports} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e]">Refresh</button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              {reportLoading ? (
                <div className="p-8 text-center"><svg className="animate-spin w-6 h-6 text-[#0D9488] mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                      <tr>
                        {['Student', 'Class', 'Total Days', 'Present', 'Absent', 'Late', 'Attendance %'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {reportData.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">No data available. Click Refresh to load.</td></tr>
                      ) : reportData.map(r => (
                        <tr key={r.id} className={r.pct < 75 ? 'bg-red-50' : 'hover:bg-[#F8FAFC]'}>
                          <td className="px-4 py-3 font-medium text-[#1E293B]">{r.name}</td>
                          <td className="px-4 py-3 text-[#64748B]">{r.class}-{r.section}</td>
                          <td className="px-4 py-3 text-[#64748B]">{r.total}</td>
                          <td className="px-4 py-3 text-green-600">{r.present}</td>
                          <td className="px-4 py-3 text-red-600">{r.absent}</td>
                          <td className="px-4 py-3 text-yellow-600">{r.late}</td>
                          <td className="px-4 py-3">
                            <span className={`font-semibold ${r.pct >= 90 ? 'text-green-600' : r.pct >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>{r.pct}%</span>
                            {r.pct < 75 && <span className="ml-2 text-xs text-red-500">⚠️ Low</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Alert Rules Tab */
          <div className="max-w-2xl space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0]">
              <h2 className="font-semibold text-[#1E293B] text-lg mb-4">Attendance Alert Rules</h2>
              <p className="text-sm text-[#64748B] mb-5">Configure when to automatically alert parents about attendance issues.</p>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Consecutive Absence Alert</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Alert parent if student is absent for X consecutive days</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={alertRules.consecutiveAbsent}
                      onChange={e => setAlertRules(r => ({ ...r, consecutiveAbsent: parseInt(e.target.value) || 2 }))}
                      className="w-16 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                    <span className="text-sm text-[#64748B]">days</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Monthly Absence Threshold</p>
                    <p className="text-xs text-[#64748B] mt-0.5">Alert parent if student has X+ absences in a month</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={alertRules.monthlyAbsent}
                      onChange={e => setAlertRules(r => ({ ...r, monthlyAbsent: parseInt(e.target.value) || 5 }))}
                      className="w-16 px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                    <span className="text-sm text-[#64748B]">absences</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-green-800">Exam Day Absence Alert</p>
                    <p className="text-xs text-green-600 mt-0.5">Always alert when student is absent on exam day</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">Always ON</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-blue-800">PTM Day Absence Alert</p>
                    <p className="text-xs text-blue-600 mt-0.5">Alert when student is absent on Parent-Teacher Meeting day</p>
                  </div>
                  <button
                    onClick={() => setAlertRules(r => ({ ...r, ptmDayAlert: !r.ptmDayAlert }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${alertRules.ptmDayAlert ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alertRules.ptmDayAlert ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <button onClick={saveAlertRules} disabled={savingAlerts} className="mt-5 bg-[#0D9488] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                {savingAlerts ? 'Saving...' : 'Save Alert Rules'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
