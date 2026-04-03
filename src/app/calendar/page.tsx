'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  endDate: string | null;
  color: string;
}

const EVENT_TYPES = [
  { value: 'exam', label: 'Exam', color: '#EF4444', bg: 'bg-red-100 text-red-700' },
  { value: 'ptm', label: 'PTM', color: '#3B82F6', bg: 'bg-blue-100 text-blue-700' },
  { value: 'holiday', label: 'Holiday', color: '#10B981', bg: 'bg-green-100 text-green-700' },
  { value: 'event', label: 'Event', color: '#8B5CF6', bg: 'bg-purple-100 text-purple-700' },
  { value: 'result_day', label: 'Result Day', color: '#F59E0B', bg: 'bg-amber-100 text-amber-700' },
  { value: 'custom', label: 'Custom', color: '#6B7280', bg: 'bg-gray-100 text-gray-700' },
];

const getEventTypeInfo = (type: string) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[5];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', eventType: 'custom', startDate: '', endDate: '', color: '#6B7280',
  });

  const fetchEvents = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('academic_calendar')
      .select('*')
      .eq('school_id', user.schoolId)
      .order('start_date');
    if (error) { toast.error('Failed to load events'); }
    setEvents((data || []).map(e => ({
      id: e.id, title: e.title, description: e.description,
      eventType: e.event_type, startDate: e.start_date, endDate: e.end_date, color: e.color,
    })));
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openAddModal = (date?: string) => {
    setEditEvent(null);
    setForm({ title: '', description: '', eventType: 'custom', startDate: date || '', endDate: '', color: '#6B7280' });
    setShowModal(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditEvent(event);
    setForm({ title: event.title, description: event.description || '', eventType: event.eventType, startDate: event.startDate, endDate: event.endDate || '', color: event.color });
    setShowModal(true);
  };

  const handleTypeChange = (type: string) => {
    const info = getEventTypeInfo(type);
    setForm(prev => ({ ...prev, eventType: type, color: info.color }));
  };

  const saveEvent = async () => {
    if (!form.title || !form.startDate) { toast.error('Title and start date are required'); return; }
    setSaving(true);
    try {
      const payload = {
        school_id: user!.schoolId,
        title: form.title,
        description: form.description || null,
        event_type: form.eventType,
        start_date: form.startDate,
        end_date: form.endDate || null,
        color: form.color,
        created_by: user!.id,
      };
      if (editEvent) {
        const { error } = await supabase.from('academic_calendar').update(payload).eq('id', editEvent.id);
        if (error) throw error;
        toast.success('Event updated');
      } else {
        const { error } = await supabase.from('academic_calendar').insert(payload);
        if (error) throw error;
        toast.success('Event added');
      }
      setShowModal(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const { error } = await supabase.from('academic_calendar').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Event deleted');
    fetchEvents();
  };

  // Calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => {
      if (e.endDate) return dateStr >= e.startDate && dateStr <= e.endDate;
      return e.startDate === dateStr;
    });
  };

  const upcomingEvents = events
    .filter(e => e.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 10);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Academic Calendar</h1>
            <p className="text-[#64748B] text-sm mt-1">Manage school events, exams, holidays and PTMs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
              <button onClick={() => setView('calendar')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-[#1E3A5F] text-white' : 'text-[#64748B] hover:bg-gray-50'}`}>
                📅 Calendar
              </button>
              <button onClick={() => setView('list')} className={`px-4 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-[#1E3A5F] text-white' : 'text-[#64748B] hover:bg-gray-50'}`}>
                📋 List
              </button>
            </div>
            <button onClick={() => openAddModal()} className="px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70] transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          </div>
        </div>

        {/* Event Type Legend */}
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(t => (
            <span key={t.value} className={`px-3 py-1 rounded-full text-xs font-medium ${t.bg}`}>
              {t.label}
            </span>
          ))}
        </div>

        {view === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              {/* Month Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-lg font-semibold text-[#1E293B]">{MONTHS[month]} {year}</h2>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-[#E2E8F0]">
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-[#64748B]">{d}</div>
                ))}
              </div>

              {/* Calendar Cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-[#E2E8F0] bg-gray-50/50" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvents = getEventsForDate(dateStr);
                  const isToday = dateStr === today;
                  return (
                    <div
                      key={day}
                      onClick={() => openAddModal(dateStr)}
                      className={`min-h-[80px] border-b border-r border-[#E2E8F0] p-1 cursor-pointer hover:bg-blue-50/30 transition-colors ${isToday ? 'bg-[#0D9488]/5' : ''}`}
                    >
                      <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#0D9488] text-white' : 'text-[#1E293B]'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map(e => (
                          <div
                            key={e.id}
                            onClick={ev => { ev.stopPropagation(); openEditModal(e); }}
                            className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: e.color + '20', color: e.color, borderLeft: `2px solid ${e.color}` }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-[#64748B] px-1">+{dayEvents.length - 2} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="px-5 py-4 border-b border-[#E2E8F0]">
                <h3 className="font-semibold text-[#1E293B]">Upcoming Events</h3>
              </div>
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">📅</div>
                    <p className="text-[#64748B] text-sm">No upcoming events</p>
                    <button onClick={() => openAddModal()} className="mt-3 text-[#0D9488] text-sm font-medium hover:underline">Add first event</button>
                  </div>
                ) : upcomingEvents.map(e => {
                  const typeInfo = getEventTypeInfo(e.eventType);
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 group">
                      <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{e.title}</p>
                        <p className="text-xs text-[#64748B]">{formatDate(e.startDate)}{e.endDate ? ` – ${formatDate(e.endDate)}` : ''}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bg}`}>{typeInfo.label}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(e)} className="p-1 text-[#64748B] hover:text-[#1E293B]">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteEvent(e.id)} className="p-1 text-[#64748B] hover:text-red-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="font-semibold text-[#1E293B]">All Events</h3>
              <span className="text-sm text-[#64748B]">{events.length} events</span>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[#1E293B] font-semibold">No events yet</p>
                <p className="text-[#64748B] text-sm mt-1">Add your first event to get started</p>
                <button onClick={() => openAddModal()} className="mt-4 px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70]">Add Event</button>
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {events.map(e => {
                  const typeInfo = getEventTypeInfo(e.eventType);
                  return (
                    <div key={e.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 group">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[#1E293B]">{e.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.bg}`}>{typeInfo.label}</span>
                        </div>
                        {e.description && <p className="text-sm text-[#64748B] mt-0.5">{e.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-[#1E293B]">{formatDate(e.startDate)}</p>
                        {e.endDate && <p className="text-xs text-[#64748B]">to {formatDate(e.endDate)}</p>}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(e)} className="p-1.5 text-[#64748B] hover:text-[#1E293B] hover:bg-gray-100 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => deleteEvent(e.id)} className="p-1.5 text-[#64748B] hover:text-red-500 hover:bg-red-50 rounded">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B]">{editEvent ? 'Edit Event' : 'Add Event'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" placeholder="Event title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Event Type</label>
                <select value={form.eventType} onChange={e => handleTypeChange(e.target.value)} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                  {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" placeholder="Optional description" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              {editEvent && (
                <button onClick={() => { deleteEvent(editEvent.id); setShowModal(false); }} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Delete</button>
              )}
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveEvent} disabled={saving} className="flex-1 px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70] disabled:opacity-50">
                {saving ? 'Saving...' : editEvent ? 'Update' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
