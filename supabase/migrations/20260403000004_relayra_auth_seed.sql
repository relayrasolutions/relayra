-- ============================================================
-- RELAYRA SOLUTIONS - Auth Users + Complete Seed Data
-- ============================================================
-- This migration ensures all auth users exist and all seed data is populated.
-- It is fully idempotent (safe to run multiple times).
-- ============================================================

DO $$
DECLARE
    -- Fixed UUIDs for idempotency - these are stable across runs
    v_super_admin_auth_uuid UUID := 'a1b2c3d4-0001-0001-0001-000000000001'::UUID;
    v_school_admin_auth_uuid UUID := 'a1b2c3d4-0002-0002-0002-000000000002'::UUID;
    v_teacher_auth_uuid UUID := 'a1b2c3d4-0003-0003-0003-000000000003'::UUID;

    v_school_uuid UUID := 'b1c2d3e4-0001-0001-0001-000000000001'::UUID;
    v_super_admin_user_uuid UUID := 'c1d2e3f4-0001-0001-0001-000000000001'::UUID;
    v_school_admin_user_uuid UUID := 'c1d2e3f4-0002-0002-0002-000000000002'::UUID;
    v_teacher_user_uuid UUID := 'c1d2e3f4-0003-0003-0003-000000000003'::UUID;

    -- Student UUIDs (50 students)
    s1 UUID := 'd1e2f3a4-0001-0001-0001-000000000001'::UUID;
    s2 UUID := 'd1e2f3a4-0002-0002-0002-000000000002'::UUID;
    s3 UUID := 'd1e2f3a4-0003-0003-0003-000000000003'::UUID;
    s4 UUID := 'd1e2f3a4-0004-0004-0004-000000000004'::UUID;
    s5 UUID := 'd1e2f3a4-0005-0005-0005-000000000005'::UUID;
    s6 UUID := 'd1e2f3a4-0006-0006-0006-000000000006'::UUID;
    s7 UUID := 'd1e2f3a4-0007-0007-0007-000000000007'::UUID;
    s8 UUID := 'd1e2f3a4-0008-0008-0008-000000000008'::UUID;
    s9 UUID := 'd1e2f3a4-0009-0009-0009-000000000009'::UUID;
    s10 UUID := 'd1e2f3a4-0010-0010-0010-000000000010'::UUID;
    s11 UUID := 'd1e2f3a4-0011-0011-0011-000000000011'::UUID;
    s12 UUID := 'd1e2f3a4-0012-0012-0012-000000000012'::UUID;
    s13 UUID := 'd1e2f3a4-0013-0013-0013-000000000013'::UUID;
    s14 UUID := 'd1e2f3a4-0014-0014-0014-000000000014'::UUID;
    s15 UUID := 'd1e2f3a4-0015-0015-0015-000000000015'::UUID;
    s16 UUID := 'd1e2f3a4-0016-0016-0016-000000000016'::UUID;
    s17 UUID := 'd1e2f3a4-0017-0017-0017-000000000017'::UUID;
    s18 UUID := 'd1e2f3a4-0018-0018-0018-000000000018'::UUID;
    s19 UUID := 'd1e2f3a4-0019-0019-0019-000000000019'::UUID;
    s20 UUID := 'd1e2f3a4-0020-0020-0020-000000000020'::UUID;
    s21 UUID := 'd1e2f3a4-0021-0021-0021-000000000021'::UUID;
    s22 UUID := 'd1e2f3a4-0022-0022-0022-000000000022'::UUID;
    s23 UUID := 'd1e2f3a4-0023-0023-0023-000000000023'::UUID;
    s24 UUID := 'd1e2f3a4-0024-0024-0024-000000000024'::UUID;
    s25 UUID := 'd1e2f3a4-0025-0025-0025-000000000025'::UUID;
    s26 UUID := 'd1e2f3a4-0026-0026-0026-000000000026'::UUID;
    s27 UUID := 'd1e2f3a4-0027-0027-0027-000000000027'::UUID;
    s28 UUID := 'd1e2f3a4-0028-0028-0028-000000000028'::UUID;
    s29 UUID := 'd1e2f3a4-0029-0029-0029-000000000029'::UUID;
    s30 UUID := 'd1e2f3a4-0030-0030-0030-000000000030'::UUID;
    s31 UUID := 'd1e2f3a4-0031-0031-0031-000000000031'::UUID;
    s32 UUID := 'd1e2f3a4-0032-0032-0032-000000000032'::UUID;
    s33 UUID := 'd1e2f3a4-0033-0033-0033-000000000033'::UUID;
    s34 UUID := 'd1e2f3a4-0034-0034-0034-000000000034'::UUID;
    s35 UUID := 'd1e2f3a4-0035-0035-0035-000000000035'::UUID;
    s36 UUID := 'd1e2f3a4-0036-0036-0036-000000000036'::UUID;
    s37 UUID := 'd1e2f3a4-0037-0037-0037-000000000037'::UUID;
    s38 UUID := 'd1e2f3a4-0038-0038-0038-000000000038'::UUID;
    s39 UUID := 'd1e2f3a4-0039-0039-0039-000000000039'::UUID;
    s40 UUID := 'd1e2f3a4-0040-0040-0040-000000000040'::UUID;
    s41 UUID := 'd1e2f3a4-0041-0041-0041-000000000041'::UUID;
    s42 UUID := 'd1e2f3a4-0042-0042-0042-000000000042'::UUID;
    s43 UUID := 'd1e2f3a4-0043-0043-0043-000000000043'::UUID;
    s44 UUID := 'd1e2f3a4-0044-0044-0044-000000000044'::UUID;
    s45 UUID := 'd1e2f3a4-0045-0045-0045-000000000045'::UUID;
    s46 UUID := 'd1e2f3a4-0046-0046-0046-000000000046'::UUID;
    s47 UUID := 'd1e2f3a4-0047-0047-0047-000000000047'::UUID;
    s48 UUID := 'd1e2f3a4-0048-0048-0048-000000000048'::UUID;
    s49 UUID := 'd1e2f3a4-0049-0049-0049-000000000049'::UUID;
    s50 UUID := 'd1e2f3a4-0050-0050-0050-000000000050'::UUID;

    student_ids UUID[];
    today DATE := CURRENT_DATE;
    i INTEGER;
    j INTEGER;
    att_date DATE;
    att_status TEXT;
    rand_val FLOAT;
    fee_id UUID;
    fee_amount INTEGER;
    fee_status TEXT;
    fee_due DATE;
    fee_paid_amount INTEGER;
    fee_payment_date TIMESTAMPTZ;

