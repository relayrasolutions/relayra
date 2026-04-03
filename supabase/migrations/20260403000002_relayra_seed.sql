-- ============================================================
-- RELAYRA SOLUTIONS - Seed Data
-- ============================================================

DO $$
DECLARE
    super_admin_uuid UUID := gen_random_uuid();
    school_admin_uuid UUID := gen_random_uuid();
    school_uuid UUID := gen_random_uuid();
    super_admin_user_uuid UUID := gen_random_uuid();
    school_admin_user_uuid UUID := gen_random_uuid();

    -- Student UUIDs
    s1 UUID := gen_random_uuid(); s2 UUID := gen_random_uuid(); s3 UUID := gen_random_uuid();
    s4 UUID := gen_random_uuid(); s5 UUID := gen_random_uuid(); s6 UUID := gen_random_uuid();
    s7 UUID := gen_random_uuid(); s8 UUID := gen_random_uuid(); s9 UUID := gen_random_uuid();
    s10 UUID := gen_random_uuid(); s11 UUID := gen_random_uuid(); s12 UUID := gen_random_uuid();
    s13 UUID := gen_random_uuid(); s14 UUID := gen_random_uuid(); s15 UUID := gen_random_uuid();
    s16 UUID := gen_random_uuid(); s17 UUID := gen_random_uuid(); s18 UUID := gen_random_uuid();
    s19 UUID := gen_random_uuid(); s20 UUID := gen_random_uuid();
    s21 UUID := gen_random_uuid(); s22 UUID := gen_random_uuid(); s23 UUID := gen_random_uuid();
    s24 UUID := gen_random_uuid(); s25 UUID := gen_random_uuid(); s26 UUID := gen_random_uuid();
    s27 UUID := gen_random_uuid(); s28 UUID := gen_random_uuid(); s29 UUID := gen_random_uuid();
    s30 UUID := gen_random_uuid();

    msg1 UUID := gen_random_uuid(); msg2 UUID := gen_random_uuid(); msg3 UUID := gen_random_uuid();
    msg4 UUID := gen_random_uuid(); msg5 UUID := gen_random_uuid();

    today DATE := CURRENT_DATE;
    i INTEGER;
    att_date DATE;
    att_status TEXT;
    rand_val FLOAT;
    student_ids UUID[];
    fee_id UUID;
    fee_amount INTEGER;
    fee_status TEXT;
    fee_due DATE;
    fee_paid_amount INTEGER;
    fee_payment_date TIMESTAMPTZ;

