-- Migration: Fix seed data - ensure DPS school and auth users exist
-- This migration is idempotent and safe to run multiple times

-- Step 1: Ensure DPS school exists
DO $$
DECLARE
  dps_school_id UUID;
BEGIN
  -- Check if DPS school already exists
  SELECT id INTO dps_school_id FROM public.schools WHERE slug = 'dps-moradabad' LIMIT 1;

  IF dps_school_id IS NULL THEN
    INSERT INTO public.schools (
      id, name, slug, city, state, board, principal_name,
      contact_phone, contact_email, subscription_tier, subscription_status, student_slab,
      daily_report_enabled, daily_report_time, fee_reminder_enabled, birthday_greeting_enabled,
      escalation_level1_days, escalation_level2_days, escalation_level3_days,
      escalation_level4_days, escalation_level5_days, skip_weekends
    ) VALUES (
      gen_random_uuid(),
      'Delhi Public School, Moradabad',
      'dps-moradabad',
      'Moradabad',
      'Uttar Pradesh',
      'CBSE',
      'Dr. Rajesh Sharma',
      '9876543210',
      'admin@dps-moradabad.com',
      'growth',
      'active',
      'medium',
      true, '16:00', true, true,
      3, 7, 15, 21, 30, true
    )
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO dps_school_id FROM public.schools WHERE slug = 'dps-moradabad' LIMIT 1;
    RAISE NOTICE 'Created DPS school with id: %', dps_school_id;
  ELSE
    RAISE NOTICE 'DPS school already exists with id: %', dps_school_id;
  END IF;
END $$;

-- Step 2: Create auth users with all required fields
DO $$
DECLARE
  super_admin_uuid UUID;
  school_admin_uuid UUID;
  teacher_uuid UUID;
  dps_school_id UUID;