BEGIN

    -- ============================================================
    -- 1. AUTH USERS (all 3 users)
    -- ============================================================
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        -- Super Admin
        (v_super_admin_auth_uuid,
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@relayrasolutions.com',
         crypt('Relayra@2026', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Super Admin', 'role', 'super_admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- School Admin
        (v_school_admin_auth_uuid,
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@dps-moradabad.com',
         crypt('Demo@1234', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Dr. Rajesh Sharma', 'role', 'school_admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        -- Teacher (school_staff)
        (v_teacher_auth_uuid,
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'teacher.7a@dps-moradabad.com',
         crypt('Teacher@1234', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Sunita Sharma', 'role', 'school_staff'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO UPDATE SET
        encrypted_password = crypt(
            CASE
                WHEN EXCLUDED.email = 'admin@relayrasolutions.com' THEN 'Relayra@2026'
                WHEN EXCLUDED.email = 'admin@dps-moradabad.com' THEN 'Demo@1234'
                ELSE 'Teacher@1234'
            END,
            gen_salt('bf', 10)
        ),
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
        updated_at = now();

    -- Also handle conflict on email (in case old seed ran with different UUIDs)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (v_teacher_auth_uuid,
         '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'teacher.7a@dps-moradabad.com',
         crypt('Teacher@1234', gen_salt('bf', 10)),
         now(), now(), now(),
         jsonb_build_object('name', 'Sunita Sharma', 'role', 'school_staff'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('Teacher@1234', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
        updated_at = now();

    -- Update existing super_admin and school_admin passwords if they exist with different UUIDs
    UPDATE auth.users
    SET encrypted_password = crypt('Relayra@2026', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE email = 'admin@relayrasolutions.com'
      AND id != v_super_admin_auth_uuid;

    UPDATE auth.users
    SET encrypted_password = crypt('Demo@1234', gen_salt('bf', 10)),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE email = 'admin@dps-moradabad.com'
      AND id != v_school_admin_auth_uuid;

    -- ============================================================
    -- 2. SCHOOL
    -- ============================================================
    INSERT INTO public.schools (id, name, slug, city, state, board, principal_name, contact_phone, contact_email,
        subscription_tier, subscription_status, student_slab)
    VALUES (v_school_uuid, 'Delhi Public School, Moradabad', 'dps-moradabad', 'Moradabad', 'Uttar Pradesh',
        'CBSE', 'Dr. Rajesh Sharma', '9876543210', 'admin@dps-moradabad.com',
        'growth', 'active', 'medium')
    ON CONFLICT (id) DO NOTHING;

    -- Also handle slug conflict
    INSERT INTO public.schools (id, name, slug, city, state, board, principal_name, contact_phone, contact_email,
        subscription_tier, subscription_status, student_slab)
    VALUES (v_school_uuid, 'Delhi Public School, Moradabad', 'dps-moradabad', 'Moradabad', 'Uttar Pradesh',
        'CBSE', 'Dr. Rajesh Sharma', '9876543210', 'admin@dps-moradabad.com',
        'growth', 'active', 'medium')
    ON CONFLICT (slug) DO UPDATE SET
        id = v_school_uuid,
        name = 'Delhi Public School, Moradabad',
        subscription_tier = 'growth',
        subscription_status = 'active';

    -- ============================================================
    -- 3. APP USERS (linked to auth users)
    -- ============================================================
    -- Get actual auth UUIDs (may differ if old seed ran first)
    DECLARE
        v_actual_super_admin_auth_id UUID;
        v_actual_school_admin_auth_id UUID;
        v_actual_teacher_auth_id UUID;
    BEGIN
        SELECT id INTO v_actual_super_admin_auth_id FROM auth.users WHERE email = 'admin@relayrasolutions.com' LIMIT 1;
        SELECT id INTO v_actual_school_admin_auth_id FROM auth.users WHERE email = 'admin@dps-moradabad.com' LIMIT 1;
        SELECT id INTO v_actual_teacher_auth_id FROM auth.users WHERE email = 'teacher.7a@dps-moradabad.com' LIMIT 1;

        -- Super Admin user
        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone)
        VALUES (v_super_admin_user_uuid, v_actual_super_admin_auth_id, 'admin@relayrasolutions.com', 'super_admin', NULL, 'Super Admin', '9999999999')
        ON CONFLICT (id) DO UPDATE SET auth_id = v_actual_super_admin_auth_id;

        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone)
        VALUES (v_super_admin_user_uuid, v_actual_super_admin_auth_id, 'admin@relayrasolutions.com', 'super_admin', NULL, 'Super Admin', '9999999999')
        ON CONFLICT (email) DO UPDATE SET auth_id = v_actual_super_admin_auth_id, id = v_super_admin_user_uuid;

        -- School Admin user
        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone)
        VALUES (v_school_admin_user_uuid, v_actual_school_admin_auth_id, 'admin@dps-moradabad.com', 'school_admin', v_school_uuid, 'Dr. Rajesh Sharma', '9876543210')
        ON CONFLICT (id) DO UPDATE SET auth_id = v_actual_school_admin_auth_id, school_id = v_school_uuid;

        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone)
        VALUES (v_school_admin_user_uuid, v_actual_school_admin_auth_id, 'admin@dps-moradabad.com', 'school_admin', v_school_uuid, 'Dr. Rajesh Sharma', '9876543210')
        ON CONFLICT (email) DO UPDATE SET auth_id = v_actual_school_admin_auth_id, id = v_school_admin_user_uuid, school_id = v_school_uuid;

        -- Teacher user (school_staff)
        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone, assigned_class, assigned_section)
        VALUES (v_teacher_user_uuid, v_actual_teacher_auth_id, 'teacher.7a@dps-moradabad.com', 'school_staff', v_school_uuid, 'Sunita Sharma', '9876543211', '7', 'A')
        ON CONFLICT (id) DO UPDATE SET auth_id = v_actual_teacher_auth_id, school_id = v_school_uuid;

        INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone, assigned_class, assigned_section)
        VALUES (v_teacher_user_uuid, v_actual_teacher_auth_id, 'teacher.7a@dps-moradabad.com', 'school_staff', v_school_uuid, 'Sunita Sharma', '9876543211', '7', 'A')
        ON CONFLICT (email) DO UPDATE SET auth_id = v_actual_teacher_auth_id, id = v_teacher_user_uuid, school_id = v_school_uuid;
    END;

    -- ============================================================
    -- 4. STUDENTS (50 students across classes 1-10, sections A & B)
    -- ============================================================
    INSERT INTO public.students (id, school_id, name, class, section, roll_number, admission_number, date_of_birth, gender, parent_name, parent_phone, secondary_phone, bus_route, status)
    VALUES
        -- Class 1
        (s1,  v_school_uuid, 'Aarav Sharma',       '1', 'A', '01', 'ADM001', '2018-03-15', 'Male',   'Ramesh Sharma',    '9812345601', '9812345701', 'Route 1', 'active'),
        (s2,  v_school_uuid, 'Priya Singh',         '1', 'A', '02', 'ADM002', '2018-07-22', 'Female', 'Suresh Singh',     '9812345602', NULL,         'Route 2', 'active'),
        (s3,  v_school_uuid, 'Mohammed Aryan',      '1', 'B', '01', 'ADM003', '2018-01-10', 'Male',   'Imran Khan',       '9812345603', '9812345703', 'Route 1', 'active'),
        (s4,  v_school_uuid, 'Simran Kaur',         '1', 'B', '02', 'ADM004', '2018-09-05', 'Female', 'Gurpreet Kaur',    '9812345604', NULL,         'Route 3', 'active'),
        (s5,  v_school_uuid, 'Rahul Verma',         '1', 'A', '03', 'ADM005', '2018-11-18', 'Male',   'Anil Verma',       '9812345605', '9812345705', 'Route 2', 'active'),
        -- Class 2
        (s6,  v_school_uuid, 'Ananya Gupta',        '2', 'A', '01', 'ADM006', '2017-04-25', 'Female', 'Vijay Gupta',      '9812345606', NULL,         NULL,      'active'),
        (s7,  v_school_uuid, 'Zaid Khan',           '2', 'A', '02', 'ADM007', '2017-08-12', 'Male',   'Salim Khan',       '9812345607', '9812345707', 'Route 1', 'active'),
        (s8,  v_school_uuid, 'Ishita Patel',        '2', 'B', '01', 'ADM008', '2017-06-30', 'Female', 'Dinesh Patel',     '9812345608', NULL,         'Route 3', 'active'),
        (s9,  v_school_uuid, 'Rohan Joshi',         '2', 'B', '02', 'ADM009', '2017-02-14', 'Male',   'Mahesh Joshi',     '9812345609', '9812345709', 'Route 2', 'active'),
        (s10, v_school_uuid, 'Fatima Siddiqui',     '2', 'A', '03', 'ADM010', '2017-12-08', 'Female', 'Ahmed Siddiqui',   '9812345610', NULL,         NULL,      'active'),
        -- Class 3
        (s11, v_school_uuid, 'Arjun Mishra',        '3', 'A', '01', 'ADM011', '2016-05-20', 'Male',   'Rakesh Mishra',    '9812345611', '9812345711', 'Route 1', 'active'),
        (s12, v_school_uuid, 'Kavya Reddy',         '3', 'A', '02', 'ADM012', '2016-10-03', 'Female', 'Suresh Reddy',     '9812345612', NULL,         'Route 2', 'active'),
        (s13, v_school_uuid, 'Aditya Kumar',        '3', 'B', '01', 'ADM013', '2016-07-17', 'Male',   'Rajesh Kumar',     '9812345613', '9812345713', 'Route 3', 'active'),
        (s14, v_school_uuid, 'Neha Yadav',          '3', 'B', '02', 'ADM014', '2016-03-28', 'Female', 'Ramesh Yadav',     '9812345614', NULL,         NULL,      'active'),
        (s15, v_school_uuid, 'Vikram Tiwari',       '3', 'A', '03', 'ADM015', '2016-09-11', 'Male',   'Shyam Tiwari',     '9812345615', '9812345715', 'Route 1', 'active'),
        -- Class 4
        (s16, v_school_uuid, 'Pooja Sharma',        '4', 'A', '01', 'ADM016', '2015-01-24', 'Female', 'Mohan Sharma',     '9812345616', NULL,         'Route 2', 'active'),
        (s17, v_school_uuid, 'Harsh Agarwal',       '4', 'A', '02', 'ADM017', '2015-06-06', 'Male',   'Sunil Agarwal',    '9812345617', '9812345717', NULL,      'active'),
        (s18, v_school_uuid, 'Divya Pandey',        '4', 'B', '01', 'ADM018', '2015-11-19', 'Female', 'Ashok Pandey',     '9812345618', NULL,         'Route 3', 'active'),
        (s19, v_school_uuid, 'Siddharth Saxena',    '4', 'B', '02', 'ADM019', '2015-04-02', 'Male',   'Vinod Saxena',     '9812345619', '9812345719', 'Route 1', 'active'),
        (s20, v_school_uuid, 'Riya Chaudhary',      '4', 'A', '03', 'ADM020', '2015-08-15', 'Female', 'Deepak Chaudhary', '9812345620', NULL,         'Route 2', 'active'),
        -- Class 5
        (s21, v_school_uuid, 'Karan Malhotra',      '5', 'A', '01', 'ADM021', '2014-12-27', 'Male',   'Pankaj Malhotra',  '9812345621', '9812345721', NULL,      'active'),
        (s22, v_school_uuid, 'Sneha Dubey',         '5', 'A', '02', 'ADM022', '2014-02-09', 'Female', 'Ravi Dubey',       '9812345622', NULL,         'Route 3', 'active'),
        (s23, v_school_uuid, 'Amit Tripathi',       '5', 'B', '01', 'ADM023', '2014-07-14', 'Male',   'Suresh Tripathi',  '9812345623', '9812345723', 'Route 1', 'active'),
        (s24, v_school_uuid, 'Shreya Srivastava',   '5', 'B', '02', 'ADM024', '2014-03-21', 'Female', 'Arun Srivastava',  '9812345624', NULL,         'Route 2', 'active'),
        (s25, v_school_uuid, 'Dev Chauhan',         '5', 'A', '03', 'ADM025', '2014-10-08', 'Male',   'Manoj Chauhan',    '9812345625', '9812345725', NULL,      'active'),
        -- Class 6
        (s26, v_school_uuid, 'Tanvi Bajaj',         '6', 'A', '01', 'ADM026', '2013-05-16', 'Female', 'Sanjay Bajaj',     '9812345626', NULL,         'Route 3', 'active'),
        (s27, v_school_uuid, 'Yash Kapoor',         '6', 'A', '02', 'ADM027', '2013-01-29', 'Male',   'Rohit Kapoor',     '9812345627', '9812345727', 'Route 1', 'active'),
        (s28, v_school_uuid, 'Nisha Bose',          '6', 'B', '01', 'ADM028', '2013-09-03', 'Female', 'Subhash Bose',     '9812345628', NULL,         'Route 2', 'active'),
        (s29, v_school_uuid, 'Akash Nair',          '6', 'B', '02', 'ADM029', '2013-06-11', 'Male',   'Rajan Nair',       '9812345629', '9812345729', NULL,      'active'),
        (s30, v_school_uuid, 'Meera Iyer',          '6', 'A', '03', 'ADM030', '2013-11-25', 'Female', 'Krishnan Iyer',    '9812345630', NULL,         'Route 3', 'active'),
        -- Class 7
        (s31, v_school_uuid, 'Rajat Bhatt',         '7', 'A', '01', 'ADM031', '2012-03-07', 'Male',   'Suresh Bhatt',     '9812345631', '9812345731', 'Route 1', 'active'),
        (s32, v_school_uuid, 'Anjali Mehta',        '7', 'A', '02', 'ADM032', '2012-08-19', 'Female', 'Dinesh Mehta',     '9812345632', NULL,         'Route 2', 'active'),
        (s33, v_school_uuid, 'Faisal Ahmed',        '7', 'B', '01', 'ADM033', '2012-05-23', 'Male',   'Rashid Ahmed',     '9812345633', '9812345733', NULL,      'active'),
        (s34, v_school_uuid, 'Pallavi Shukla',      '7', 'B', '02', 'ADM034', '2012-11-14', 'Female', 'Anil Shukla',      '9812345634', NULL,         'Route 3', 'active'),
        (s35, v_school_uuid, 'Nikhil Bansal',       '7', 'A', '03', 'ADM035', '2012-01-30', 'Male',   'Vikas Bansal',     '9812345635', '9812345735', 'Route 1', 'active'),
        -- Class 8
        (s36, v_school_uuid, 'Swati Dixit',         '8', 'A', '01', 'ADM036', '2011-07-08', 'Female', 'Ramesh Dixit',     '9812345636', NULL,         'Route 2', 'active'),
        (s37, v_school_uuid, 'Gaurav Soni',         '8', 'A', '02', 'ADM037', '2011-04-16', 'Male',   'Mahesh Soni',      '9812345637', '9812345737', NULL,      'active'),
        (s38, v_school_uuid, 'Ritu Chandra',        '8', 'B', '01', 'ADM038', '2011-09-27', 'Female', 'Vijay Chandra',    '9812345638', NULL,         'Route 3', 'active'),
        (s39, v_school_uuid, 'Manish Rawat',        '8', 'B', '02', 'ADM039', '2011-02-05', 'Male',   'Suresh Rawat',     '9812345639', '9812345739', 'Route 1', 'active'),
        (s40, v_school_uuid, 'Deepika Jain',        '8', 'A', '03', 'ADM040', '2011-12-18', 'Female', 'Rakesh Jain',      '9812345640', NULL,         'Route 2', 'active'),
        -- Class 9
        (s41, v_school_uuid, 'Rohit Srivastava',    '9', 'A', '01', 'ADM041', '2010-06-22', 'Male',   'Arun Srivastava',  '9812345641', '9812345741', NULL,      'active'),
        (s42, v_school_uuid, 'Sunita Yadav',        '9', 'A', '02', 'ADM042', '2010-10-11', 'Female', 'Ramesh Yadav',     '9812345642', NULL,         'Route 3', 'active'),
        (s43, v_school_uuid, 'Tarun Pandey',        '9', 'B', '01', 'ADM043', '2010-03-29', 'Male',   'Ashok Pandey',     '9812345643', '9812345743', 'Route 1', 'active'),
        (s44, v_school_uuid, 'Monika Gupta',        '9', 'B', '02', 'ADM044', '2010-08-04', 'Female', 'Suresh Gupta',     '9812345644', NULL,         'Route 2', 'active'),
        (s45, v_school_uuid, 'Vivek Sharma',        '9', 'A', '03', 'ADM045', '2010-01-17', 'Male',   'Rajesh Sharma',    '9812345645', '9812345745', NULL,      'active'),
        -- Class 10
        (s46, v_school_uuid, 'Priyanka Singh',      '10', 'A', '01', 'ADM046', '2009-05-13', 'Female', 'Suresh Singh',    '9812345646', NULL,         'Route 3', 'active'),
        (s47, v_school_uuid, 'Abhishek Verma',      '10', 'A', '02', 'ADM047', '2009-09-26', 'Male',   'Anil Verma',      '9812345647', '9812345747', 'Route 1', 'active'),
        (s48, v_school_uuid, 'Shweta Mishra',       '10', 'B', '01', 'ADM048', '2009-07-01', 'Female', 'Rakesh Mishra',   '9812345648', NULL,         'Route 2', 'active'),
        (s49, v_school_uuid, 'Piyush Tiwari',       '10', 'B', '02', 'ADM049', '2009-11-20', 'Male',   'Shyam Tiwari',    '9812345649', '9812345749', NULL,      'active'),
        (s50, v_school_uuid, 'Nandini Agarwal',     '10', 'A', '03', 'ADM050', '2009-04-08', 'Female', 'Sunil Agarwal',   '9812345650', NULL,         'Route 3', 'active')
    ON CONFLICT (id) DO NOTHING;

    student_ids := ARRAY[s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,
                         s11,s12,s13,s14,s15,s16,s17,s18,s19,s20,
                         s21,s22,s23,s24,s25,s26,s27,s28,s29,s30,
                         s31,s32,s33,s34,s35,s36,s37,s38,s39,s40,
                         s41,s42,s43,s44,s45,s46,s47,s48,s49,s50];

    -- ============================================================
    -- 5. FEE RECORDS (100+ records: tuition Q1 + Q2 + transport for 30)
    -- ============================================================
    FOR i IN 1..50 LOOP
        -- Tuition fee Q1 (previous quarter)
        fee_id := ('e1f2a3b4-' || LPAD(i::TEXT, 4, '0') || '-0001-0001-' || LPAD(i::TEXT, 12, '0'))::UUID;
        fee_amount := 500000;
        rand_val := (i * 7919 % 100)::FLOAT / 100.0; -- deterministic pseudo-random
        IF rand_val < 0.40 THEN
            fee_status := 'paid';
            fee_paid_amount := fee_amount;
            fee_payment_date := (today - INTERVAL '60 days')::TIMESTAMPTZ;
        ELSIF rand_val < 0.75 THEN
            fee_status := 'pending';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        ELSE
            fee_status := 'overdue';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        END IF;
        fee_due := DATE_TRUNC('month', today - INTERVAL '3 months')::DATE + 1;
        INSERT INTO public.fee_records (id, school_id, student_id, fee_type, total_amount, paid_amount, due_date, status, payment_date, payment_method, receipt_number, escalation_level, created_by)
        VALUES (fee_id, v_school_uuid, student_ids[i], 'tuition', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status = 'paid' THEN 'upi' ELSE NULL END,
            CASE WHEN fee_status = 'paid' THEN 'RLY-DPS-' || TO_CHAR(today - INTERVAL '60 days', 'YYYYMMDD') || '-' || LPAD(i::TEXT, 4, '0') ELSE NULL END,
            CASE WHEN fee_status = 'overdue' THEN ((i * 3) % 5) ELSE 0 END,
            v_school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;

        -- Tuition fee current quarter
        fee_id := ('e1f2a3b4-' || LPAD(i::TEXT, 4, '0') || '-0002-0002-' || LPAD(i::TEXT, 12, '0'))::UUID;
        rand_val := (i * 6271 % 100)::FLOAT / 100.0;
        IF rand_val < 0.35 THEN
            fee_status := 'paid';
            fee_paid_amount := fee_amount;
            fee_payment_date := (today - INTERVAL '10 days')::TIMESTAMPTZ;
        ELSIF rand_val < 0.70 THEN
            fee_status := 'pending';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        ELSE
            fee_status := 'partial';
            fee_paid_amount := 250000;
            fee_payment_date := (today - INTERVAL '5 days')::TIMESTAMPTZ;
        END IF;
        fee_due := DATE_TRUNC('month', today)::DATE + 1;
        INSERT INTO public.fee_records (id, school_id, student_id, fee_type, total_amount, paid_amount, due_date, status, payment_date, payment_method, receipt_number, created_by)
        VALUES (fee_id, v_school_uuid, student_ids[i], 'tuition', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status IN ('paid', 'partial') THEN 'cash' ELSE NULL END,
            CASE WHEN fee_status IN ('paid', 'partial') THEN 'RLY-DPS-' || TO_CHAR(today - INTERVAL '10 days', 'YYYYMMDD') || '-' || LPAD((i + 100)::TEXT, 4, '0') ELSE NULL END,
            v_school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Transport fees for first 30 students
    FOR i IN 1..30 LOOP
        fee_id := ('e1f2a3b4-' || LPAD(i::TEXT, 4, '0') || '-0003-0003-' || LPAD(i::TEXT, 12, '0'))::UUID;
        fee_amount := 200000;
        rand_val := (i * 5381 % 100)::FLOAT / 100.0;
        IF rand_val < 0.50 THEN
            fee_status := 'paid';
            fee_paid_amount := fee_amount;
            fee_payment_date := (today - INTERVAL '15 days')::TIMESTAMPTZ;
        ELSIF rand_val < 0.80 THEN
            fee_status := 'pending';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        ELSE
            fee_status := 'overdue';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        END IF;
        fee_due := DATE_TRUNC('month', today)::DATE + 1;
        INSERT INTO public.fee_records (id, school_id, student_id, fee_type, total_amount, paid_amount, due_date, status, payment_date, payment_method, created_by)
        VALUES (fee_id, v_school_uuid, student_ids[i], 'transport', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status = 'paid' THEN 'netbanking' ELSE NULL END,
            v_school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Exam fees for Class 9 and 10 students (s41-s50)
    FOR i IN 41..50 LOOP
        fee_id := ('e1f2a3b4-' || LPAD(i::TEXT, 4, '0') || '-0004-0004-' || LPAD(i::TEXT, 12, '0'))::UUID;
        fee_amount := 50000; -- Rs 500
        rand_val := (i * 4973 % 100)::FLOAT / 100.0;
        IF rand_val < 0.60 THEN
            fee_status := 'paid';
            fee_paid_amount := fee_amount;
            fee_payment_date := (today - INTERVAL '20 days')::TIMESTAMPTZ;
        ELSE
            fee_status := 'pending';
            fee_paid_amount := 0;
            fee_payment_date := NULL;
        END IF;
        fee_due := today + 15;
        INSERT INTO public.fee_records (id, school_id, student_id, fee_type, total_amount, paid_amount, due_date, status, payment_date, payment_method, created_by)
        VALUES (fee_id, v_school_uuid, student_ids[i], 'exam', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status = 'paid' THEN 'cash' ELSE NULL END,
            v_school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- ============================================================
    -- 6. ATTENDANCE (30 days for all 50 students)
    -- ============================================================
    FOR i IN 1..50 LOOP
        FOR j IN 0..29 LOOP
            att_date := today - j;
            IF EXTRACT(DOW FROM att_date) NOT IN (0, 6) THEN
                rand_val := ((i * 7 + j * 13) * 9973 % 100)::FLOAT / 100.0;
                IF i <= 45 THEN
                    -- 88-94% present rate
                    IF rand_val < 0.91 THEN att_status := 'present';
                    ELSIF rand_val < 0.95 THEN att_status := 'absent';
                    ELSIF rand_val < 0.98 THEN att_status := 'late';
                    ELSE att_status := 'half_day';
                    END IF;
                ELSE
                    -- Students 46-50: more absences (problem students)
                    IF rand_val < 0.68 THEN att_status := 'present';
                    ELSIF rand_val < 0.88 THEN att_status := 'absent';
                    ELSE att_status := 'late';
                    END IF;
                END IF;
                INSERT INTO public.attendance (id, school_id, student_id, date, status, marked_by, marked_via)
                VALUES (gen_random_uuid(), v_school_uuid, student_ids[i], att_date, att_status, v_school_admin_user_uuid, 'dashboard')
                ON CONFLICT (student_id, date) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    -- ============================================================
    -- 7. MESSAGES (15 messages)
    -- ============================================================
    INSERT INTO public.messages (id, school_id, type, title, body, target_type, recipient_count, sent_count, delivered_count, status, sent_at, created_by)
    VALUES
        ('f1a2b3c4-0001-0001-0001-000000000001'::UUID, v_school_uuid, 'notice', 'Annual Sports Day', 'Dear Parents, We are pleased to announce our Annual Sports Day on 15th April 2026. All students must report by 8:00 AM in sports uniform. Kindly ensure your ward participates enthusiastically. — DPS Moradabad Administration', 'all', 50, 50, 48, 'sent', now() - INTERVAL '5 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0002-0002-0002-000000000002'::UUID, v_school_uuid, 'fee_reminder', 'Q1 Fee Reminder', 'Dear Parent, This is a gentle reminder that the tuition fee for Q1 2026 is due. Kindly clear the dues at the earliest to avoid late charges. For queries, contact the school office. — DPS Moradabad', 'all', 50, 50, 45, 'sent', now() - INTERVAL '10 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0003-0003-0003-000000000003'::UUID, v_school_uuid, 'holiday', 'Holi Holiday Notice', 'Dear Parents, The school will remain closed on 14th March 2026 on account of Holi. Classes will resume on 15th March 2026. Wishing everyone a colorful and joyful Holi! — DPS Moradabad Administration', 'all', 50, 50, 50, 'sent', now() - INTERVAL '20 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0004-0004-0004-000000000004'::UUID, v_school_uuid, 'circular', 'PTM Schedule', 'Dear Parent, Parent-Teacher Meeting is scheduled for 20th April 2026 from 9:00 AM to 1:00 PM. Your presence is requested to discuss your ward''s academic progress. Please confirm your attendance. — DPS Moradabad', 'all', 50, 50, 47, 'sent', now() - INTERVAL '3 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0005-0005-0005-000000000005'::UUID, v_school_uuid, 'custom', 'Exam Timetable Released', 'Dear Parents, The Half-Yearly Examination timetable has been released. Please check the school website or contact the class teacher for details. Ensure your ward prepares well. Best wishes! — DPS Moradabad', 'all', 50, 49, 46, 'sent', now() - INTERVAL '7 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0006-0006-0006-000000000006'::UUID, v_school_uuid, 'fee_reminder', 'Transport Fee Overdue', 'Dear Parent, Your ward''s transport fee for March 2026 is overdue. Kindly pay immediately to avoid suspension of bus service. — DPS Moradabad Accounts', 'all', 30, 30, 28, 'sent', now() - INTERVAL '2 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0007-0007-0007-000000000007'::UUID, v_school_uuid, 'notice', 'Science Exhibition', 'Dear Parents, We are organizing an Inter-School Science Exhibition on 25th April 2026. Students from Classes 6-10 are encouraged to participate. Registration forms available at the school office. — DPS Moradabad', 'class', '6', 25, 25, 23, 'sent', now() - INTERVAL '8 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0008-0008-0008-000000000008'::UUID, v_school_uuid, 'emergency', 'School Closed Tomorrow', 'URGENT: Dear Parents, Due to heavy rainfall forecast, DPS Moradabad will remain CLOSED tomorrow 05/04/2026. Online classes will be conducted as per schedule. Stay safe. — DPS Moradabad Administration', 'all', 50, 50, 50, 'sent', now() - INTERVAL '1 day', v_school_admin_user_uuid),
        ('f1a2b3c4-0009-0009-0009-000000000009'::UUID, v_school_uuid, 'circular', 'New Academic Year Books', 'Dear Parents, The booklist for Academic Year 2026-27 is now available. Please collect from the school office between 8 AM and 2 PM on working days. — DPS Moradabad', 'all', 50, 50, 44, 'sent', now() - INTERVAL '15 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0010-0010-0010-000000000010'::UUID, v_school_uuid, 'notice', 'Republic Day Celebration', 'Dear Parents, You are cordially invited to the Republic Day celebration at DPS Moradabad on 26th January 2026 at 8:00 AM. Kindly be present with your ward. — Principal, DPS Moradabad', 'all', 50, 50, 49, 'sent', now() - INTERVAL '25 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0011-0011-0011-000000000011'::UUID, v_school_uuid, 'fee_reminder', 'Final Fee Reminder', 'Dear Parent, This is the FINAL reminder for pending tuition fee. Non-payment by 10th April 2026 will result in name removal from rolls. Please clear dues immediately. — DPS Moradabad Accounts', 'all', 15, 15, 14, 'sent', now() - INTERVAL '4 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0012-0012-0012-000000000012'::UUID, v_school_uuid, 'circular', 'Summer Uniform Change', 'Dear Parents, From 1st April 2026, students should wear summer uniform. Please ensure your ward comes in proper summer uniform. — DPS Moradabad Administration', 'all', 50, 50, 47, 'sent', now() - INTERVAL '6 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0013-0013-0013-000000000013'::UUID, v_school_uuid, 'notice', 'Board Exam Preparation', 'Dear Parents of Class 10, Special doubt-clearing sessions will be held every Saturday from 9 AM to 12 PM till board exams. Attendance is compulsory. — DPS Moradabad', 'class', '10', 10, 10, 10, 'sent', now() - INTERVAL '12 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0014-0014-0014-000000000014'::UUID, v_school_uuid, 'custom', 'Congratulations - Olympiad Results', 'Dear Parents, We are proud to announce that 5 students from DPS Moradabad have qualified for the National Science Olympiad. Heartiest congratulations to all participants! — Principal, DPS Moradabad', 'all', 50, 50, 48, 'sent', now() - INTERVAL '18 days', v_school_admin_user_uuid),
        ('f1a2b3c4-0015-0015-0015-000000000015'::UUID, v_school_uuid, 'notice', 'Yoga Day Event', 'Dear Parents, DPS Moradabad will celebrate International Yoga Day on 21st June 2026. All students must participate. Yoga mats will be provided by the school. — DPS Moradabad', 'all', 50, 0, 0, 'draft', NULL, v_school_admin_user_uuid)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- 8. ACADEMIC CALENDAR (10 events)
    -- ============================================================
    INSERT INTO public.academic_calendar (id, school_id, title, description, event_type, start_date, end_date, color, is_all_day, created_by)
    VALUES
        ('a1b2c3d4-e001-e001-e001-000000000001'::UUID, v_school_uuid, 'Annual Sports Day', 'Inter-house sports competition for all classes', 'event', today + 12, today + 12, '#F59E0B', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e002-e002-e002-000000000002'::UUID, v_school_uuid, 'Parent-Teacher Meeting', 'Half-yearly PTM for all classes', 'ptm', today + 17, today + 17, '#8B5CF6', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e003-e003-e003-000000000003'::UUID, v_school_uuid, 'Half-Yearly Examinations', 'Half-yearly exams for Classes 1-10', 'exam', today + 30, today + 45, '#EF4444', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e004-e004-e004-000000000004'::UUID, v_school_uuid, 'Summer Vacation', 'School closed for summer vacation', 'holiday', today + 60, today + 90, '#10B981', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e005-e005-e005-000000000005'::UUID, v_school_uuid, 'Science Exhibition', 'Inter-school science exhibition', 'event', today + 22, today + 22, '#0D9488', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e006-e006-e006-000000000006'::UUID, v_school_uuid, 'Result Day - Half Yearly', 'Distribution of half-yearly result cards', 'result_day', today + 50, today + 50, '#1E3A5F', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e007-e007-e007-000000000007'::UUID, v_school_uuid, 'Eid Holiday', 'School closed on account of Eid', 'holiday', today + 5, today + 5, '#10B981', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e008-e008-e008-000000000008'::UUID, v_school_uuid, 'Annual Day Celebration', 'Annual cultural and prize distribution ceremony', 'event', today + 75, today + 75, '#F59E0B', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e009-e009-e009-000000000009'::UUID, v_school_uuid, 'Board Exam - Class 10', 'CBSE Board Examinations for Class 10', 'exam', today + 35, today + 55, '#EF4444', true, v_school_admin_user_uuid),
        ('a1b2c3d4-e010-e010-e010-000000000010'::UUID, v_school_uuid, 'Teacher Training Day', 'Professional development day for teachers', 'custom', today + 8, today + 8, '#6B7280', true, v_school_admin_user_uuid)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- 9. ACTIVITY LOG (30+ entries)
    -- ============================================================
    INSERT INTO public.activity_log (id, school_id, user_id, action, description, entity_type, created_at)
    VALUES
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'student_added', 'Added 50 students for Academic Year 2026-27', 'student', now() - INTERVAL '30 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'fee_created', 'Created tuition fee for all 50 students - Q1 2026', 'fee', now() - INTERVAL '29 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Ramesh Sharma for Aarav Sharma - Rs. 5,000', 'fee', now() - INTERVAL '28 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Republic Day celebration notice sent to all 50 parents', 'message', now() - INTERVAL '27 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 1A - 5 present', 'attendance', now() - INTERVAL '26 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Suresh Singh for Priya Singh - Rs. 5,000', 'fee', now() - INTERVAL '25 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Olympiad results congratulations message sent', 'message', now() - INTERVAL '24 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 7A - 3 present, 0 absent', 'attendance', now() - INTERVAL '23 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'fee_created', 'Created transport fee for 30 students', 'fee', now() - INTERVAL '22 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Imran Khan for Mohammed Aryan - Rs. 2,000', 'fee', now() - INTERVAL '21 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'New academic year books circular sent to all parents', 'message', now() - INTERVAL '20 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 10A - 5 present', 'attendance', now() - INTERVAL '19 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'fee_created', 'Created exam fee for Class 9 and 10 students', 'fee', now() - INTERVAL '18 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Holi holiday notice sent to all parents', 'message', now() - INTERVAL '17 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Vijay Gupta for Ananya Gupta - Rs. 5,000', 'fee', now() - INTERVAL '16 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 5B - 5 present', 'attendance', now() - INTERVAL '15 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Science exhibition notice sent to Class 6 parents', 'message', now() - INTERVAL '14 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Salim Khan for Zaid Khan - Rs. 2,000', 'fee', now() - INTERVAL '13 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 8B - 5 present', 'attendance', now() - INTERVAL '12 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Board exam preparation notice sent to Class 10 parents', 'message', now() - INTERVAL '11 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Dinesh Patel for Ishita Patel - Rs. 5,000', 'fee', now() - INTERVAL '10 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 9A - 5 present', 'attendance', now() - INTERVAL '9 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Exam timetable released notice sent to all parents', 'message', now() - INTERVAL '8 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'fee_created', 'Created Q2 tuition fee for all 50 students', 'fee', now() - INTERVAL '7 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Annual Sports Day notice sent to all 50 parents', 'message', now() - INTERVAL '6 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Mahesh Joshi for Rohan Joshi - Rs. 5,000', 'fee', now() - INTERVAL '5 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Summer uniform change circular sent to all parents', 'message', now() - INTERVAL '4 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 6A - 5 present', 'attendance', now() - INTERVAL '3 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Final fee reminder sent to 15 parents with overdue fees', 'message', now() - INTERVAL '2 days'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'message_sent', 'Emergency school closure notice sent to all 50 parents', 'message', now() - INTERVAL '1 day'),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'attendance_marked', 'Attendance marked for all classes today', 'attendance', now()),
        (gen_random_uuid(), v_school_uuid, v_school_admin_user_uuid, 'payment_received', 'Payment received from Ahmed Siddiqui for Fatima Siddiqui - Rs. 5,000', 'fee', now())
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- 10. PARENT QUERIES
    -- ============================================================
    INSERT INTO public.parent_queries (id, school_id, student_id, parent_phone, parent_name, query_text, response_text, responded_by, status, resolved_at)
    VALUES
        ('b1c2d3e4-q001-q001-q001-000000000001'::UUID, v_school_uuid, s1, '9812345601', 'Ramesh Sharma', 'When is the next PTM scheduled?', 'The PTM is scheduled for 20th April 2026 from 9 AM to 1 PM.', 'school_admin', 'resolved', now() - INTERVAL '2 days'),
        ('b1c2d3e4-q002-q002-q002-000000000002'::UUID, v_school_uuid, s5, '9812345605', 'Anil Verma', 'My son was absent for 3 days due to fever. Will it affect his attendance?', 'We understand. Please submit a medical certificate and we will mark it as medical leave.', 'school_admin', 'resolved', now() - INTERVAL '5 days'),
        ('b1c2d3e4-q003-q003-q003-000000000003'::UUID, v_school_uuid, s10, '9812345610', 'Ahmed Siddiqui', 'What is the fee for the upcoming exam?', 'The exam fee of Rs. 500 will be collected in the next fee cycle.', 'ai_auto', 'auto_resolved', now() - INTERVAL '1 day'),
        ('b1c2d3e4-q004-q004-q004-000000000004'::UUID, v_school_uuid, s15, '9812345615', 'Shyam Tiwari', 'Is the school bus available on Saturday for the sports event?', 'Yes, the school bus will be available on Saturday for the sports day event.', 'school_admin', 'resolved', now() - INTERVAL '3 days'),
        ('b1c2d3e4-q005-q005-q005-000000000005'::UUID, v_school_uuid, s20, '9812345620', 'Deepak Chaudhary', 'Can we get a duplicate fee receipt?', 'Yes, please visit the school office with your ID proof to get a duplicate receipt.', 'school_admin', 'resolved', now() - INTERVAL '4 days'),
        ('b1c2d3e4-q006-q006-q006-000000000006'::UUID, v_school_uuid, s3, '9812345603', 'Imran Khan', 'What are the school timings during summer?', NULL, NULL, 'pending', NULL),
        ('b1c2d3e4-q007-q007-q007-000000000007'::UUID, v_school_uuid, s8, '9812345608', 'Dinesh Patel', 'My daughter needs a transfer certificate. What is the process?', NULL, NULL, 'pending', NULL),
        ('b1c2d3e4-q008-q008-q008-000000000008'::UUID, v_school_uuid, s25, '9812345625', 'Manoj Chauhan', 'Is there any scholarship available for meritorious students?', NULL, NULL, 'pending', NULL)
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
