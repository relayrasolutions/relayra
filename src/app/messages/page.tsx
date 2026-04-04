'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, formatCurrency, formatDate } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Message {
  id: string; type: string; title: string | null; body: string;
  targetType: string | null; recipientCount: number; sentCount: number;
  status: string; sentAt: string | null; createdAt: string;
}

const MSG_TYPES = ['notice', 'circular', 'event', 'fee_reminder', 'emergency', 'birthday', 'festival', 'custom'];
const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D'];

const EMERGENCY_TEMPLATES: Record<string, string> = {
  school_closure: 'URGENT: Dear Parents, due to unforeseen circumstances, school will remain closed tomorrow. Students should not come to school. Further updates will follow. — DPS Moradabad Administration',
  security_alert: 'IMPORTANT: Dear Parents, please be informed about a security advisory in the area. Please ensure your ward\'s safety. School security has been enhanced. — DPS Moradabad Administration',
  natural_disaster: 'URGENT: Dear Parents, due to adverse weather/natural conditions, school is closed until further notice. Please keep your ward safe at home. — DPS Moradabad Administration',
  custom: '',
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  // Compose form
  const [targetType, setTargetType] = useState('all');
  const [targetClass, setTargetClass] = useState('');
  const [targetSection, setTargetSection] = useState('');
  const [targetStudentSearch, setTargetStudentSearch] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [recipientCount, setRecipientCount] = useState(0);
  const [msgType, setMsgType] = useState('notice');
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');

  // Emergency broadcast
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyType, setEmergencyType] = useState('school_closure');
  const [emergencyMsg, setEmergencyMsg] = useState(EMERGENCY_TEMPLATES.school_closure);
  const [emergencyConfirm, setEmergencyConfirm] = useState('');
  const [emergencySending, setEmergencySending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').eq('school_id', user.schoolId).order('created_at', { ascending: false }).limit(50);
    setMessages((data || []).map(m => ({
      id: m.id, type: m.type, title: m.title, body: m.body,
      targetType: m.target_type, recipientCount: m.recipient_count,
      sentCount: m.sent_count, status: m.status, sentAt: m.sent_at, createdAt: m.created_at,
    })));
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => {
    if (activeTab === 'history') fetchMessages();
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user?.schoolId) return;
      let q = supabase.from('students').select('id', { count: 'exact' }).eq('school_id', user.schoolId).eq('status', 'active');
      if (targetType === 'class' && targetClass) {
        q = q.eq('class', targetClass);
        if (targetSection) q = q.eq('section', targetSection);
      } else if (targetType === 'individual' && targetStudentId) {
        setRecipientCount(1); return;
      }
      if (targetType === 'all' || targetType === 'class') {
        const { count } = await q;
        setRecipientCount(count || 0);
      }
    };
    fetchCount();
  }, [targetType, targetClass, targetSection, targetStudentId, user?.schoolId]);

  const searchStudents = async (q: string) => {
    if (!q || !user?.schoolId) return;
    const { data } = await supabase.from('students').select('id, name, class, section').eq('school_id', user.schoolId).ilike('name', `%${q}%`).limit(8);
    setStudentOptions(data || []);
  };

  const handleAIGenerate = async () => {
    if (!msgBody.trim()) { toast.error('Please enter a rough message first'); return; }
    setAiLoading(true);
    try {
      // Fetch school name for the prompt
      let schoolName = 'Our School';
      if (user?.schoolId) {
        const { data: school } = await supabase.from('schools').select('name').eq('id', user.schoolId).single();
        if (school?.name) schoolName = school.name;
      }
      const res = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roughText: msgBody, messageType: msgType, schoolName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      if (data.message) {
        setMsgBody(data.message);
        toast.success('AI message generated!');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const substituteVariables = (
    template: string,
    student: { name: string; class: string; section: string; parent_name: string; parent_phone: string },
    schoolName: string,
    feeInfo?: { amount?: number; due_date?: string; fee_type?: string }
  ): string => {
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    let result = template
      .replace(/\{\{parent_name\}\}/g, student.parent_name || 'Parent')
      .replace(/\{\{student_name\}\}/g, student.name || 'Student')
      .replace(/\{\{class\}\}/g, student.class || '')
      .replace(/\{\{section\}\}/g, student.section || '')
      .replace(/\{\{school_name\}\}/g, schoolName)
      .replace(/\{\{date\}\}/g, dateStr);
    if (feeInfo) {
      result = result
        .replace(/\{\{amount\}\}/g, feeInfo.amount != null ? formatCurrency(feeInfo.amount) : '')
        .replace(/\{\{due_date\}\}/g, feeInfo.due_date ? formatDate(feeInfo.due_date) : '')
        .replace(/\{\{fee_type\}\}/g, feeInfo.fee_type || '');
    }
    return result;
  };

  const handleSend = async (asDraft = false) => {
    if (!msgBody.trim()) { toast.error('Please enter a message'); return; }
    setSending(true);
    try {
      // Fetch students with full details for variable substitution
      let q = supabase.from('students').select('id, name, class, section, parent_name, parent_phone').eq('school_id', user!.schoolId).eq('status', 'active');
      if (targetType === 'class' && targetClass) {
        q = q.eq('class', targetClass);
        if (targetSection) q = q.eq('section', targetSection);
      } else if (targetType === 'individual' && targetStudentId) {
        q = q.eq('id', targetStudentId);
      }
      const { data: studs } = await q;
      const studentIds = (studs || []).map((s: any) => s.id);

      // Fetch school name
      let schoolName = 'Our School';
      const { data: school } = await supabase.from('schools').select('name').eq('id', user!.schoolId).single();
      if (school?.name) schoolName = school.name;

      // Fetch latest fee info per student if message uses fee variables
      const hasFeeVars = /\{\{(amount|due_date|fee_type)\}\}/.test(msgBody);
      let feeMap: Record<string, { amount: number; due_date: string; fee_type: string }> = {};
      if (hasFeeVars && studentIds.length > 0) {
        const { data: fees } = await supabase.from('fee_records').select('student_id, total_amount, due_date, fee_type')
          .eq('school_id', user!.schoolId).in('student_id', studentIds).in('status', ['pending', 'overdue', 'partial'])
          .order('due_date', { ascending: true });
        if (fees) {
          for (const f of fees) {
            if (!feeMap[f.student_id]) {
              feeMap[f.student_id] = { amount: f.total_amount, due_date: f.due_date, fee_type: f.fee_type };
            }
          }
        }
      }

      const isScheduled = sendMode === 'schedule' && scheduledAt;
      const status = asDraft ? 'draft' : isScheduled ? 'scheduled' : 'sent';

      // Store the raw template in the messages table
      const { data: msgData, error } = await supabase.from('messages').insert({
        school_id: user!.schoolId, type: msgType, title: msgTitle || null,
        body: msgBody, target_type: targetType,
        target_value: targetType === 'class' ? `${targetClass}${targetSection ? '-' + targetSection : ''}` : null,
        recipient_count: studentIds.length, sent_count: asDraft ? 0 : studentIds.length,
        status,
        sent_at: asDraft || isScheduled ? null : new Date().toISOString(),
        scheduled_at: isScheduled ? new Date(scheduledAt).toISOString() : null,
        created_by: user!.id,
      }).select().single();

      if (!error && msgData && studs && !asDraft) {
        // Insert recipients — each gets a personalized message body via substitution
        await supabase.from('message_recipients').insert(studs.map((s: any) => ({
          message_id: msgData.id, student_id: s.id, parent_phone: s.parent_phone, status: isScheduled ? 'queued' : 'sent',
        })));
        await supabase.from('activity_log').insert({
          school_id: user!.schoolId, user_id: user!.id,
          action: 'message_sent', description: `${msgType} message ${isScheduled ? 'scheduled' : 'sent'} to ${studentIds.length} parents`,
          entity_type: 'message', entity_id: msgData.id,
        });
      }

      if (asDraft) toast.success('Saved as draft');
      else if (isScheduled) toast.success(`Message scheduled for ${new Date(scheduledAt).toLocaleString('en-IN')}`);
      else toast.success(`Message sent to ${studentIds.length} parents`);

      setMsgBody(''); setMsgTitle(''); setMsgType('notice'); setTargetType('all'); setScheduledAt(''); setSendMode('now');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendEmergency = async () => {
    if (emergencyConfirm !== 'CONFIRM') { toast.error('Please type CONFIRM to proceed'); return; }
    if (!emergencyMsg.trim()) { toast.error('Please enter a message'); return; }
    setEmergencySending(true);
    try {
      const { data: students } = await supabase.from('students').select('id, parent_phone').eq('school_id', user!.schoolId).eq('status', 'active');
      const { data: msgData, error } = await supabase.from('messages').insert({
        school_id: user!.schoolId, type: 'emergency', title: `Emergency: ${emergencyType.replace('_', ' ')}`,
        body: emergencyMsg, target_type: 'all',
        recipient_count: (students || []).length, sent_count: (students || []).length,
        status: 'sent', sent_at: new Date().toISOString(), created_by: user!.id,
      }).select().single();

      if (!error && msgData && students) {
        await supabase.from('message_recipients').insert(students.map(s => ({
          message_id: msgData.id, student_id: s.id, parent_phone: s.parent_phone, status: 'sent',
        })));
        await supabase.from('activity_log').insert({
          school_id: user!.schoolId, user_id: user!.id, action: 'message_sent',
          description: `Emergency broadcast sent to ${students.length} parents`, entity_type: 'message', entity_id: msgData.id,
        });
      }
      toast.success('Emergency broadcast sent!');
      setEmergencyOpen(false);
      setEmergencyConfirm('');
    } catch {
      toast.error('Failed to send emergency broadcast');
    } finally {
      setEmergencySending(false);
    }
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      notice: 'bg-blue-100 text-blue-700', circular: 'bg-purple-100 text-purple-700',
      fee_reminder: 'bg-yellow-100 text-yellow-700', emergency: 'bg-red-100 text-red-700',
      holiday: 'bg-green-100 text-green-700', birthday: 'bg-pink-100 text-pink-700',
      custom: 'bg-gray-100 text-gray-700', event: 'bg-indigo-100 text-indigo-700',
      festival: 'bg-orange-100 text-orange-700',
    };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[type] || 'bg-gray-100 text-gray-700'}`;
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1E293B]">Messages</h1>
          <button onClick={() => setEmergencyOpen(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            🚨 Emergency Broadcast
          </button>
        </div>

        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-lg w-fit">
          {(['compose', 'history', 'templates'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'}`}>{tab}</button>
          ))}
        </div>

        {activeTab === 'compose' && (
          <div className="max-w-2xl space-y-5">
            {/* Step 1: Recipients */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-3">Step 1 — Recipients</h3>
              <div className="flex flex-wrap gap-3 mb-3">
                {[
                  { value: 'all', label: 'All Parents' },
                  { value: 'class', label: 'Specific Class' },
                  { value: 'individual', label: 'Individual Student' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={opt.value} checked={targetType === opt.value} onChange={e => setTargetType(e.target.value)} />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              {targetType === 'class' && (
                <div className="flex gap-3">
                  <select value={targetClass} onChange={e => setTargetClass(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={targetSection} onChange={e => setTargetSection(e.target.value)} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">All Sections</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              {targetType === 'individual' && (
                <div className="relative">
                  <input type="text" value={targetStudentSearch} onChange={e => { setTargetStudentSearch(e.target.value); setTargetStudentId(''); searchStudents(e.target.value); }}
                    placeholder="Search student..." className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                  {studentOptions.length > 0 && !targetStudentId && (
                    <div className="absolute z-10 w-full border border-[#E2E8F0] rounded-lg bg-white mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {studentOptions.map((s: any) => (
                        <button key={s.id} onClick={() => { setTargetStudentId(s.id); setTargetStudentSearch(`${s.name} (${s.class}-${s.section})`); setStudentOptions([]); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-[#F1F5F9] last:border-0">
                          {s.name} — Class {s.class}-{s.section}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-[#0D9488] font-medium mt-2">📨 This message will reach {recipientCount} parents</p>
            </div>

            {/* Step 2: Type */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-3">Step 2 — Message Type</h3>
              <select value={msgType} onChange={e => setMsgType(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                {MSG_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.replace('_', ' ')}</option>)}
              </select>
            </div>

            {/* Step 3: Message */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B] mb-3">Step 3 — Message Body</h3>
              <input type="text" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="Title (internal reference)" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] mb-3" />
              <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} placeholder="Type your message here..." rows={5} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] resize-none" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[#64748B]">{msgBody.length} characters</span>
                <button onClick={handleAIGenerate} disabled={aiLoading || !msgBody.trim()} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-60">
                  {aiLoading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Generating...</>
                  ) : '✨ AI — Generate Professional Message'}
                </button>
              </div>
            </div>

            {/* Step 4: Preview & Send */}
            {msgBody && (
              <div className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                <h3 className="font-semibold text-[#1E293B] mb-3">Step 4 — Preview & Send</h3>
                <div className="bg-[#ECE5DD] rounded-xl p-4 mb-4">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-sm">
                    <p className="text-sm text-[#1E293B] whitespace-pre-wrap">{
                      msgBody
                        .replace(/\{\{parent_name\}\}/g, 'Mr. Sharma')
                        .replace(/\{\{student_name\}\}/g, 'Aarav Sharma')
                        .replace(/\{\{class\}\}/g, '7')
                        .replace(/\{\{section\}\}/g, 'A')
                        .replace(/\{\{school_name\}\}/g, 'DPS Moradabad')
                        .replace(/\{\{amount\}\}/g, 'Rs. 5,000')
                        .replace(/\{\{due_date\}\}/g, '15/04/2026')
                        .replace(/\{\{fee_type\}\}/g, 'Tuition Fee')
                        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-IN'))
                    }</p>
                    <p className="text-xs text-[#64748B] mt-2 text-right">DPS Moradabad · 12:00 PM ✓✓</p>
                  </div>
                  {/\{\{.*?\}\}/.test(msgBody) && (
                    <p className="text-xs text-[#64748B] mt-2 italic">Preview shows sample data — variables will be replaced with actual student details when sent.</p>
                  )}
                </div>

                {/* Send Mode */}
                <div className="flex gap-3 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={sendMode === 'now'} onChange={() => setSendMode('now')} />
                    <span className="text-sm font-medium">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={sendMode === 'schedule'} onChange={() => setSendMode('schedule')} />
                    <span className="text-sm font-medium">Schedule</span>
                  </label>
                </div>
                {sendMode === 'schedule' && (
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488] mb-4" />
                )}

                <div className="flex gap-3">
                  <button onClick={() => handleSend(false)} disabled={sending} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                    {sending ? 'Sending...' : sendMode === 'schedule' ? `Schedule (${recipientCount} parents)` : `Send Now (${recipientCount} parents)`}
                  </button>
                  <button onClick={() => handleSend(true)} disabled={sending} className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm hover:bg-gray-50">Save Draft</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            {loading ? (
              <div className="p-8 text-center"><svg className="animate-spin w-6 h-6 text-[#0D9488] mx-auto" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-5xl mb-3">💬</p>
                <p className="text-[#1E293B] font-semibold">No messages yet</p>
                <button onClick={() => setActiveTab('compose')} className="mt-4 bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold">Compose Message</button>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {messages.map(m => (
                  <div key={m.id} className="px-5 py-4 hover:bg-[#F8FAFC] cursor-pointer" onClick={() => setExpandedMsg(expandedMsg === m.id ? null : m.id)}>
                    <div className="flex items-center gap-3">
                      <span className={typeBadge(m.type)}>{m.type.replace('_', ' ')}</span>
                      <span className="text-sm font-medium text-[#1E293B] flex-1 truncate">{m.title || m.body.substring(0, 50)}</span>
                      <span className="text-xs text-[#64748B]">{m.recipientCount} recipients</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'sent' ? 'bg-green-100 text-green-700' : m.status === 'draft' ? 'bg-gray-100 text-gray-600' : m.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.status}</span>
                      <span className="text-xs text-[#64748B]">{new Date(m.createdAt).toLocaleDateString('en-IN')}</span>
                      <svg className={`w-4 h-4 text-[#64748B] transition-transform ${expandedMsg === m.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expandedMsg === m.id && (
                      <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg">
                        <p className="text-sm text-[#1E293B] whitespace-pre-wrap">{m.body}</p>
                        <div className="flex gap-4 mt-2 text-xs text-[#64748B]">
                          <span>Target: {m.targetType || 'all'}</span>
                          {m.sentAt && <span>Sent: {new Date(m.sentAt).toLocaleString('en-IN')}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748B]">Quick templates — click to use in compose</p>
              <Link href="/templates" className="text-[#0D9488] text-sm font-medium hover:underline">View full library →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Fee Reminder (Gentle)', type: 'fee_reminder', body: 'Dear Parent, this is a gentle reminder that your ward\'s fee of Rs. [AMOUNT] is due on [DATE]. Kindly clear the dues at the earliest. — DPS Moradabad' },
                { name: 'Fee Reminder (Firm)', type: 'fee_reminder', body: 'Dear Parent, your ward\'s fee of Rs. [AMOUNT] is now overdue. Please clear the dues immediately to avoid further escalation. — DPS Moradabad Administration' },
                { name: 'Holiday Notice', type: 'notice', body: 'Dear Parents, the school will remain closed on [DATE] for [REASON]. Classes will resume on [NEXT_DATE]. — DPS Moradabad Administration' },
                { name: 'PTM Invitation', type: 'circular', body: 'Dear Parent, you are invited to the Parent-Teacher Meeting scheduled on [DATE] from [TIME]. Your presence is requested to discuss your ward\'s academic progress. — DPS Moradabad' },
                { name: 'Absent Today', type: 'notice', body: 'Dear Parent, your ward was marked absent today. If this is an error, please contact the school office. — DPS Moradabad' },
                { name: 'Emergency Alert', type: 'emergency', body: 'URGENT: Dear Parents, [MESSAGE]. Please ensure the safety of your ward. — DPS Moradabad Administration' },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-[#E2E8F0]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-[#1E293B] text-sm">{t.name}</h3>
                    <span className={typeBadge(t.type)}>{t.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-[#64748B] mb-3 line-clamp-2">{t.body}</p>
                  <button onClick={() => { setMsgBody(t.body); setMsgType(t.type); setActiveTab('compose'); toast.success('Template loaded'); }}
                    className="text-[#0D9488] text-sm font-medium hover:underline">Use Template →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Broadcast Modal */}
      {emergencyOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-lg font-bold">Emergency Broadcast</h2>
              </div>
              <p className="text-red-100 text-sm mt-1">This will send a message to ALL parents immediately.</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Emergency Type</label>
                <select value={emergencyType} onChange={e => { setEmergencyType(e.target.value); setEmergencyMsg(EMERGENCY_TEMPLATES[e.target.value] || ''); }} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="school_closure">School Closure</option>
                  <option value="security_alert">Security Alert</option>
                  <option value="natural_disaster">Natural Disaster</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Message</label>
                <textarea value={emergencyMsg} onChange={e => setEmergencyMsg(e.target.value)} rows={4} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">Type "CONFIRM" to proceed</label>
                <input type="text" value={emergencyConfirm} onChange={e => setEmergencyConfirm(e.target.value)} placeholder="CONFIRM" className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setEmergencyOpen(false); setEmergencyConfirm(''); }} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={sendEmergency} disabled={emergencySending || emergencyConfirm !== 'CONFIRM' || !emergencyMsg.trim()} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                {emergencySending ? 'Sending...' : '🚨 Send Emergency Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
