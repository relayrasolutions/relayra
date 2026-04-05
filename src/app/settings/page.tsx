'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface SchoolData {
  name: string; address: string; city: string; state: string; board: string;
  principalName: string; contactPhone: string; contactEmail: string;
  feeReminderEnabled: boolean; escalation1: number; escalation2: number;
  escalation3: number; escalation4: number; escalation5: number; skipWeekends: boolean;
  dailyReportEnabled: boolean; dailyReportTime: string; birthdayGreetingEnabled: boolean;
  festivalGreetingEnabled: boolean; monthlyReportEnabled: boolean; monthlyReportDay: number;
}

interface FeatureSettings {
  fee_reminders: boolean;
  fee_escalation: boolean;
  attendance_alerts: boolean;
  daily_report: boolean;
  monthly_report: boolean;
  birthday_greetings: boolean;
  festival_greetings: boolean;
  festival_send_mode: 'all' | 'by_religion';
  two_way_chat: boolean;
  emergency_broadcast: boolean;
}

interface AppUserRow {
  id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt: string | null;
}

const DEFAULT_FEATURES: FeatureSettings = {
  fee_reminders: true, fee_escalation: true, attendance_alerts: true,
  daily_report: true, monthly_report: true, birthday_greetings: true,
  festival_greetings: true, festival_send_mode: 'all',
  two_way_chat: true, emergency_broadcast: true,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'features' | 'fee' | 'notifications' | 'users' | 'subscription'>('profile');
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURES);
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'school_staff', assignedClass: '', assignedSection: '' });
  const [inviting, setInviting] = useState(false);

  const fetchSchool = useCallback(async () => {
    if (!user?.schoolId) {
      setLoading(false);
      setLoadError('No school linked to your account. Please contact your administrator.');
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase.from('schools').select('*').eq('id', user.schoolId).single();
      if (error) throw error;
      if (data) {
        setSchool({
          name: data.name || '', address: data.address || '', city: data.city || '',
          state: data.state || 'Uttar Pradesh', board: data.board || '',
          principalName: data.principal_name || '', contactPhone: data.contact_phone || '',
          contactEmail: data.contact_email || '',
          feeReminderEnabled: data.fee_reminder_enabled ?? true,
          escalation1: data.escalation_level1_days ?? 3, escalation2: data.escalation_level2_days ?? 7,
          escalation3: data.escalation_level3_days ?? 15, escalation4: data.escalation_level4_days ?? 21,
          escalation5: data.escalation_level5_days ?? 30, skipWeekends: data.skip_weekends ?? true,
          dailyReportEnabled: data.daily_report_enabled ?? true, dailyReportTime: data.daily_report_time || '16:00',
          birthdayGreetingEnabled: data.birthday_greeting_enabled ?? true,
          festivalGreetingEnabled: data.festival_greeting_enabled ?? true,
          monthlyReportEnabled: data.monthly_report_enabled ?? true,
          monthlyReportDay: data.monthly_report_day ?? 1,
        });
        setFeatures({ ...DEFAULT_FEATURES, ...(data.feature_settings || {}) });
      }
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load school settings');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  const fetchUsers = useCallback(async () => {
    if (!user?.schoolId) return;
    const { data } = await supabase.from('users').select('*').eq('school_id', user.schoolId).order('name');
    setUsers((data || []).map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.is_active, lastLoginAt: u.last_login_at })));
  }, [user?.schoolId]);

  useEffect(() => { fetchSchool(); fetchUsers(); }, [fetchSchool, fetchUsers]);

  const saveProfile = async () => {
    if (!school || !user?.schoolId) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      name: school.name, address: school.address, city: school.city,
      state: school.state, board: school.board, principal_name: school.principalName,
      contact_phone: school.contactPhone, contact_email: school.contactEmail,
    }).eq('id', user.schoolId);
    if (error) toast.error(error.message);
    else toast.success('School profile updated');
    setSaving(false);
  };

  const saveFeatures = async () => {
    if (!user?.schoolId) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      feature_settings: features,
    }).eq('id', user.schoolId);
    if (error) toast.error(error.message);
    else toast.success('Feature settings saved');
    setSaving(false);
  };

  const saveFeeSettings = async () => {
    if (!school || !user?.schoolId) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      fee_reminder_enabled: school.feeReminderEnabled,
      escalation_level1_days: school.escalation1, escalation_level2_days: school.escalation2,
      escalation_level3_days: school.escalation3, escalation_level4_days: school.escalation4,
      escalation_level5_days: school.escalation5, skip_weekends: school.skipWeekends,
    }).eq('id', user.schoolId);
    if (error) toast.error(error.message);
    else toast.success('Fee settings saved');
    setSaving(false);
  };

  const saveNotifications = async () => {
    if (!school || !user?.schoolId) return;
    setSaving(true);
    const { error } = await supabase.from('schools').update({
      daily_report_enabled: school.dailyReportEnabled, daily_report_time: school.dailyReportTime,
      birthday_greeting_enabled: school.birthdayGreetingEnabled,
      festival_greeting_enabled: school.festivalGreetingEnabled,
      monthly_report_enabled: school.monthlyReportEnabled,
      monthly_report_day: school.monthlyReportDay,
    }).eq('id', user.schoolId);
    if (error) toast.error(error.message);
    else toast.success('Notification preferences saved');
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) { toast.error('Please fill all required fields'); return; }
    setInviting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: inviteForm.email,
        password: inviteForm.password,
        options: { data: { full_name: inviteForm.name, role: inviteForm.role } },
      });
      if (signUpError) throw signUpError;
      if (signUpData.user) {
        await supabase.from('users').insert({
          auth_id: signUpData.user.id, email: inviteForm.email, name: inviteForm.name,
          role: inviteForm.role, school_id: user!.schoolId,
          assigned_class: inviteForm.assignedClass || null,
          assigned_section: inviteForm.assignedSection || null,
        });
      }
      toast.success('User created successfully');
      setShowInviteModal(false);
      setInviteForm({ name: '', email: '', password: '', role: 'school_staff', assignedClass: '', assignedSection: '' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setInviting(false);
    }
  };

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    if (userId === user?.id) { toast.error('You cannot deactivate yourself'); return; }
    const { error } = await supabase.from('users').update({ is_active: !currentStatus }).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success(`User ${currentStatus ? 'deactivated' : 'activated'}`); fetchUsers(); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-6 h-6 text-[#0D9488]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </AppLayout>
    );
  }

  if (loadError || !school) {
    return (
      <AppLayout>
        <div className="space-y-5">
          <h1 className="text-2xl font-bold text-[#1E293B]">Settings</h1>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 font-medium">{loadError || 'Failed to load school settings'}</p>
            <button onClick={fetchSchool} className="mt-3 bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e]">Retry</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { key: 'profile', label: 'School Profile' },
    { key: 'features', label: 'Feature Toggles' },
    { key: 'fee', label: 'Fee Settings' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'users', label: 'User Management' },
    { key: 'subscription', label: 'Subscription' },
  ] as const;

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]";
  const labelClass = "block text-sm font-medium text-[#1E293B] mb-1";

  const ToggleSwitch = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#0D9488]' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-[#1E293B]">Settings</h1>

        <div className="flex flex-wrap gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>{tab.label}</button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1E293B] text-lg">School Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'School Name', key: 'name' }, { label: 'City', key: 'city' },
                  { label: 'State', key: 'state' }, { label: 'Board (CBSE/ICSE/UP Board)', key: 'board' },
                  { label: 'Principal Name', key: 'principalName' }, { label: 'Contact Phone', key: 'contactPhone' },
                  { label: 'Contact Email', key: 'contactEmail' },
                ].map(f => (
                  <div key={f.key}>
                    <label className={labelClass}>{f.label}</label>
                    <input type="text" value={(school as any)[f.key]} onChange={e => setSchool(s => s ? { ...s, [f.key]: e.target.value } : s)} className={inputClass} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <textarea value={school.address} onChange={e => setSchool(s => s ? { ...s, address: e.target.value } : s)} rows={2} className={inputClass + ' resize-none'} />
                </div>
              </div>
              <button onClick={saveProfile} disabled={saving} className="bg-[#0D9488] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-semibold text-[#1E293B] text-lg">Feature Toggles</h2>
                <p className="text-[#64748B] text-sm mt-1">Enable or disable features for your school</p>
              </div>
              <div className="space-y-4">
                {[
                  { key: 'fee_reminders', label: 'Fee Reminders', desc: 'Automated fee reminders via WhatsApp' },
                  { key: 'fee_escalation', label: 'Fee Escalation', desc: '5-level escalation for overdue fees' },
                  { key: 'attendance_alerts', label: 'Attendance Alerts', desc: 'Notify parents when student is absent' },
                  { key: 'daily_report', label: 'Daily Admin Report (Principal\'s Pulse)', desc: 'Daily summary sent to principal at end of day' },
                  { key: 'monthly_report', label: 'Monthly Admin Report', desc: 'Monthly summary with analytics' },
                  { key: 'birthday_greetings', label: 'Birthday Greetings', desc: 'Auto-send birthday wishes to students' },
                  { key: 'festival_greetings', label: 'Festival Greetings', desc: 'Send greetings for Diwali, Eid, Christmas, etc.' },
                  { key: 'two_way_chat', label: 'Two-Way Parent Chat', desc: 'Allow parents to reply and ask queries' },
                  { key: 'emergency_broadcast', label: 'Emergency Broadcast', desc: 'Send urgent messages to all parents instantly' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{item.label}</p>
                      <p className="text-xs text-[#64748B]">{item.desc}</p>
                    </div>
                    <ToggleSwitch
                      checked={(features as any)[item.key]}
                      onChange={v => setFeatures(f => ({ ...f, [item.key]: v }))}
                    />
                  </div>
                ))}

                {/* Festival send mode sub-option */}
                {features.festival_greetings && (
                  <div className="ml-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-3">Festival Greeting Send Mode</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio" name="festivalMode" value="all"
                          checked={features.festival_send_mode === 'all'}
                          onChange={() => setFeatures(f => ({ ...f, festival_send_mode: 'all' }))}
                          className="accent-[#0D9488]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">Send to All</p>
                          <p className="text-xs text-[#64748B]">All festivals sent to all parents regardless of religion</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio" name="festivalMode" value="by_religion"
                          checked={features.festival_send_mode === 'by_religion'}
                          onChange={() => setFeatures(f => ({ ...f, festival_send_mode: 'by_religion' }))}
                          className="accent-[#0D9488]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#1E293B]">Send by Religion</p>
                          <p className="text-xs text-[#64748B]">Target greetings based on student religion (Eid → Muslim, Diwali → Hindu+Sikh, etc.)</p>
                        </div>
                      </label>
                    </div>
                    <div className="mt-3 p-2 bg-white rounded border border-amber-100">
                      <p className="text-xs text-amber-700 font-medium mb-1">Religion-based targeting:</p>
                      <div className="text-xs text-[#64748B] space-y-0.5">
                        <p>Eid, Eid-ul-Adha, Shab-e-Meraj → <span className="font-medium text-[#1E293B]">Muslim</span></p>
                        <p>Diwali, Holi, Dussehra, Raksha Bandhan → <span className="font-medium text-[#1E293B]">Hindu + Sikh</span></p>
                        <p>Christmas, Easter → <span className="font-medium text-[#1E293B]">Christian</span></p>
                        <p>Guru Nanak Jayanti, Baisakhi → <span className="font-medium text-[#1E293B]">Sikh</span></p>
                        <p>Republic Day, Independence Day → <span className="font-medium text-[#1E293B]">ALL</span></p>
                        <p>School events → <span className="font-medium text-[#1E293B]">ALL</span></p>
                        <p className="mt-1 italic">Students with &quot;Not Specified&quot; religion receive ALL greetings</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={saveFeatures} disabled={saving} className="bg-[#0D9488] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{saving ? 'Saving...' : 'Save Feature Settings'}</button>
            </div>
          )}

          {activeTab === 'fee' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-[#1E293B] text-lg">Fee Settings</h2>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="feeReminder" checked={school.feeReminderEnabled} onChange={e => setSchool(s => s ? { ...s, feeReminderEnabled: e.target.checked } : s)} className="rounded" />
                <label htmlFor="feeReminder" className="text-sm font-medium text-[#1E293B]">Enable Fee Reminder Automation</label>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">Escalation Timing (days after due date)</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Level 1 — Gentle Reminder', key: 'escalation1' },
                    { label: 'Level 2 — Follow-up', key: 'escalation2' },
                    { label: 'Level 3 — Firm Reminder', key: 'escalation3' },
                    { label: 'Level 4 — Secondary Contact', key: 'escalation4' },
                    { label: 'Level 5 — Final Notice', key: 'escalation5' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-3">
                      <label className="text-sm text-[#64748B] w-52">{f.label}</label>
                      <input type="number" value={(school as any)[f.key]} onChange={e => setSchool(s => s ? { ...s, [f.key]: parseInt(e.target.value) || 0 } : s)} className="w-20 px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                      <span className="text-sm text-[#64748B]">days</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="skipWeekends" checked={school.skipWeekends} onChange={e => setSchool(s => s ? { ...s, skipWeekends: e.target.checked } : s)} className="rounded" />
                <label htmlFor="skipWeekends" className="text-sm font-medium text-[#1E293B]">Skip weekends for reminders</label>
              </div>
              <button onClick={saveFeeSettings} disabled={saving} className="bg-[#0D9488] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{saving ? 'Saving...' : 'Save Settings'}</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-[#1E293B] text-lg">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Daily Principal Report</p>
                    <p className="text-xs text-[#64748B]">Send daily summary report to principal</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="time" value={school.dailyReportTime} onChange={e => setSchool(s => s ? { ...s, dailyReportTime: e.target.value } : s)} className="px-2 py-1 border border-[#E2E8F0] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                    <input type="checkbox" checked={school.dailyReportEnabled} onChange={e => setSchool(s => s ? { ...s, dailyReportEnabled: e.target.checked } : s)} className="rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Monthly Report</p>
                    <p className="text-xs text-[#64748B]">Send monthly summary on a specific day</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#64748B]">Day</span>
                      <input type="number" min={1} max={28} value={school.monthlyReportDay} onChange={e => setSchool(s => s ? { ...s, monthlyReportDay: parseInt(e.target.value) || 1 } : s)} className="w-14 px-2 py-1 border border-[#E2E8F0] rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                    </div>
                    <input type="checkbox" checked={school.monthlyReportEnabled} onChange={e => setSchool(s => s ? { ...s, monthlyReportEnabled: e.target.checked } : s)} className="rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Birthday Greetings</p>
                    <p className="text-xs text-[#64748B]">Auto-send birthday wishes to students</p>
                  </div>
                  <input type="checkbox" checked={school.birthdayGreetingEnabled} onChange={e => setSchool(s => s ? { ...s, birthdayGreetingEnabled: e.target.checked } : s)} className="rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">Festival Greetings</p>
                    <p className="text-xs text-[#64748B]">Send greetings for Diwali, Holi, Eid, Christmas, and more</p>
                  </div>
                  <input type="checkbox" checked={school.festivalGreetingEnabled} onChange={e => setSchool(s => s ? { ...s, festivalGreetingEnabled: e.target.checked } : s)} className="rounded" />
                </div>
              </div>
              <button onClick={saveNotifications} disabled={saving} className="bg-[#0D9488] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{saving ? 'Saving...' : 'Save Preferences'}</button>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#1E293B] text-lg">User Management</h2>
                <button onClick={() => setShowInviteModal(true)} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e]">Add User</button>
              </div>
              <div className="space-y-2">
                {users.length === 0 ? (
                  <p className="text-[#64748B] text-sm text-center py-4">No users found</p>
                ) : users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#1E293B]">{u.name}</p>
                      <p className="text-xs text-[#64748B]">{u.email} · <span className="capitalize">{u.role.replace('_', ' ')}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                      {u.id !== user?.id && (
                        <button onClick={() => toggleUserActive(u.id, u.isActive)} className="text-xs text-[#64748B] hover:text-[#1E293B] underline">
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#1E293B] text-lg">Subscription</h2>
              <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0D9488] rounded-xl p-5 text-white">
                <p className="text-sm opacity-80">Current Plan</p>
                <p className="text-2xl font-bold capitalize mt-1">Growth Plan</p>
                <p className="text-sm opacity-80 mt-1">Active · Medium School (301-750 students)</p>
              </div>
              <div className="space-y-2">
                {['Unlimited Students', 'Fee Management', 'Attendance Tracking', 'WhatsApp Messaging', 'AI Message Generation', 'Reports & Analytics', 'Multi-user Access', 'Feature Toggles', 'Religion-based Greetings'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-[#1E293B]">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </div>
                ))}
              </div>
              <button className="w-full border-2 border-[#0D9488] text-[#0D9488] py-2 rounded-lg text-sm font-semibold hover:bg-[#0D9488] hover:text-white transition-colors">Contact Us to Upgrade</button>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">Add User</h2>
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Name *</label>
                <input type="text" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input type="password" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className={inputClass}>
                  <option value="school_admin">School Admin</option>
                  <option value="school_staff">School Staff (Teacher)</option>
                </select>
              </div>
              {inviteForm.role === 'school_staff' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Assigned Class</label>
                    <input type="text" value={inviteForm.assignedClass} onChange={e => setInviteForm(f => ({ ...f, assignedClass: e.target.value }))} placeholder="e.g. 7" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Assigned Section</label>
                    <input type="text" value={inviteForm.assignedSection} onChange={e => setInviteForm(f => ({ ...f, assignedSection: e.target.value }))} placeholder="e.g. A" className={inputClass} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleInvite} disabled={inviting} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">{inviting ? 'Creating...' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