BEGIN
  SELECT id INTO dps_school_id FROM public.schools WHERE slug = 'dps-moradabad' LIMIT 1;

  -- Create super admin auth user
  SELECT id INTO super_admin_uuid FROM auth.users WHERE email = 'admin@relayrasolutions.com' LIMIT 1;
  IF super_admin_uuid IS NULL THEN
    super_admin_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      super_admin_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@relayrasolutions.com',
      crypt('Relayra@2026', gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('full_name', 'Relayra Admin', 'role', 'super_admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (email) DO NOTHING;

    SELECT id INTO super_admin_uuid FROM auth.users WHERE email = 'admin@relayrasolutions.com' LIMIT 1;
    RAISE NOTICE 'Created super admin auth user: %', super_admin_uuid;
  ELSE
    RAISE NOTICE 'Super admin auth user already exists: %', super_admin_uuid;
  END IF;

  -- Create school admin auth user
  SELECT id INTO school_admin_uuid FROM auth.users WHERE email = 'admin@dps-moradabad.com' LIMIT 1;
  IF school_admin_uuid IS NULL THEN
    school_admin_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      school_admin_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@dps-moradabad.com',
      crypt('Demo@1234', gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('full_name', 'DPS Admin', 'role', 'school_admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (email) DO NOTHING;

    SELECT id INTO school_admin_uuid FROM auth.users WHERE email = 'admin@dps-moradabad.com' LIMIT 1;
    RAISE NOTICE 'Created school admin auth user: %', school_admin_uuid;
  ELSE
    RAISE NOTICE 'School admin auth user already exists: %', school_admin_uuid;
  END IF;

  -- Create teacher auth user
  SELECT id INTO teacher_uuid FROM auth.users WHERE email = 'teacher.7a@dps-moradabad.com' LIMIT 1;
  IF teacher_uuid IS NULL THEN
    teacher_uuid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      teacher_uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'teacher.7a@dps-moradabad.com',
      crypt('Teacher@1234', gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('full_name', 'Class 7-A Teacher', 'role', 'school_staff'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    ) ON CONFLICT (email) DO NOTHING;

    SELECT id INTO teacher_uuid FROM auth.users WHERE email = 'teacher.7a@dps-moradabad.com' LIMIT 1;
    RAISE NOTICE 'Created teacher auth user: %', teacher_uuid;
  ELSE
    RAISE NOTICE 'Teacher auth user already exists: %', teacher_uuid;
  END IF;

  -- Step 3: Insert matching records in public.users table
  -- Super admin user
  IF super_admin_uuid IS NOT NULL THEN
    INSERT INTO public.users (auth_id, email, role, school_id, name, is_active)
    VALUES (super_admin_uuid, 'admin@relayrasolutions.com', 'super_admin', NULL, 'Relayra Admin', true)
    ON CONFLICT (auth_id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active;
    RAISE NOTICE 'Upserted super admin in public.users';
  END IF;

  -- School admin user
  IF school_admin_uuid IS NOT NULL AND dps_school_id IS NOT NULL THEN
    INSERT INTO public.users (auth_id, email, role, school_id, name, is_active)
    VALUES (school_admin_uuid, 'admin@dps-moradabad.com', 'school_admin', dps_school_id, 'DPS Admin', true)
    ON CONFLICT (auth_id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      school_id = EXCLUDED.school_id,
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active;
    RAISE NOTICE 'Upserted school admin in public.users';
  END IF;

  -- Teacher user
  IF teacher_uuid IS NOT NULL AND dps_school_id IS NOT NULL THEN
    INSERT INTO public.users (auth_id, email, role, school_id, name, assigned_class, assigned_section, is_active)
    VALUES (teacher_uuid, 'teacher.7a@dps-moradabad.com', 'school_staff', dps_school_id, 'Class 7-A Teacher', '7', 'A', true)
    ON CONFLICT (auth_id) DO UPDATE SET
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      school_id = EXCLUDED.school_id,
      name = EXCLUDED.name,
      assigned_class = EXCLUDED.assigned_class,
      assigned_section = EXCLUDED.assigned_section,
      is_active = EXCLUDED.is_active;
    RAISE NOTICE 'Upserted teacher in public.users';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;

-- Step 4: Create a function to auto-provision user records on first login
-- This is called from the application when a user logs in but has no record in public.users
CREATE OR REPLACE FUNCTION public.auto_provision_user(
  p_auth_id UUID,
  p_email TEXT
)
RETURNS TABLE(
  id UUID,
  auth_id UUID,
  email TEXT,
  role TEXT,
  school_id UUID,
  name TEXT,
  assigned_class TEXT,
  assigned_section TEXT,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_school_id UUID;
  v_assigned_class TEXT := NULL;
  v_assigned_section TEXT := NULL;
  v_user_id UUID;
BEGIN
  -- Determine role and name based on email
  IF p_email = 'admin@relayrasolutions.com' THEN
    v_role := 'super_admin';
    v_name := 'Relayra Admin';
    v_school_id := NULL;
  ELSIF p_email = 'admin@dps-moradabad.com' THEN
    v_role := 'school_admin';
    v_name := 'DPS Admin';
    SELECT s.id INTO v_school_id FROM public.schools s WHERE s.slug = 'dps-moradabad' LIMIT 1;
  ELSIF p_email = 'teacher.7a@dps-moradabad.com' THEN
    v_role := 'school_staff';
    v_name := 'Class 7-A Teacher';
    v_assigned_class := '7';
    v_assigned_section := 'A';
    SELECT s.id INTO v_school_id FROM public.schools s WHERE s.slug = 'dps-moradabad' LIMIT 1;
  ELSE
    -- Default: school_admin for unknown emails
    v_role := 'school_admin';
    v_name := split_part(p_email, '@', 1);
    v_school_id := NULL;
  END IF;

  -- Upsert the user record
  INSERT INTO public.users (auth_id, email, role, school_id, name, assigned_class, assigned_section, is_active)
  VALUES (p_auth_id, p_email, v_role, v_school_id, v_name, v_assigned_class, v_assigned_section, true)
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_id = EXCLUDED.school_id,
    name = EXCLUDED.name,
    assigned_class = EXCLUDED.assigned_class,
    assigned_section = EXCLUDED.assigned_section,
    is_active = EXCLUDED.is_active
  RETURNING public.users.id INTO v_user_id;

  -- Return the user record
  RETURN QUERY
  SELECT u.id, u.auth_id, u.email, u.role, u.school_id, u.name, u.assigned_class, u.assigned_section, u.is_active
  FROM public.users u
  WHERE u.auth_id = p_auth_id
  LIMIT 1;
END;
$$;

-- Step 5: Update RLS policies on users table to allow authenticated users to read their own record
-- and allow the auto_provision_user function (SECURITY DEFINER) to insert/update

-- Drop existing policies on users table and recreate them properly
DROP POLICY IF EXISTS "users_read_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "super_admin_all_users" ON public.users;
DROP POLICY IF EXISTS "school_admin_school_users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_manage_own" ON public.users;
DROP POLICY IF EXISTS "allow_read_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_insert_own_user" ON public.users;
DROP POLICY IF EXISTS "allow_update_own_user" ON public.users;

-- Allow authenticated users to read their own record
CREATE POLICY "users_select_own_record"
ON public.users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- Allow authenticated users to update their own record
CREATE POLICY "users_update_own_record"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Allow authenticated users to insert their own record (for auto-provisioning fallback)
CREATE POLICY "users_insert_own_record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Grant execute permission on auto_provision_user to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_provision_user(UUID, TEXT) TO authenticated;
