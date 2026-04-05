'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, formatPhone } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface Student {
  id: string; name: string; class: string; section: string;
  rollNumber: string | null; admissionNumber: string | null;
  dateOfBirth: string | null; gender: string | null;
  address: string | null; busRoute: string | null;
  motherName: string | null;
  parentName: string; parentPhone: string;
  secondaryPhone: string | null; parentEmail: string | null;
  religion: string | null;
  status: string; feeStatus?: string;
}

interface UploadPreviewRow {
  name: string; class: string; section: string; parentName: string; parentPhone: string;
  rollNumber?: string; admissionNumber?: string; gender?: string; address?: string;
  busRoute?: string; parentEmail?: string; motherName?: string; religion?: string;
  dateOfBirth?: string;
  _valid: boolean; _error?: string;
}

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const SECTIONS = ['A', 'B', 'C', 'D'];
const RELIGIONS = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Other', 'Not Specified'];

const emptyForm = {
  name: '', class: '', section: '', rollNumber: '', admissionNumber: '',
  dateOfBirth: '', gender: '', address: '', busRoute: '',
  motherName: '', parentName: '', parentPhone: '', secondaryPhone: '', parentEmail: '',
  religion: 'Not Specified',
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const PAGE_SIZE = 50;

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<UploadPreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo upload state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    if (!user?.schoolId) return;
    setLoading(true);
    try {
      let query = supabase.from('students').select('*', { count: 'exact' })
        .eq('school_id', user.schoolId);
      if (filterStatus) query = query.eq('status', filterStatus);
      if (filterClass) query = query.eq('class', filterClass);
      if (filterSection) query = query.eq('section', filterSection);
      if (search) query = query.or(`name.ilike.%${search}%,parent_name.ilike.%${search}%,parent_phone.ilike.%${search}%,admission_number.ilike.%${search}%`);
      query = query.order('name').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      const { data, count, error } = await query;
      if (error) throw error;

      // Get fee statuses
      const ids = (data || []).map(s => s.id);
      let feeMap: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: fees } = await supabase.from('fee_records').select('student_id, status').in('student_id', ids).neq('status', 'waived');
        (fees || []).forEach(f => {
          if (!feeMap[f.student_id] || (f.status === 'overdue' && feeMap[f.student_id] !== 'overdue')) {
            feeMap[f.student_id] = f.status;
          }
        });
      }

      setStudents((data || []).map(s => ({
        id: s.id, name: s.name, class: s.class, section: s.section,
        rollNumber: s.roll_number, admissionNumber: s.admission_number,
        dateOfBirth: s.date_of_birth, gender: s.gender,
        address: s.address, busRoute: s.bus_route,
        motherName: s.mother_name || null,
        parentName: s.parent_name, parentPhone: s.parent_phone,
        secondaryPhone: s.secondary_phone, parentEmail: s.parent_email,
        religion: s.religion || 'Not Specified',
        status: s.status, feeStatus: feeMap[s.id] || 'paid',
        photoUrl: s.photo_url || null,
      })));
      setTotal(count || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, search, filterClass, filterSection, filterStatus, page]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => {
    setEditStudent(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      name: s.name, class: s.class, section: s.section,
      rollNumber: s.rollNumber || '', admissionNumber: s.admissionNumber || '',
      dateOfBirth: s.dateOfBirth || '', gender: s.gender || '',
      address: s.address || '', busRoute: s.busRoute || '',
      motherName: s.motherName || '',
      parentName: s.parentName, parentPhone: s.parentPhone,
      secondaryPhone: s.secondaryPhone || '', parentEmail: s.parentEmail || '',
      religion: s.religion || 'Not Specified',
    });
    setPhotoFile(null);
    setPhotoPreview(s.photoUrl || null);
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be under 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (studentId: string): Promise<string | null> => {
    if (!photoFile) return null;
    setUploadingPhoto(true);
    try {
      const ext = photoFile.name.split('.').pop();
      const path = `${user!.schoolId}/${studentId}.${ext}`;
      const { error } = await supabase.storage.from('student-photos').upload(path, photoFile, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('student-photos').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err: any) {
      toast.error('Photo upload failed: ' + err.message);
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.class || !form.section || !form.parentName || !form.parentPhone) {
      toast.error('Please fill all required fields');
      return;
    }
    const phone = form.parentPhone.replace(/\D/g, '');
    if (phone.length !== 10) {
      toast.error('Parent phone must be exactly 10 digits');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        school_id: user!.schoolId,
        name: form.name, class: form.class, section: form.section,
        roll_number: form.rollNumber || null, admission_number: form.admissionNumber || null,
        date_of_birth: form.dateOfBirth || null, gender: form.gender || null,
        address: form.address || null, bus_route: form.busRoute || null,
        mother_name: form.motherName || null,
        parent_name: form.parentName, parent_phone: phone,
        secondary_phone: form.secondaryPhone || null, parent_email: form.parentEmail || null,
        religion: form.religion || 'Not Specified',
      };

      if (editStudent) {
        const { data: updated, error } = await supabase.from('students').update(payload).eq('id', editStudent.id).select().single();
        if (error) throw error;
        if (photoFile && updated) {
          const photoUrl = await uploadPhoto(updated.id);
          if (photoUrl) {
            await supabase.from('students').update({ photo_url: photoUrl }).eq('id', updated.id);
          }
        }
        toast.success('Student updated successfully');
      } else {
        const { data, error } = await supabase.from('students').insert(payload).select().single();
        if (error) throw error;
        if (photoFile && data) {
          const photoUrl = await uploadPhoto(data.id);
          if (photoUrl) {
            await supabase.from('students').update({ photo_url: photoUrl }).eq('id', data.id);
          }
        }
        await supabase.from('activity_log').insert({
          school_id: user!.schoolId, user_id: user!.id,
          action: 'student_added', description: `Added student ${form.name} to Class ${form.class}${form.section}`,
          entity_type: 'student', entity_id: data.id,
        });
        toast.success('Student added successfully');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkInactive = async (id: string) => {
    if (!confirm('Mark this student as inactive?')) return;
    const { error } = await supabase.from('students').update({ status: 'inactive' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Student marked as inactive');
    fetchStudents();
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      'Student Name', 'Class', 'Section', 'Roll No', 'Father Name', 'Mother Name',
      'Father Phone', 'Mother Phone', 'Gender', 'DOB (YYYY-MM-DD)', 'Religion', 'Address',
    ];
    const rows = [
      ['Aarav Sharma', '7', 'A', '1', 'Rajesh Sharma', 'Sunita Sharma', '9876543210', '9876543211', 'Male', '2013-05-15', 'Hindu', '12 MG Road, Moradabad'],
      ['Zainab Khan', '7', 'A', '2', 'Ahmed Khan', 'Fatima Khan', '9876543212', '9876543213', 'Female', '2013-08-20', 'Muslim', '45 Civil Lines, Moradabad'],
      ['Gurpreet Singh', '7', 'B', '1', 'Harjinder Singh', 'Manpreet Kaur', '9876543214', '9876543215', 'Male', '2013-03-10', 'Sikh', '78 Guru Nagar, Moradabad'],
    ];
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  // CSV parsing
  const parseCSV = (text: string): UploadPreviewRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_'));
    const rows: UploadPreviewRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Handle quoted CSV values
      const vals: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of lines[i]) {
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { vals.push(current.trim()); current = ''; }
        else { current += char; }
      }
      vals.push(current.trim());

      const row: any = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });

      const name = row['student_name'] || row['name'] || row['studentname'] || '';
      const cls = row['class'] || row['grade'] || '';
      const section = row['section'] || '';
      const parentName = row['father_name'] || row['parent_name'] || row['parentname'] || row['guardian_name'] || '';
      const motherName = row['mother_name'] || row['mothername'] || '';
      const parentPhone = (row['father_phone'] || row['parent_phone'] || row['parentphone'] || row['phone'] || '').replace(/\D/g, '');
      const secondaryPhone = (row['mother_phone'] || row['secondary_phone'] || row['secondaryphone'] || '').replace(/\D/g, '');
      const religion = row['religion'] || 'Not Specified';
      const gender = row['gender'] || '';
      const dob = row['dob__yyyy_mm_dd_'] || row['dob'] || row['date_of_birth'] || row['dateofbirth'] || '';
      const rollNumber = row['roll_no'] || row['roll_number'] || row['rollnumber'] || row['roll'] || '';
      const admissionNumber = row['admission_number'] || row['admissionnumber'] || row['admission'] || '';
      const address = row['address'] || '';

      const valid = !!(name && cls && section && parentName && parentPhone.length === 10);
      rows.push({
        name, class: cls, section, parentName, parentPhone,
        rollNumber, admissionNumber, gender, address,
        motherName, religion, dateOfBirth: dob,
        busRoute: row['bus_route'] || row['busroute'] || '',
        parentEmail: row['parent_email'] || row['parentemail'] || row['email'] || '',
        _valid: valid,
        _error: !valid ? (!name ? 'Missing name' : !cls ? 'Missing class' : !section ? 'Missing section' : !parentName ? 'Missing father name' : 'Invalid phone (need 10 digits)') : undefined,
      });
    }
    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast.error('Please upload a .csv, .xlsx, or .xls file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error('No valid rows found. Download the template for correct format.');
        return;
      }
      setUploadPreview(rows);
      setShowUploadModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBulkImport = async () => {
    const validRows = uploadPreview.filter(r => r._valid);
    if (validRows.length === 0) { toast.error('No valid rows to import'); return; }
    setUploading(true);
    let imported = 0;
    let failed = 0;
    for (const row of validRows) {
      try {
        await supabase.from('students').insert({
          school_id: user!.schoolId,
          name: row.name, class: row.class, section: row.section,
          roll_number: row.rollNumber || null, admission_number: row.admissionNumber || null,
          gender: row.gender || null, address: row.address || null,
          date_of_birth: row.dateOfBirth || null,
          bus_route: row.busRoute || null, parent_name: row.parentName,
          mother_name: row.motherName || null,
          parent_phone: row.parentPhone, parent_email: row.parentEmail || null,
          secondary_phone: row.parentPhone ? undefined : null,
          religion: row.religion || 'Not Specified',
        });
        imported++;
      } catch { failed++; }
    }
    toast.success(`Imported ${imported} students${failed > 0 ? `, ${failed} failed` : ''}`);
    setShowUploadModal(false);
    setUploadPreview([]);
    fetchStudents();
    setUploading(false);
  };

  const feeStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
      overdue: 'bg-red-100 text-red-700', partial: 'bg-orange-100 text-orange-700',
    };
    return `inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Students</h1>
            <p className="text-[#64748B] text-sm">{total} students total</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button onClick={downloadTemplate} className="bg-white border border-[#E2E8F0] text-[#1E293B] px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F8FAFC] flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Template
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-white border border-[#E2E8F0] text-[#1E293B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#F8FAFC] flex items-center gap-2"
            >
              📊 Export Excel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-[#E2E8F0] text-[#1E293B] px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[#F8FAFC] flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload CSV
            </button>
            <button onClick={openAdd} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0]">
          <div className="flex flex-wrap gap-3">
            <input
              type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, parent, phone..."
              className="flex-1 min-w-48 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            />
            <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterSection} onChange={e => { setFilterSection(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              <option value="">All Sections</option>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin w-6 h-6 text-[#0D9488] mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-5xl mb-3">👨‍🎓</p>
              <p className="text-[#1E293B] font-semibold">No students found</p>
              <p className="text-[#64748B] text-sm mt-1">Add your first student or upload a CSV file</p>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={downloadTemplate} className="bg-white border border-[#E2E8F0] text-[#1E293B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#F8FAFC]">Download Template</button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-white border border-[#E2E8F0] text-[#1E293B] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#F8FAFC]">Upload CSV</button>
                <button onClick={openAdd} className="bg-[#0D9488] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e]">Add Student</button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? students.map(s => s.id) : [])} checked={selectedIds.length === students.length && students.length > 0} className="rounded" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Photo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Parent</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Religion</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Fee Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748B] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={e => setSelectedIds(e.target.checked ? [...selectedIds, s.id] : selectedIds.filter(id => id !== s.id))} className="rounded" />
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                      <td className="px-4 py-3">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.name} className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0]" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#0D9488] flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#1E293B]">{s.name}</p>
                        <p className="text-xs text-[#64748B]">{s.admissionNumber || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-[#1E293B]">{s.class}-{s.section}</td>
                      <td className="px-4 py-3 text-[#64748B]">{s.rollNumber || '-'}</td>
                      <td className="px-4 py-3 text-[#1E293B]">{s.parentName}</td>
                      <td className="px-4 py-3 text-[#64748B]">{formatPhone(s.parentPhone)}</td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">{s.religion || 'Not Specified'}</td>
                      <td className="px-4 py-3">
                        <span className={feeStatusBadge(s.feeStatus || 'paid')}>{s.feeStatus || 'paid'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(s)} className="text-[#0D9488] hover:text-[#0f766e] text-xs font-medium">Edit</button>
                          <button onClick={() => handleMarkInactive(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Deactivate</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[#E2E8F0] flex items-center justify-between">
              <p className="text-sm text-[#64748B]">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-[#E2E8F0] rounded text-sm disabled:opacity-50 hover:bg-gray-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border border-[#E2E8F0] rounded text-sm disabled:opacity-50 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E293B]">{editStudent ? 'Edit Student' : 'Add Student'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Student Name *', key: 'name', type: 'text' },
                { label: 'Roll Number', key: 'rollNumber', type: 'text' },
                { label: 'Admission Number', key: 'admissionNumber', type: 'text' },
                { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                { label: 'Address', key: 'address', type: 'text' },
                { label: 'Bus Route', key: 'busRoute', type: 'text' },
                { label: 'Father/Guardian Name *', key: 'parentName', type: 'text' },
                { label: 'Mother Name', key: 'motherName', type: 'text' },
                { label: 'Father Phone * (10 digits)', key: 'parentPhone', type: 'tel' },
                { label: 'Mother/Secondary Phone', key: 'secondaryPhone', type: 'tel' },
                { label: 'Parent Email', key: 'parentEmail', type: 'email' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Student Name *', key: 'name', type: 'text' },
                  { label: 'Roll Number', key: 'rollNumber', type: 'text' },
                  { label: 'Admission Number', key: 'admissionNumber', type: 'text' },
                  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                  { label: 'Address', key: 'address', type: 'text' },
                  { label: 'Bus Route', key: 'busRoute', type: 'text' },
                  { label: 'Parent/Guardian Name *', key: 'parentName', type: 'text' },
                  { label: 'Parent Phone * (10 digits)', key: 'parentPhone', type: 'tel' },
                  { label: 'Secondary Phone', key: 'secondaryPhone', type: 'tel' },
                  { label: 'Parent Email', key: 'parentEmail', type: 'email' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-[#1E293B] mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Class *</label>
                  <select value={form.class} onChange={e => setForm(f => ({ ...f, class: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Section *</label>
                  <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Section</option>
                    {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1">Religion</label>
                <select value={form.religion} onChange={e => setForm(f => ({ ...f, religion: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#E2E8F0] px-6 py-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploadingPhoto} className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60">
                {saving || uploadingPhoto ? 'Saving...' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Preview Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#1E293B]">Upload Preview</h2>
                <p className="text-sm text-[#64748B]">
                  {uploadPreview.filter(r => r._valid).length} valid / {uploadPreview.filter(r => !r._valid).length} invalid rows
                </p>
              </div>
              <button onClick={() => { setShowUploadModal(false); setUploadPreview([]); }} className="text-[#64748B] hover:text-[#1E293B]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 font-medium">Required: Student Name, Class, Section, Father Name, Father Phone (10 digits)</p>
                <p className="text-xs text-blue-600 mt-0.5">Optional: Roll No, Mother Name, Mother Phone, Gender, DOB, Religion, Address</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Status</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Class</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Section</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Father Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Phone</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Religion</th>
                      <th className="px-3 py-2 text-left font-semibold text-[#64748B]">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {uploadPreview.map((row, idx) => (
                      <tr key={idx} className={row._valid ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="px-3 py-2">{row._valid ? '✅' : '❌'}</td>
                        <td className="px-3 py-2 font-medium">{row.name || '-'}</td>
                        <td className="px-3 py-2">{row.class || '-'}</td>
                        <td className="px-3 py-2">{row.section || '-'}</td>
                        <td className="px-3 py-2">{row.parentName || '-'}</td>
                        <td className="px-3 py-2">{row.parentPhone || '-'}</td>
                        <td className="px-3 py-2">{row.religion || '-'}</td>
                        <td className="px-3 py-2 text-red-600">{row._error || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-t border-[#E2E8F0] px-6 py-4 flex gap-3 flex-shrink-0">
              <button onClick={() => { setShowUploadModal(false); setUploadPreview([]); }} className="flex-1 border border-[#E2E8F0] text-[#64748B] py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleBulkImport}
                disabled={uploading || uploadPreview.filter(r => r._valid).length === 0}
                className="flex-1 bg-[#0D9488] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#0f766e] disabled:opacity-60"
              >
                {uploading ? 'Importing...' : `Import ${uploadPreview.filter(r => r._valid).length} Students`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
