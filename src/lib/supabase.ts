import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'super_admin' | 'school_admin' | 'school_staff';

export interface AppUser {
  id: string;
  authId: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  name: string;
  phone: string | null;
  isActive: boolean;
}

export interface School {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string;
  board: string | null;
  principalName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
  studentSlab: string;
  dailyReportEnabled: boolean;
  dailyReportTime: string;
  feeReminderEnabled: boolean;
  birthdayGreetingEnabled: boolean;
  escalationLevel1Days: number;
  escalationLevel2Days: number;
  escalationLevel3Days: number;
  escalationLevel4Days: number;
  escalationLevel5Days: number;
  skipWeekends: boolean;
  holidayDates: string[];
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string | null;
  admissionNumber: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  photoUrl: string | null;
  address: string | null;
  busRoute: string | null;
  motherName: string | null;
  parentName: string;
  parentPhone: string;
  secondaryPhone: string | null;
  parentEmail: string | null;
  religion: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

export interface FeeRecord {
  id: string;
  schoolId: string;
  studentId: string;
  feeType: string;
  description: string | null;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  paymentDate: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  escalationLevel: number;
  reminderCount: number;
  createdAt: string;
  student?: Student;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  date: string;
  status: string;
  markedBy: string | null;
  markedVia: string;
  createdAt: string;
}

export interface Message {
  id: string;
  schoolId: string;
  type: string;
  title: string | null;
  body: string;
  targetType: string | null;
  targetValue: string | null;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  isTemplate: boolean;
  templateName: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  schoolId: string;
  userId: string | null;
  action: string;
  description: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
}

export interface ParentQuery {
  id: string;
  schoolId: string;
  studentId: string | null;
  parentPhone: string;
  parentName: string | null;
  queryText: string;
  responseText: string | null;
  respondedBy: string | null;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

// Format Indian currency
export function formatCurrency(paisa: number): string {
  const rupees = paisa / 100;
  const formatted = rupees.toLocaleString('en-IN');
  return `Rs. ${formatted}`;
}

// Format date to DD/MM/YYYY
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format phone with +91
export function formatPhone(phone: string | null): string {
  if (!phone) return '-';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) return `+91 ${clean}`;
  return phone;
}

// Time ago
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return formatDate(dateStr);
}
