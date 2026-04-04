-- ============================================================
-- FIX: Clean RLS policies for all tables
--
-- Problem: Multiple migrations left overlapping/conflicting RLS
-- policies. Some tables had duplicate policies with different
-- names, some were missing DELETE policies, and inline subqueries
-- on the users table risked circular RLS evaluation.
--
-- Solution: Drop ALL existing policies, recreate clean ones using
-- SECURITY DEFINER helper functions (which bypass RLS).
-- ============================================================

-- ============================================================
-- 1. RECREATE HELPER FUNCTIONS (SECURITY DEFINER — bypass RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- ============================================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================================

-- schools
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'schools' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.schools', r.policyname); END LOOP; END $$;

-- users
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname); END LOOP; END $$;

-- students
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'students' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.students', r.policyname); END LOOP; END $$;

-- fee_records
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'fee_records' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.fee_records', r.policyname); END LOOP; END $$;

-- attendance
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'attendance' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.attendance', r.policyname); END LOOP; END $$;

-- messages
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages', r.policyname); END LOOP; END $$;

-- message_recipients
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'message_recipients' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.message_recipients', r.policyname); END LOOP; END $$;

-- message_templates
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'message_templates' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.message_templates', r.policyname); END LOOP; END $$;

-- parent_queries
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'parent_queries' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.parent_queries', r.policyname); END LOOP; END $$;

-- activity_log
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'activity_log' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.activity_log', r.policyname); END LOOP; END $$;

-- holidays
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'holidays' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.holidays', r.policyname); END LOOP; END $$;

-- academic_calendar
DO $$ DECLARE r RECORD;
BEGIN FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'academic_calendar' AND schemaname = 'public'
LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.academic_calendar', r.policyname); END LOOP; END $$;

-- ============================================================
-- 3. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. CREATE CLEAN RLS POLICIES
--    Pattern: super_admin gets full access via is_super_admin()
--    School users get scoped access via get_user_school_id()
--    All helpers are SECURITY DEFINER (bypass RLS, no recursion)
-- ============================================================

-- -------------------------------------------------------
-- SCHOOLS
-- -------------------------------------------------------
-- Super admin: full access
CREATE POLICY "schools_super_admin" ON public.schools
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Any authenticated user can read schools (needed for login flow, school selection)
CREATE POLICY "schools_select_authenticated" ON public.schools
  FOR SELECT TO authenticated
  USING (true);

-- School admin can update their own school
CREATE POLICY "schools_update_own" ON public.schools
  FOR UPDATE TO authenticated
  USING (id = public.get_user_school_id())
  WITH CHECK (id = public.get_user_school_id());

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
-- Super admin: full access
CREATE POLICY "users_super_admin" ON public.users
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Any user can read their own record (critical for auth flow)
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth_id = auth.uid());

-- School admin can read all users in their school
CREATE POLICY "users_select_school" ON public.users
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id() AND public.get_user_school_id() IS NOT NULL);

-- School admin can manage users in their school
CREATE POLICY "users_manage_school" ON public.users
  FOR ALL TO authenticated
  USING (school_id = public.get_user_school_id() AND public.get_user_role() = 'school_admin')
  WITH CHECK (school_id = public.get_user_school_id() AND public.get_user_role() = 'school_admin');

-- Any user can update their own record
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Any user can insert their own record (auto-provisioning)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

-- -------------------------------------------------------
-- STUDENTS
-- -------------------------------------------------------
CREATE POLICY "students_super_admin" ON public.students
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "students_select" ON public.students
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "students_insert" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "students_update" ON public.students
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "students_delete" ON public.students
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- FEE_RECORDS
-- -------------------------------------------------------
CREATE POLICY "fee_records_super_admin" ON public.fee_records
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "fee_records_select" ON public.fee_records
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "fee_records_insert" ON public.fee_records
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "fee_records_update" ON public.fee_records
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "fee_records_delete" ON public.fee_records
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- ATTENDANCE
-- -------------------------------------------------------
CREATE POLICY "attendance_super_admin" ON public.attendance
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "attendance_update" ON public.attendance
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "attendance_delete" ON public.attendance
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- MESSAGES
-- -------------------------------------------------------
CREATE POLICY "messages_super_admin" ON public.messages
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "messages_select" ON public.messages
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "messages_update" ON public.messages
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "messages_delete" ON public.messages
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- MESSAGE_RECIPIENTS
-- -------------------------------------------------------
CREATE POLICY "message_recipients_super_admin" ON public.message_recipients
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "message_recipients_select" ON public.message_recipients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.school_id = public.get_user_school_id()
  ));

CREATE POLICY "message_recipients_insert" ON public.message_recipients
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.school_id = public.get_user_school_id()
  ));

CREATE POLICY "message_recipients_delete" ON public.message_recipients
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.school_id = public.get_user_school_id()
  ));

-- -------------------------------------------------------
-- MESSAGE_TEMPLATES
-- -------------------------------------------------------
CREATE POLICY "message_templates_super_admin" ON public.message_templates
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- All authenticated users can read system templates (school_id IS NULL) + their school's templates
CREATE POLICY "message_templates_select" ON public.message_templates
  FOR SELECT TO authenticated
  USING (school_id IS NULL OR school_id = public.get_user_school_id());

CREATE POLICY "message_templates_insert" ON public.message_templates
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "message_templates_update" ON public.message_templates
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "message_templates_delete" ON public.message_templates
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- PARENT_QUERIES
-- -------------------------------------------------------
CREATE POLICY "parent_queries_super_admin" ON public.parent_queries
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "parent_queries_select" ON public.parent_queries
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "parent_queries_insert" ON public.parent_queries
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "parent_queries_update" ON public.parent_queries
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- ACTIVITY_LOG
-- -------------------------------------------------------
CREATE POLICY "activity_log_super_admin" ON public.activity_log
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- HOLIDAYS
-- -------------------------------------------------------
CREATE POLICY "holidays_super_admin" ON public.holidays
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "holidays_select" ON public.holidays
  FOR SELECT TO authenticated
  USING (school_id IS NULL OR school_id = public.get_user_school_id());

CREATE POLICY "holidays_insert" ON public.holidays
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "holidays_update" ON public.holidays
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "holidays_delete" ON public.holidays
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- -------------------------------------------------------
-- ACADEMIC_CALENDAR
-- -------------------------------------------------------
CREATE POLICY "academic_calendar_super_admin" ON public.academic_calendar
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "academic_calendar_select" ON public.academic_calendar
  FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id());

CREATE POLICY "academic_calendar_insert" ON public.academic_calendar
  FOR INSERT TO authenticated
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "academic_calendar_update" ON public.academic_calendar
  FOR UPDATE TO authenticated
  USING (school_id = public.get_user_school_id())
  WITH CHECK (school_id = public.get_user_school_id());

CREATE POLICY "academic_calendar_delete" ON public.academic_calendar
  FOR DELETE TO authenticated
  USING (school_id = public.get_user_school_id());

-- ============================================================
-- 5. ENSURE GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auto_provision_user(UUID, TEXT) TO authenticated;

-- ============================================================
-- 6. VERIFY: List all active policies (run this to confirm)
-- ============================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
