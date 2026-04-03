-- ============================================================
-- RELAYRA SOLUTIONS - Complete Database Schema
-- ============================================================

-- ============================================================
-- 1. CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    address TEXT,
    city TEXT,
    state TEXT DEFAULT 'Uttar Pradesh',
    board TEXT,
    principal_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    subscription_tier TEXT DEFAULT 'starter',
    subscription_status TEXT DEFAULT 'trial',
    student_slab TEXT DEFAULT 'small',
    daily_report_enabled BOOLEAN DEFAULT true,
    daily_report_time TEXT DEFAULT '16:00',
    fee_reminder_enabled BOOLEAN DEFAULT true,
    birthday_greeting_enabled BOOLEAN DEFAULT true,
    escalation_level1_days INTEGER DEFAULT 3,
    escalation_level2_days INTEGER DEFAULT 7,
    escalation_level3_days INTEGER DEFAULT 15,
    escalation_level4_days INTEGER DEFAULT 21,
    escalation_level5_days INTEGER DEFAULT 30,
    skip_weekends BOOLEAN DEFAULT true,
    holiday_dates JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll_number TEXT,
    admission_number TEXT,
    date_of_birth DATE,
    gender TEXT,
    photo_url TEXT,
    address TEXT,
    bus_route TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    secondary_phone TEXT,
    parent_email TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_school_class_section ON public.students(school_id, class, section);
CREATE INDEX IF NOT EXISTS idx_students_school_phone ON public.students(school_id, parent_phone);

CREATE TABLE IF NOT EXISTS public.fee_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_type TEXT NOT NULL,
    description TEXT,
    total_amount INTEGER NOT NULL,
    paid_amount INTEGER DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    payment_method TEXT,
    receipt_number TEXT,
    receipt_url TEXT,
    escalation_level INTEGER DEFAULT 0,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMPTZ,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,
    installment_of UUID REFERENCES public.fee_records(id),
    installment_number INTEGER,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fee_records_school_status ON public.fee_records(school_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_records_school_student ON public.fee_records(school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_school_due_date ON public.fee_records(school_id, due_date);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    marked_by UUID REFERENCES public.users(id),
    marked_via TEXT DEFAULT 'dashboard',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance(school_id, date);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    attachment_url TEXT,
    target_type TEXT,
    target_value TEXT,
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    is_template BOOLEAN DEFAULT false,
    template_name TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    parent_phone TEXT,
    status TEXT DEFAULT 'queued',
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parent_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    parent_phone TEXT NOT NULL,
    parent_name TEXT,
    query_text TEXT NOT NULL,
    response_text TEXT,
    responded_by TEXT,
    status TEXT DEFAULT 'pending',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    description TEXT,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_school_created ON public.activity_log(school_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. HELPER FUNCTIONS (before RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT school_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin'
);
$$;

-- ============================================================
-- 3. ENABLE RLS
-- ============================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- schools
DROP POLICY IF EXISTS "schools_super_admin_all" ON public.schools;
CREATE POLICY "schools_super_admin_all" ON public.schools
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "schools_school_admin_own" ON public.schools;
CREATE POLICY "schools_school_admin_own" ON public.schools
FOR SELECT TO authenticated
USING (id = public.get_user_school_id());

DROP POLICY IF EXISTS "schools_school_admin_update" ON public.schools;
CREATE POLICY "schools_school_admin_update" ON public.schools
FOR UPDATE TO authenticated
USING (id = public.get_user_school_id() AND public.get_user_role() = 'school_admin')
WITH CHECK (id = public.get_user_school_id() AND public.get_user_role() = 'school_admin');

-- users
DROP POLICY IF EXISTS "users_super_admin_all" ON public.users;
CREATE POLICY "users_super_admin_all" ON public.users
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "users_own_record" ON public.users;
CREATE POLICY "users_own_record" ON public.users
FOR SELECT TO authenticated
USING (auth_id = auth.uid());

DROP POLICY IF EXISTS "users_school_admin_school" ON public.users;
CREATE POLICY "users_school_admin_school" ON public.users
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id() AND public.get_user_role() IN ('school_admin'))
WITH CHECK (school_id = public.get_user_school_id() AND public.get_user_role() IN ('school_admin'));

-- students
DROP POLICY IF EXISTS "students_super_admin_all" ON public.students;
CREATE POLICY "students_super_admin_all" ON public.students
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "students_school_access" ON public.students;
CREATE POLICY "students_school_access" ON public.students
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- fee_records
DROP POLICY IF EXISTS "fee_records_super_admin_all" ON public.fee_records;
CREATE POLICY "fee_records_super_admin_all" ON public.fee_records
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "fee_records_school_access" ON public.fee_records;
CREATE POLICY "fee_records_school_access" ON public.fee_records
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- attendance
DROP POLICY IF EXISTS "attendance_super_admin_all" ON public.attendance;
CREATE POLICY "attendance_super_admin_all" ON public.attendance
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "attendance_school_access" ON public.attendance;
CREATE POLICY "attendance_school_access" ON public.attendance
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- messages
DROP POLICY IF EXISTS "messages_super_admin_all" ON public.messages;
CREATE POLICY "messages_super_admin_all" ON public.messages
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "messages_school_access" ON public.messages;
CREATE POLICY "messages_school_access" ON public.messages
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- message_recipients
DROP POLICY IF EXISTS "message_recipients_super_admin_all" ON public.message_recipients;
CREATE POLICY "message_recipients_super_admin_all" ON public.message_recipients
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "message_recipients_school_access" ON public.message_recipients;
CREATE POLICY "message_recipients_school_access" ON public.message_recipients
FOR ALL TO authenticated
USING (
    message_id IN (SELECT id FROM public.messages WHERE school_id = public.get_user_school_id())
)
WITH CHECK (
    message_id IN (SELECT id FROM public.messages WHERE school_id = public.get_user_school_id())
);

-- parent_queries
DROP POLICY IF EXISTS "parent_queries_super_admin_all" ON public.parent_queries;
CREATE POLICY "parent_queries_super_admin_all" ON public.parent_queries
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "parent_queries_school_access" ON public.parent_queries;
CREATE POLICY "parent_queries_school_access" ON public.parent_queries
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- activity_log
DROP POLICY IF EXISTS "activity_log_super_admin_all" ON public.activity_log;
CREATE POLICY "activity_log_super_admin_all" ON public.activity_log
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "activity_log_school_access" ON public.activity_log;
CREATE POLICY "activity_log_school_access" ON public.activity_log
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id())
WITH CHECK (school_id = public.get_user_school_id());

-- holidays
DROP POLICY IF EXISTS "holidays_super_admin_all" ON public.holidays;
CREATE POLICY "holidays_super_admin_all" ON public.holidays
FOR ALL TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "holidays_school_access" ON public.holidays;
CREATE POLICY "holidays_school_access" ON public.holidays
FOR ALL TO authenticated
USING (school_id = public.get_user_school_id() OR school_id IS NULL)
WITH CHECK (school_id = public.get_user_school_id());

-- ============================================================
-- 5. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_schools_updated_at ON public.schools;
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fee_records_updated_at ON public.fee_records;
CREATE TRIGGER update_fee_records_updated_at
    BEFORE UPDATE ON public.fee_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
