'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface Template {
  id: string;
  name: string;
  category: string;
  language: string;
  body: string;
  variables: string[];
  isSystem: boolean;
  schoolId: string | null;
}

const CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'fee', label: '💰 Fee' },
  { value: 'attendance', label: '📋 Attendance' },
  { value: 'academic', label: '📚 Academic' },
  { value: 'administrative', label: '🏫 Administrative' },
  { value: 'emergency', label: '🚨 Emergency' },
  { value: 'greetings', label: '🎉 Greetings' },
];

const VARIABLES = [
  '{{parent_name}}', '{{student_name}}', '{{class}}', '{{section}}',
  '{{school_name}}', '{{amount}}', '{{due_date}}', '{{fee_type}}',
  '{{date}}', '{{days}}', '{{percentage}}', '{{event_name}}',
];

const getCategoryBadge = (cat: string) => {
  const map: Record<string, string> = {
    fee: 'bg-green-100 text-green-700',
    attendance: 'bg-blue-100 text-blue-700',
    academic: 'bg-purple-100 text-purple-700',
    administrative: 'bg-gray-100 text-gray-700',
    emergency: 'bg-red-100 text-red-700',
    greetings: 'bg-amber-100 text-amber-700',
  };
  return map[cat] || 'bg-gray-100 text-gray-700';
};

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState({
    name: '', category: 'administrative', language: 'EN', body: '',
  });

  const fetchTemplates = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .or(`is_system.eq.true,school_id.eq.${user.schoolId}`)
      .order('category')
      .order('name');
    if (error) { toast.error('Failed to load templates'); }
    setTemplates((data || []).map(t => ({
      id: t.id, name: t.name, category: t.category, language: t.language,
      body: t.body, variables: t.variables || [], isSystem: t.is_system, schoolId: t.school_id,
    })));
    setLoading(false);
  }, [user?.schoolId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const filtered = templates.filter(t => {
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openAddModal = () => {
    setEditTemplate(null);
    setForm({ name: '', category: 'administrative', language: 'EN', body: '' });
    setShowModal(true);
  };

  const openEditModal = (t: Template) => {
    if (t.isSystem) {
      // Duplicate system template for editing
      setEditTemplate(null);
      setForm({ name: t.name + ' (Custom)', category: t.category, language: t.language, body: t.body });
      setShowModal(true);
      toast('Creating a custom copy of this system template', { icon: 'ℹ️' });
      return;
    }
    setEditTemplate(t);
    setForm({ name: t.name, category: t.category, language: t.language, body: t.body });
    setShowModal(true);
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm(p => ({ ...p, body: p.body + variable }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = form.body.substring(0, start) + variable + form.body.substring(end);
    setForm(p => ({ ...p, body: newBody }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const saveTemplate = async () => {
    if (!form.name || !form.body) { toast.error('Name and body are required'); return; }
    setSaving(true);
    try {
      const payload = {
        school_id: user!.schoolId,
        name: form.name,
        category: form.category,
        language: form.language,
        body: form.body,
        is_system: false,
        created_by: user!.id,
        updated_at: new Date().toISOString(),
      };
      if (editTemplate) {
        const { error } = await supabase.from('message_templates').update(payload).eq('id', editTemplate.id);
        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase.from('message_templates').insert(payload);
        if (error) throw error;
        toast.success('Template created');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    const { error } = await supabase.from('message_templates').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Template deleted');
    fetchTemplates();
  };

  const useTemplate = (t: Template) => {
    // Copy body to clipboard
    navigator.clipboard.writeText(t.body).then(() => {
      toast.success('Template copied to clipboard!');
    }).catch(() => {
      toast.error('Could not copy to clipboard');
    });
  };

  const systemCount = templates.filter(t => t.isSystem).length;
  const customCount = templates.filter(t => !t.isSystem).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Message Templates</h1>
            <p className="text-[#64748B] text-sm mt-1">{systemCount} system templates · {customCount} custom templates</p>
          </div>
          <button onClick={openAddModal} className="px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..." className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setFilterCategory(c.value)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === c.value ? 'bg-[#1E3A5F] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-[#1E293B] font-semibold">No templates found</p>
            <p className="text-[#64748B] text-sm mt-1">Try adjusting your filters or create a new template</p>
            <button onClick={openAddModal} className="mt-4 px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70]">Create Template</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[#1E293B] text-sm">{t.name}</h3>
                        {t.isSystem && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded border border-gray-200">🔒 System</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryBadge(t.category)}`}>
                          {t.category}
                        </span>
                        <span className="text-xs text-[#64748B]">{t.language}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] line-clamp-3 leading-relaxed">{t.body}</p>
                  {t.variables && t.variables.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables as any)).slice(0, 3).map((v: string) => (
                        <span key={v} className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-mono">{`{{${v}}}`}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <button onClick={() => useTemplate(t)} className="flex-1 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-medium hover:bg-[#0B7A70] transition-colors">
                    📋 Copy
                  </button>
                  <button onClick={() => setPreviewTemplate(t)} className="px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    👁️
                  </button>
                  <button onClick={() => openEditModal(t)} className="px-3 py-1.5 border border-[#E2E8F0] text-[#64748B] rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                    {t.isSystem ? '📄 Duplicate' : '✏️ Edit'}
                  </button>
                  {!t.isSystem && (
                    <button onClick={() => deleteTemplate(t.id)} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-[#1E293B]">{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryBadge(previewTemplate.category)}`}>{previewTemplate.category}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{previewTemplate.language}</span>
                {previewTemplate.isSystem && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">🔒 System</span>}
              </div>
              {/* WhatsApp-style preview */}
              <div className="bg-[#ECE5DD] rounded-xl p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs">
                  <p className="text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed">{previewTemplate.body}</p>
                  <p className="text-xs text-[#64748B] text-right mt-2">12:00 PM ✓✓</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { useTemplate(previewTemplate); setPreviewTemplate(null); }} className="flex-1 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70]">Copy Template</button>
                <button onClick={() => setPreviewTemplate(null)} className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] sticky top-0 bg-white">
              <h3 className="font-semibold text-[#1E293B]">{editTemplate ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Template Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]" placeholder="e.g. Fee Reminder - Gentle" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Language</label>
                  <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="EN">English</option>
                    <option value="HI">Hindi</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Message Body *</label>
                <textarea
                  ref={textareaRef}
                  value={form.body}
                  onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  rows={5}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  placeholder="Write your message here. Use variables like {{parent_name}} for dynamic content."
                />
                <p className="text-xs text-[#64748B] mt-1">{form.body.length} characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-2">Insert Variable</label>
                <div className="flex flex-wrap gap-2">
                  {VARIABLES.map(v => (
                    <button key={v} onClick={() => insertVariable(v)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-mono hover:bg-blue-100 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-[#E2E8F0] text-[#64748B] rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={saveTemplate} disabled={saving} className="flex-1 px-4 py-2 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A70] disabled:opacity-50">
                {saving ? 'Saving...' : editTemplate ? 'Update' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
