-- ============================================================
-- RELAYRA - Fix users table RLS infinite recursion
-- + SECURITY DEFINER upsert function for login flow
-- + Sync demo user auth_ids from actual Supabase Auth UIDs
-- ============================================================

-- ============================================================
-- 1. FIX INFINITE RECURSION IN users TABLE RLS POLICIES
--    The helper functions (get_user_role, get_user_school_id,
--    is_super_admin) all query the users table, which triggers
--    the same RLS policies → infinite recursion (code 42P17).
--    Fix: replace with direct auth.uid() comparisons only.
-- ============================================================

-- Drop all existing users policies
DROP POLICY IF EXISTS "users_super_admin_all" ON public.users;
DROP POLICY IF EXISTS "users_own_record" ON public.users;
DROP POLICY IF EXISTS "users_school_admin_school" ON public.users;

-- SELECT: user can read their own row (no helper function, no recursion)
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

-- INSERT: authenticated user can insert their own row (auth_id must match their UID)
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

-- UPDATE: user can update their own row
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- ============================================================
-- 2. SECURITY DEFINER FUNCTION: upsert_user_on_login
--    Called from the login page to find or create a user record
--    without being blocked by RLS. Returns the user row.
-- ============================================================

CREATE OR REPLACE FUNCTION public.upsert_user_on_login(
    p_auth_id UUID,
    p_email    TEXT
)
RETURNS TABLE (
    id         UUID,
    auth_id    UUID,
    email      TEXT,
    role       TEXT,
    school_id  UUID,
    name       TEXT,
    is_active  BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_row public.users%ROWTYPE;
    v_school_id UUID;
BEGIN
    -- Step 1: Try to find by auth_id
    SELECT * INTO v_user_row
    FROM public.users u
    WHERE u.auth_id = p_auth_id
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY
        SELECT v_user_row.id, v_user_row.auth_id, v_user_row.email,
               v_user_row.role, v_user_row.school_id, v_user_row.name,
               v_user_row.is_active;
        RETURN;
    END IF;

    -- Step 2: Try to find by email and update auth_id
    SELECT * INTO v_user_row
    FROM public.users u
    WHERE u.email = p_email
    LIMIT 1;

    IF FOUND THEN
        UPDATE public.users
        SET auth_id = p_auth_id
        WHERE public.users.id = v_user_row.id;

        v_user_row.auth_id := p_auth_id;

        RETURN QUERY
        SELECT v_user_row.id, v_user_row.auth_id, v_user_row.email,
               v_user_row.role, v_user_row.school_id, v_user_row.name,
               v_user_row.is_active;
        RETURN;
    END IF;

    -- Step 3: No record found — create a new one
    -- Determine role from email pattern
    DECLARE
        v_role TEXT := 'school_admin';
        v_name TEXT := split_part(p_email, '@', 1);
    BEGIN
        IF p_email ILIKE '%relayrasolutions%' THEN
            v_role := 'super_admin';
            v_name := 'Relayra Admin';
            v_school_id := NULL;
        ELSIF p_email ILIKE '%teacher%' THEN
            v_role := 'school_staff';
            v_name := 'Teacher';
            SELECT s.id INTO v_school_id FROM public.schools s LIMIT 1;
        ELSE
            SELECT s.id INTO v_school_id FROM public.schools s LIMIT 1;
        END IF;

        INSERT INTO public.users (auth_id, email, role, school_id, name, is_active)
        VALUES (p_auth_id, p_email, v_role, v_school_id, v_name, true)
        RETURNING public.users.id, public.users.auth_id, public.users.email,
                  public.users.role, public.users.school_id, public.users.name,
                  public.users.is_active
        INTO v_user_row.id, v_user_row.auth_id, v_user_row.email,
             v_user_row.role, v_user_row.school_id, v_user_row.name,
             v_user_row.is_active;

        RETURN QUERY
        SELECT v_user_row.id, v_user_row.auth_id, v_user_row.email,
               v_user_row.role, v_user_row.school_id, v_user_row.name,
               v_user_row.is_active;
    END;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_user_on_login(UUID, TEXT) TO authenticated;

-- ============================================================
-- 3. SYNC DEMO USER auth_ids FROM ACTUAL SUPABASE AUTH UIDs
--    Updates the users table rows to match whatever UUID
--    Supabase Auth actually assigned to each email.
-- ============================================================

DO $$
DECLARE
    v_super_admin_auth_id UUID;
    v_school_admin_auth_id UUID;
    v_teacher_auth_id UUID;
BEGIN
    -- Get actual auth UIDs by email
    SELECT id INTO v_super_admin_auth_id
    FROM auth.users WHERE email = 'admin@relayrasolutions.com' LIMIT 1;

    SELECT id INTO v_school_admin_auth_id
    FROM auth.users WHERE email = 'admin@dps-moradabad.com' LIMIT 1;

    SELECT id INTO v_teacher_auth_id
    FROM auth.users WHERE email = 'teacher.7a@dps-moradabad.com' LIMIT 1;

    -- Update public.users rows to match actual auth UIDs
    IF v_super_admin_auth_id IS NOT NULL THEN
        UPDATE public.users
        SET auth_id = v_super_admin_auth_id
        WHERE email = 'admin@relayrasolutions.com';
    END IF;

    IF v_school_admin_auth_id IS NOT NULL THEN
        UPDATE public.users
        SET auth_id = v_school_admin_auth_id
        WHERE email = 'admin@dps-moradabad.com';
    END IF;

    IF v_teacher_auth_id IS NOT NULL THEN
        UPDATE public.users
        SET auth_id = v_teacher_auth_id
        WHERE email = 'teacher.7a@dps-moradabad.com';
    END IF;

    RAISE NOTICE 'Demo user auth_ids synced: super_admin=%, school_admin=%, teacher=%',
        v_super_admin_auth_id, v_school_admin_auth_id, v_teacher_auth_id;
END $$;