BEGIN
    -- ============================================================
    -- AUTH USERS
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
        (super_admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@relayrasolutions.com', crypt('Relayra@2026', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('name', 'Super Admin', 'role', 'super_admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (school_admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@dps-moradabad.com', crypt('Demo@1234', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('name', 'Dr. Rajesh Sharma', 'role', 'school_admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- SCHOOL
    -- ============================================================
    INSERT INTO public.schools (id, name, slug, city, state, board, principal_name, contact_phone, contact_email,
        subscription_tier, subscription_status, student_slab)
    VALUES (school_uuid, 'Delhi Public School, Moradabad', 'dps-moradabad', 'Moradabad', 'Uttar Pradesh',
        'CBSE', 'Dr. Rajesh Sharma', '9876543210', 'admin@dps-moradabad.com',
        'growth', 'active', 'medium')
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- APP USERS
    -- ============================================================
    INSERT INTO public.users (id, auth_id, email, role, school_id, name, phone)
    VALUES
        (super_admin_user_uuid, super_admin_uuid, 'admin@relayrasolutions.com', 'super_admin', NULL, 'Super Admin', '9999999999'),
        (school_admin_user_uuid, school_admin_uuid, 'admin@dps-moradabad.com', 'school_admin', school_uuid, 'Dr. Rajesh Sharma', '9876543210')
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- STUDENTS (30 students)
    -- ============================================================
    INSERT INTO public.students (id, school_id, name, class, section, roll_number, admission_number, date_of_birth, gender, parent_name, parent_phone, secondary_phone, bus_route, status)
    VALUES
        (s1, school_uuid, 'Aarav Sharma', '5', 'A', '01', 'ADM001', '2014-03-15', 'Male', 'Ramesh Sharma', '9812345601', '9812345701', 'Route 1', 'active'),
        (s2, school_uuid, 'Priya Singh', '5', 'A', '02', 'ADM002', '2014-07-22', 'Female', 'Suresh Singh', '9812345602', NULL, 'Route 2', 'active'),
        (s3, school_uuid, 'Mohammed Aryan', '5', 'B', '01', 'ADM003', '2014-01-10', 'Male', 'Imran Khan', '9812345603', '9812345703', 'Route 1', 'active'),
        (s4, school_uuid, 'Simran Kaur', '6', 'A', '01', 'ADM004', '2013-09-05', 'Female', 'Gurpreet Kaur', '9812345604', NULL, 'Route 3', 'active'),
        (s5, school_uuid, 'Rahul Verma', '6', 'A', '02', 'ADM005', '2013-11-18', 'Male', 'Anil Verma', '9812345605', '9812345705', 'Route 2', 'active'),
        (s6, school_uuid, 'Ananya Gupta', '6', 'B', '01', 'ADM006', '2013-04-25', 'Female', 'Vijay Gupta', '9812345606', NULL, NULL, 'active'),
        (s7, school_uuid, 'Zaid Khan', '7', 'A', '01', 'ADM007', '2012-08-12', 'Male', 'Salim Khan', '9812345607', '9812345707', 'Route 1', 'active'),
        (s8, school_uuid, 'Ishita Patel', '7', 'A', '02', 'ADM008', '2012-06-30', 'Female', 'Dinesh Patel', '9812345608', NULL, 'Route 3', 'active'),
        (s9, school_uuid, 'Rohan Joshi', '7', 'B', '01', 'ADM009', '2012-02-14', 'Male', 'Mahesh Joshi', '9812345609', '9812345709', 'Route 2', 'active'),
        (s10, school_uuid, 'Fatima Siddiqui', '7', 'B', '02', 'ADM010', '2012-12-08', 'Female', 'Ahmed Siddiqui', '9812345610', NULL, NULL, 'active'),
        (s11, school_uuid, 'Arjun Mishra', '8', 'A', '01', 'ADM011', '2011-05-20', 'Male', 'Rakesh Mishra', '9812345611', '9812345711', 'Route 1', 'active'),
        (s12, school_uuid, 'Kavya Reddy', '8', 'A', '02', 'ADM012', '2011-10-03', 'Female', 'Suresh Reddy', '9812345612', NULL, 'Route 2', 'active'),
        (s13, school_uuid, 'Aditya Kumar', '8', 'B', '01', 'ADM013', '2011-07-17', 'Male', 'Rajesh Kumar', '9812345613', '9812345713', 'Route 3', 'active'),
        (s14, school_uuid, 'Neha Yadav', '8', 'B', '02', 'ADM014', '2011-03-28', 'Female', 'Ramesh Yadav', '9812345614', NULL, NULL, 'active'),
        (s15, school_uuid, 'Vikram Tiwari', '9', 'A', '01', 'ADM015', '2010-09-11', 'Male', 'Shyam Tiwari', '9812345615', '9812345715', 'Route 1', 'active'),
        (s16, school_uuid, 'Pooja Sharma', '9', 'A', '02', 'ADM016', '2010-01-24', 'Female', 'Mohan Sharma', '9812345616', NULL, 'Route 2', 'active'),
        (s17, school_uuid, 'Harsh Agarwal', '9', 'B', '01', 'ADM017', '2010-06-06', 'Male', 'Sunil Agarwal', '9812345617', '9812345717', NULL, 'active'),
        (s18, school_uuid, 'Divya Pandey', '9', 'B', '02', 'ADM018', '2010-11-19', 'Female', 'Ashok Pandey', '9812345618', NULL, 'Route 3', 'active'),
        (s19, school_uuid, 'Siddharth Saxena', '10', 'A', '01', 'ADM019', '2009-04-02', 'Male', 'Vinod Saxena', '9812345619', '9812345719', 'Route 1', 'active'),
        (s20, school_uuid, 'Riya Chaudhary', '10', 'A', '02', 'ADM020', '2009-08-15', 'Female', 'Deepak Chaudhary', '9812345620', NULL, 'Route 2', 'active'),
        (s21, school_uuid, 'Karan Malhotra', '10', 'B', '01', 'ADM021', '2009-12-27', 'Male', 'Pankaj Malhotra', '9812345621', '9812345721', NULL, 'active'),
        (s22, school_uuid, 'Sneha Dubey', '10', 'B', '02', 'ADM022', '2009-02-09', 'Female', 'Ravi Dubey', '9812345622', NULL, 'Route 3', 'active'),
        (s23, school_uuid, 'Amit Tripathi', '3', 'A', '01', 'ADM023', '2016-07-14', 'Male', 'Suresh Tripathi', '9812345623', '9812345723', 'Route 1', 'active'),
        (s24, school_uuid, 'Shreya Srivastava', '3', 'A', '02', 'ADM024', '2016-03-21', 'Female', 'Arun Srivastava', '9812345624', NULL, 'Route 2', 'active'),
        (s25, school_uuid, 'Dev Chauhan', '3', 'B', '01', 'ADM025', '2016-10-08', 'Male', 'Manoj Chauhan', '9812345625', '9812345725', NULL, 'active'),
        (s26, school_uuid, 'Tanvi Bajaj', '4', 'A', '01', 'ADM026', '2015-05-16', 'Female', 'Sanjay Bajaj', '9812345626', NULL, 'Route 3', 'active'),
        (s27, school_uuid, 'Yash Kapoor', '4', 'A', '02', 'ADM027', '2015-01-29', 'Male', 'Rohit Kapoor', '9812345627', '9812345727', 'Route 1', 'active'),
        (s28, school_uuid, 'Nisha Bose', '4', 'B', '01', 'ADM028', '2015-09-03', 'Female', 'Subhash Bose', '9812345628', NULL, 'Route 2', 'active'),
        (s29, school_uuid, 'Akash Nair', '2', 'A', '01', 'ADM029', '2017-06-11', 'Male', 'Rajan Nair', '9812345629', '9812345729', NULL, 'active'),
        (s30, school_uuid, 'Meera Iyer', '2', 'A', '02', 'ADM030', '2017-11-25', 'Female', 'Krishnan Iyer', '9812345630', NULL, 'Route 3', 'active')
    ON CONFLICT (id) DO NOTHING;

    student_ids := ARRAY[s1,s2,s3,s4,s5,s6,s7,s8,s9,s10,s11,s12,s13,s14,s15,s16,s17,s18,s19,s20,s21,s22,s23,s24,s25,s26,s27,s28,s29,s30];

    -- ============================================================
    -- FEE RECORDS
    -- ============================================================
    FOR i IN 1..30 LOOP
        -- Tuition fee Q1
        fee_id := gen_random_uuid();
        fee_amount := 500000; -- Rs 5000 in paisa
        rand_val := random();
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
        VALUES (fee_id, school_uuid, student_ids[i], 'tuition', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status = 'paid' THEN 'upi' ELSE NULL END,
            CASE WHEN fee_status = 'paid' THEN 'RLY-DPS-' || TO_CHAR(today - INTERVAL '60 days', 'YYYYMMDD') || '-' || LPAD(i::TEXT, 4, '0') ELSE NULL END,
            CASE WHEN fee_status = 'overdue' THEN (random() * 4)::INTEGER ELSE 0 END,
            school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;

        -- Tuition fee current quarter
        fee_id := gen_random_uuid();
        rand_val := random();
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
        VALUES (fee_id, school_uuid, student_ids[i], 'tuition', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status IN ('paid', 'partial') THEN 'cash' ELSE NULL END,
            CASE WHEN fee_status IN ('paid', 'partial') THEN 'RLY-DPS-' || TO_CHAR(today - INTERVAL '10 days', 'YYYYMMDD') || '-' || LPAD((i + 100)::TEXT, 4, '0') ELSE NULL END,
            school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- Transport fees for first 20 students
    FOR i IN 1..20 LOOP
        fee_id := gen_random_uuid();
        fee_amount := 200000; -- Rs 2000
        rand_val := random();
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
        VALUES (fee_id, school_uuid, student_ids[i], 'transport', fee_amount, fee_paid_amount, fee_due, fee_status, fee_payment_date,
            CASE WHEN fee_status = 'paid' THEN 'netbanking' ELSE NULL END,
            school_admin_user_uuid)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;

    -- ============================================================
    -- ATTENDANCE (last 30 days)
    -- ============================================================
    FOR i IN 1..30 LOOP
        FOR j IN 0..29 LOOP
            att_date := today - j;
            -- Skip weekends
            IF EXTRACT(DOW FROM att_date) NOT IN (0, 6) THEN
                rand_val := random();
                -- Students 1-27: 88-94% present
                IF i <= 27 THEN
                    IF rand_val < 0.91 THEN att_status := 'present';
                    ELSIF rand_val < 0.95 THEN att_status := 'absent';
                    ELSIF rand_val < 0.98 THEN att_status := 'late';
                    ELSE att_status := 'half_day';
                    END IF;
                ELSE
                    -- Students 28-30: more absences
                    IF rand_val < 0.70 THEN att_status := 'present';
                    ELSIF rand_val < 0.90 THEN att_status := 'absent';
                    ELSE att_status := 'late';
                    END IF;
                END IF;
                INSERT INTO public.attendance (id, school_id, student_id, date, status, marked_by, marked_via)
                VALUES (gen_random_uuid(), school_uuid, student_ids[i], att_date, att_status, school_admin_user_uuid, 'dashboard')
                ON CONFLICT (student_id, date) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    -- ============================================================
    -- MESSAGES
    -- ============================================================
    INSERT INTO public.messages (id, school_id, type, title, body, target_type, recipient_count, sent_count, delivered_count, status, sent_at, created_by)
    VALUES
        (msg1, school_uuid, 'notice', 'Annual Sports Day', 'Dear Parents, We are pleased to announce our Annual Sports Day on 15th April 2026. All students must report by 8:00 AM in sports uniform. Kindly ensure your ward participates enthusiastically. — DPS Moradabad Administration', 'all', 30, 30, 28, 'sent', now() - INTERVAL '5 days', school_admin_user_uuid),
        (msg2, school_uuid, 'fee_reminder', 'Q1 Fee Reminder', 'Dear Parent, This is a gentle reminder that the tuition fee for Q1 2026 is due. Kindly clear the dues at the earliest to avoid late charges. For queries, contact the school office. — DPS Moradabad', 'all', 30, 30, 25, 'sent', now() - INTERVAL '10 days', school_admin_user_uuid),
        (msg3, school_uuid, 'holiday', 'Holi Holiday Notice', 'Dear Parents, The school will remain closed on 14th March 2026 on account of Holi. Classes will resume on 15th March 2026. Wishing everyone a colorful and joyful Holi! — DPS Moradabad Administration', 'all', 30, 30, 30, 'sent', now() - INTERVAL '20 days', school_admin_user_uuid),
        (msg4, school_uuid, 'circular', 'PTM Schedule', 'Dear Parent, Parent-Teacher Meeting is scheduled for 20th April 2026 from 9:00 AM to 1:00 PM. Your presence is requested to discuss your ward''s academic progress. Please confirm your attendance. — DPS Moradabad', 'all', 30, 30, 27, 'sent', now() - INTERVAL '3 days', school_admin_user_uuid),
        (msg5, school_uuid, 'custom', 'Exam Timetable Released', 'Dear Parents, The Half-Yearly Examination timetable has been released. Please check the school website or contact the class teacher for details. Ensure your ward prepares well. Best wishes! — DPS Moradabad', 'all', 30, 29, 26, 'sent', now() - INTERVAL '7 days', school_admin_user_uuid)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- PARENT QUERIES
    -- ============================================================
    INSERT INTO public.parent_queries (id, school_id, student_id, parent_phone, parent_name, query_text, response_text, responded_by, status, resolved_at)
    VALUES
        (gen_random_uuid(), school_uuid, s1, '9812345601', 'Ramesh Sharma', 'When is the next PTM scheduled?', 'The PTM is scheduled for 20th April 2026 from 9 AM to 1 PM.', 'school_admin', 'resolved', now() - INTERVAL '2 days'),
        (gen_random_uuid(), school_uuid, s5, '9812345605', 'Anil Verma', 'My son Rahul was absent for 3 days due to fever. Will it affect his attendance percentage?', 'We understand. Please submit a medical certificate and we will mark it as medical leave.', 'school_admin', 'resolved', now() - INTERVAL '5 days'),
        (gen_random_uuid(), school_uuid, s10, '9812345610', 'Ahmed Siddiqui', 'What is the fee for the upcoming exam?', 'The exam fee of Rs. 500 will be collected in the next fee cycle.', 'ai_auto', 'auto_resolved', now() - INTERVAL '1 day'),
        (gen_random_uuid(), school_uuid, s15, '9812345615', 'Shyam Tiwari', 'Is the school bus available on Saturday for the sports event?', 'Yes, the school bus will be available on Saturday for the sports day event.', 'school_admin', 'resolved', now() - INTERVAL '3 days'),
        (gen_random_uuid(), school_uuid, s20, '9812345620', 'Deepak Chaudhary', 'Can we get a duplicate fee receipt?', 'Yes, please visit the school office with your ID proof to get a duplicate receipt.', 'school_admin', 'resolved', now() - INTERVAL '4 days'),
        (gen_random_uuid(), school_uuid, s3, '9812345603', 'Imran Khan', 'What are the school timings during summer?', NULL, NULL, 'pending', NULL),
        (gen_random_uuid(), school_uuid, s8, '9812345608', 'Dinesh Patel', 'My daughter needs a transfer certificate. What is the process?', NULL, NULL, 'pending', NULL),
        (gen_random_uuid(), school_uuid, s25, '9812345625', 'Manoj Chauhan', 'Is there any scholarship available for meritorious students?', NULL, NULL, 'pending', NULL)
    ON CONFLICT (id) DO NOTHING;

    -- ============================================================
    -- ACTIVITY LOG
    -- ============================================================
    INSERT INTO public.activity_log (id, school_id, user_id, action, description, entity_type)
    VALUES
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'student_added', 'Added student Aarav Sharma to Class 5A', 'student'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'fee_created', 'Created tuition fee for all students - Q1 2026', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'payment_received', 'Payment received from Ramesh Sharma for Aarav Sharma - Rs. 5,000', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'message_sent', 'Annual Sports Day notice sent to all 30 parents', 'message'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 5A - 18 present, 2 absent', 'attendance'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'payment_received', 'Payment received from Suresh Singh for Priya Singh - Rs. 5,000', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'message_sent', 'Q1 Fee Reminder sent to 30 parents', 'message'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 6A - 20 present, 1 absent', 'attendance'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'student_added', 'Added student Mohammed Aryan to Class 5B', 'student'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'fee_created', 'Created transport fee for 20 students', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'payment_received', 'Payment received from Imran Khan for Mohammed Aryan - Rs. 2,000', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'message_sent', 'Holi Holiday notice sent to all parents', 'message'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'attendance_marked', 'Attendance marked for Class 7B - 19 present, 1 late', 'attendance'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'fee_created', 'Created exam fee for Class 10 students', 'fee'),
        (gen_random_uuid(), school_uuid, school_admin_user_uuid, 'message_sent', 'PTM Schedule circular sent to all parents', 'message')
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
