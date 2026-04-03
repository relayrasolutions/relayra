-- Migration: Full seed data for DPS Moradabad
-- Inserts 50 students, 130+ fee records, 30 days attendance, 15 messages,
-- 8 parent queries, 30 activity log entries, 10 calendar events
-- Also adds ptm_day_alert column and fixes schools RLS

-- Step 1: Add ptm_day_alert column to schools if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'ptm_day_alert_enabled'
  ) THEN
    ALTER TABLE public.schools ADD COLUMN ptm_day_alert_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Step 2: Fix RLS on schools table so school_admin can read their own school
DROP POLICY IF EXISTS "schools_read_own" ON public.schools;
DROP POLICY IF EXISTS "schools_select_own" ON public.schools;
DROP POLICY IF EXISTS "schools_update_own" ON public.schools;
DROP POLICY IF EXISTS "school_admin_read_own" ON public.schools;
DROP POLICY IF EXISTS "school_admin_update_own" ON public.schools;
DROP POLICY IF EXISTS "super_admin_all_schools" ON public.schools;
DROP POLICY IF EXISTS "authenticated_read_schools" ON public.schools;

-- Allow authenticated users to read schools (needed for school_admin to see their school)
CREATE POLICY "schools_read_authenticated"
ON public.schools
FOR SELECT
TO authenticated
USING (true);

-- Allow school_admin to update their own school
CREATE POLICY "schools_update_own_school"
ON public.schools
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT school_id FROM public.users WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT school_id FROM public.users WHERE auth_id = auth.uid()
  )
);

-- Step 3: Fix RLS on other tables to allow school_admin to read/write
-- Fix students RLS
DROP POLICY IF EXISTS "students_school_access" ON public.students;
DROP POLICY IF EXISTS "students_read_own_school" ON public.students;
DROP POLICY IF EXISTS "students_write_own_school" ON public.students;
DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select_school"
ON public.students FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "students_insert_school"
ON public.students FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "students_update_school"
ON public.students FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix fee_records RLS
DROP POLICY IF EXISTS "fee_records_school_access" ON public.fee_records;
DROP POLICY IF EXISTS "fee_records_read_own_school" ON public.fee_records;
DROP POLICY IF EXISTS "fee_records_write_own_school" ON public.fee_records;
DROP POLICY IF EXISTS "fee_records_select" ON public.fee_records;
DROP POLICY IF EXISTS "fee_records_insert" ON public.fee_records;
DROP POLICY IF EXISTS "fee_records_update" ON public.fee_records;

CREATE POLICY "fee_records_select_school"
ON public.fee_records FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "fee_records_insert_school"
ON public.fee_records FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "fee_records_update_school"
ON public.fee_records FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix attendance RLS
DROP POLICY IF EXISTS "attendance_school_access" ON public.attendance;
DROP POLICY IF EXISTS "attendance_read_own_school" ON public.attendance;
DROP POLICY IF EXISTS "attendance_write_own_school" ON public.attendance;
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update" ON public.attendance;

CREATE POLICY "attendance_select_school"
ON public.attendance FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_insert_school"
ON public.attendance FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_update_school"
ON public.attendance FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix messages RLS
DROP POLICY IF EXISTS "messages_school_access" ON public.messages;
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select_school"
ON public.messages FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "messages_insert_school"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "messages_update_school"
ON public.messages FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix message_recipients RLS
DROP POLICY IF EXISTS "message_recipients_select" ON public.message_recipients;
DROP POLICY IF EXISTS "message_recipients_insert" ON public.message_recipients;

CREATE POLICY "message_recipients_select_school"
ON public.message_recipients FOR SELECT TO authenticated
USING (message_id IN (
  SELECT id FROM public.messages WHERE school_id IN (
    SELECT school_id FROM public.users WHERE auth_id = auth.uid()
  )
));

CREATE POLICY "message_recipients_insert_school"
ON public.message_recipients FOR INSERT TO authenticated
WITH CHECK (message_id IN (
  SELECT id FROM public.messages WHERE school_id IN (
    SELECT school_id FROM public.users WHERE auth_id = auth.uid()
  )
));

-- Fix parent_queries RLS
DROP POLICY IF EXISTS "parent_queries_school_access" ON public.parent_queries;
DROP POLICY IF EXISTS "parent_queries_select" ON public.parent_queries;
DROP POLICY IF EXISTS "parent_queries_insert" ON public.parent_queries;
DROP POLICY IF EXISTS "parent_queries_update" ON public.parent_queries;

CREATE POLICY "parent_queries_select_school"
ON public.parent_queries FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "parent_queries_insert_school"
ON public.parent_queries FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "parent_queries_update_school"
ON public.parent_queries FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix activity_log RLS
DROP POLICY IF EXISTS "activity_log_school_access" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;

CREATE POLICY "activity_log_select_school"
ON public.activity_log FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "activity_log_insert_school"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix academic_calendar RLS
DROP POLICY IF EXISTS "academic_calendar_school_access" ON public.academic_calendar;
DROP POLICY IF EXISTS "academic_calendar_select" ON public.academic_calendar;
DROP POLICY IF EXISTS "academic_calendar_insert" ON public.academic_calendar;
DROP POLICY IF EXISTS "academic_calendar_update" ON public.academic_calendar;
DROP POLICY IF EXISTS "academic_calendar_delete" ON public.academic_calendar;

CREATE POLICY "academic_calendar_select_school"
ON public.academic_calendar FOR SELECT TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "academic_calendar_insert_school"
ON public.academic_calendar FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "academic_calendar_update_school"
ON public.academic_calendar FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "academic_calendar_delete_school"
ON public.academic_calendar FOR DELETE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix message_templates RLS
DROP POLICY IF EXISTS "message_templates_school_access" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_select" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_insert" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_update" ON public.message_templates;
DROP POLICY IF EXISTS "message_templates_delete" ON public.message_templates;

CREATE POLICY "message_templates_select_school"
ON public.message_templates FOR SELECT TO authenticated
USING (school_id IS NULL OR school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "message_templates_insert_school"
ON public.message_templates FOR INSERT TO authenticated
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "message_templates_update_school"
ON public.message_templates FOR UPDATE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "message_templates_delete_school"
ON public.message_templates FOR DELETE TO authenticated
USING (school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid()));

-- Fix users RLS to allow school_admin to read users in their school
DROP POLICY IF EXISTS "users_select_own_record" ON public.users;
DROP POLICY IF EXISTS "users_update_own_record" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_record" ON public.users;

CREATE POLICY "users_select_own_or_school"
ON public.users FOR SELECT TO authenticated
USING (
  auth_id = auth.uid()
  OR school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid())
);

CREATE POLICY "users_update_own_record"
ON public.users FOR UPDATE TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_insert_own_record"
ON public.users FOR INSERT TO authenticated
WITH CHECK (auth_id = auth.uid());

-- Step 4: Insert seed data
DO $$
DECLARE
  dps_id UUID;
  admin_user_id UUID;
  s_ids UUID[] := ARRAY[]::UUID[];
  s_id UUID;
  i INTEGER;
  j INTEGER;
  d DATE;
  att_status TEXT;
  fee_amt INTEGER;
  fee_status TEXT;
  pay_date TIMESTAMPTZ;
  msg_id UUID;
  student_names TEXT[] := ARRAY[
    'Aarav Sharma','Aditi Singh','Akash Verma','Ananya Gupta','Arjun Mishra',
    'Bhavna Yadav','Chirag Patel','Deepika Tiwari','Dev Kumar','Divya Saxena',
    'Gaurav Joshi','Harshita Agarwal','Ishaan Srivastava','Jaya Pandey','Karan Mehta',
    'Kavya Dubey','Lakshmi Nair','Manish Chauhan','Meera Rajput','Mohit Bansal',
    'Nandini Tripathi','Nikhil Shukla','Pallavi Rao','Priya Malhotra','Rahul Chandra',
    'Riya Kapoor','Rohit Bhatia','Sakshi Jain','Sanjay Thakur','Shreya Awasthi',
    'Shubham Dixit','Simran Kaur','Sonal Rastogi','Suresh Yadav','Tanvi Goyal',
    'Tushar Soni','Uday Bhatt','Vandana Misra','Varun Aggarwal','Vidya Pillai',
    'Vikram Desai','Vishal Negi','Yash Khanna','Zara Khan','Aditya Rathore',
    'Ankit Bajaj','Bharat Lal','Chetan Vyas','Deepak Ojha','Ekta Sinha'
  ];
  parent_names TEXT[] := ARRAY[
    'Rajesh Sharma','Sunita Singh','Anil Verma','Priya Gupta','Suresh Mishra',
    'Rekha Yadav','Mahesh Patel','Anita Tiwari','Vijay Kumar','Sushma Saxena',
    'Ramesh Joshi','Kavita Agarwal','Dinesh Srivastava','Meena Pandey','Ashok Mehta',
    'Geeta Dubey','Krishnan Nair','Rajendra Chauhan','Sundar Rajput','Vinod Bansal',
    'Shanti Tripathi','Arun Shukla','Venkat Rao','Sunil Malhotra','Mohan Chandra',
    'Neeta Kapoor','Suresh Bhatia','Prakash Jain','Ramesh Thakur','Usha Awasthi',
    'Vinay Dixit','Gurpreet Kaur','Anil Rastogi','Ramesh Yadav','Poonam Goyal',
    'Mahesh Soni','Umesh Bhatt','Shyam Misra','Rajiv Aggarwal','Lata Pillai',
    'Suresh Desai','Ramesh Negi','Anil Khanna','Salim Khan','Vikram Rathore',
    'Suresh Bajaj','Ram Lal','Mohan Vyas','Suresh Ojha','Ravi Sinha'
  ];
  classes TEXT[] := ARRAY['1','2','3','4','5','6','7','8','9','10'];
  sections TEXT[] := ARRAY['A','B','C'];
  genders TEXT[] := ARRAY['Male','Female'];
  fee_types TEXT[] := ARRAY['tuition','transport','library','sports','exam'];
  att_statuses TEXT[] := ARRAY['present','present','present','present','absent','late'];
  msg_bodies TEXT[] := ARRAY[
    'Dear Parent, your ward {student_name} was absent today. Please ensure regular attendance.',
    'Fee reminder: Tuition fee for {student_name} is due. Please pay at the earliest.',
    'PTM scheduled for Saturday 10 AM. Please attend to discuss your ward''s progress.',
    'School will remain closed on 15th April for local holiday.',
    'Exam schedule for Class {class} has been released. Check the school notice board.',
    'Annual Sports Day on 20th April. Students must wear sports uniform.',
    'Result declaration for Term 1 exams on 25th April. Collect from school office.',
    'Library books must be returned by 30th April to avoid fine.',
    'School bus route 3 will be delayed by 15 minutes tomorrow.',
    'Congratulations! {student_name} has been selected for the inter-school quiz.',
    'Parent-Teacher Meeting rescheduled to next Monday 10 AM.',
    'Fee payment portal is now open for April month fees.',
    'School will observe Founder''s Day on 5th May with cultural programs.',
    'Students must bring their ID cards daily for security purposes.',
    'Reminder: Submit science project by Friday to avoid marks deduction.'
  ];
  query_texts TEXT[] := ARRAY[
    'My child has been unwell for 3 days. Please excuse the absence.',
    'Can you please share the exam timetable for Class 7?',
    'The bus is arriving 20 minutes late every day. Please look into this.',
    'My child lost the school diary. How do I get a replacement?',
    'Can I get a fee receipt for the payment made last week?',
    'My child is being bullied by classmates. Please take action.',
    'Can the school provide extra coaching for weak students?',
    'I want to change my child''s bus route from Route 2 to Route 5.'
  ];
  activity_actions TEXT[] := ARRAY[
    'student_added','fee_created','payment_received','message_sent',
    'attendance_marked','student_updated','fee_updated','query_resolved'
  ];
  activity_descs TEXT[] := ARRAY[
    'Added new student to Class 7-A',
    'Created tuition fee record for April',
    'Payment received for student fee',
    'Sent attendance alert to 5 parents',
    'Marked attendance for Class 8-B',
    'Updated student contact information',
    'Updated fee status to paid',
    'Resolved parent query about bus timing'
  ];
BEGIN
  -- Get DPS school ID
  SELECT id INTO dps_id FROM public.schools WHERE slug = 'dps-moradabad' LIMIT 1;
  IF dps_id IS NULL THEN
    RAISE NOTICE 'DPS school not found, skipping seed data';
    RETURN;
  END IF;

  -- Get admin user ID
  SELECT id INTO admin_user_id FROM public.users WHERE email = 'admin@dps-moradabad.com' LIMIT 1;

  -- Step 4a: Insert 50 students (skip if already exist)
  IF (SELECT COUNT(*) FROM public.students WHERE school_id = dps_id) < 50 THEN
    FOR i IN 1..50 LOOP
      INSERT INTO public.students (
        school_id, name, class, section, roll_number, admission_number,
        date_of_birth, gender, address, bus_route, parent_name, parent_phone,
        parent_email, status, created_at
      ) VALUES (
        dps_id,
        student_names[i],
        classes[((i-1) % 10) + 1],
        sections[((i-1) % 3) + 1],
        LPAD(i::TEXT, 3, '0'),
        'DPS2024' || LPAD(i::TEXT, 3, '0'),
        ('2010-01-01'::DATE + ((i * 37) % 1825 || ' days')::INTERVAL)::DATE,
        genders[((i-1) % 2) + 1],
        i::TEXT || ', Civil Lines, Moradabad, UP',
        'Route ' || ((i % 5) + 1)::TEXT,
        parent_names[i],
        '98765' || LPAD((43210 + i)::TEXT, 5, '0'),
        'parent' || i::TEXT || '@gmail.com',
        'active',
        NOW() - ((50 - i) || ' days')::INTERVAL
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Inserted 50 students';
  ELSE
    RAISE NOTICE 'Students already exist, skipping';
  END IF;

  -- Collect student IDs
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO s_ids
  FROM public.students WHERE school_id = dps_id LIMIT 50;

  -- Step 4b: Insert fee records (skip if already exist)
  IF (SELECT COUNT(*) FROM public.fee_records WHERE school_id = dps_id) < 100 THEN
    FOR i IN 1..ARRAY_LENGTH(s_ids, 1) LOOP
      s_id := s_ids[i];
      -- Tuition fee
      IF (i % 3) = 0 THEN
        fee_status := 'overdue';
        fee_amt := 250000 + ((i % 5) * 10000);
        pay_date := NULL;
      ELSIF (i % 3) = 1 THEN
        fee_status := 'paid';
        fee_amt := 250000 + ((i % 5) * 10000);
        pay_date := NOW() - ((i % 20) || ' days')::INTERVAL;
      ELSE
        fee_status := 'pending';
        fee_amt := 250000 + ((i % 5) * 10000);
        pay_date := NULL;
      END IF;

      INSERT INTO public.fee_records (
        school_id, student_id, fee_type, description, total_amount, paid_amount,
        due_date, status, payment_date, payment_method, receipt_number, created_by
      ) VALUES (
        dps_id, s_id, 'tuition', 'Tuition Fee - April 2026',
        fee_amt,
        CASE WHEN fee_status = 'paid' THEN fee_amt ELSE 0 END,
        '2026-04-10',
        fee_status,
        pay_date,
        CASE WHEN fee_status = 'paid' THEN 'upi' ELSE NULL END,
        CASE WHEN fee_status = 'paid' THEN 'RCP' || LPAD(i::TEXT, 5, '0') ELSE NULL END,
        admin_user_id
      ) ON CONFLICT DO NOTHING;

      -- Transport fee for half the students
      IF i % 2 = 0 THEN
        INSERT INTO public.fee_records (
          school_id, student_id, fee_type, description, total_amount, paid_amount,
          due_date, status, payment_date, payment_method, receipt_number, created_by
        ) VALUES (
          dps_id, s_id, 'transport', 'Transport Fee - April 2026',
          80000,
          CASE WHEN i % 4 = 0 THEN 80000 ELSE 0 END,
          '2026-04-10',
          CASE WHEN i % 4 = 0 THEN 'paid' ELSE 'pending' END,
          CASE WHEN i % 4 = 0 THEN NOW() - ((i % 15) || ' days')::INTERVAL ELSE NULL END,
          CASE WHEN i % 4 = 0 THEN 'cash' ELSE NULL END,
          CASE WHEN i % 4 = 0 THEN 'RCT' || LPAD(i::TEXT, 5, '0') ELSE NULL END,
          admin_user_id
        ) ON CONFLICT DO NOTHING;
      END IF;

      -- Exam fee for students in classes 9 and 10
      IF (i % 10) IN (9, 0) THEN
        INSERT INTO public.fee_records (
          school_id, student_id, fee_type, description, total_amount, paid_amount,
          due_date, status, payment_date, payment_method, receipt_number, created_by
        ) VALUES (
          dps_id, s_id, 'exam', 'Board Exam Fee 2026',
          150000, 150000, '2026-03-15', 'paid',
          NOW() - '30 days'::INTERVAL, 'online',
          'RCE' || LPAD(i::TEXT, 5, '0'),
          admin_user_id
        ) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
    RAISE NOTICE 'Inserted fee records';
  ELSE
    RAISE NOTICE 'Fee records already exist, skipping';
  END IF;

  -- Step 4c: Insert 30 days attendance for all students
  IF (SELECT COUNT(*) FROM public.attendance WHERE school_id = dps_id) < 100 THEN
    FOR j IN 0..29 LOOP
      d := CURRENT_DATE - (j || ' days')::INTERVAL;
      -- Skip Sundays
      IF EXTRACT(DOW FROM d) = 0 THEN CONTINUE; END IF;

      FOR i IN 1..LEAST(ARRAY_LENGTH(s_ids, 1), 50) LOOP
        s_id := s_ids[i];
        att_status := att_statuses[((i + j) % 6) + 1];

        INSERT INTO public.attendance (
          school_id, student_id, date, status, marked_by, marked_via
        ) VALUES (
          dps_id, s_id, d, att_status, admin_user_id, 'dashboard'
        ) ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
    RAISE NOTICE 'Inserted attendance records';
  ELSE
    RAISE NOTICE 'Attendance records already exist, skipping';
  END IF;

  -- Step 4d: Insert 15 messages
  IF (SELECT COUNT(*) FROM public.messages WHERE school_id = dps_id) < 15 THEN
    FOR i IN 1..15 LOOP
      INSERT INTO public.messages (
        school_id, type, title, body, target_type, recipient_count,
        sent_count, delivered_count, read_count, status, sent_at, created_by
      ) VALUES (
        dps_id,
        CASE WHEN i = 1 THEN 'emergency' WHEN i % 3 = 0 THEN 'fee_reminder' ELSE 'general' END,
        CASE WHEN i % 3 = 0 THEN 'Fee Reminder' WHEN i % 5 = 0 THEN 'Exam Notice' ELSE 'School Notice' END,
        msg_bodies[i],
        CASE WHEN i % 4 = 0 THEN 'class' ELSE 'all' END,
        50, 50, 45, 38,
        'sent',
        NOW() - ((15 - i) || ' days')::INTERVAL,
        admin_user_id
      ) ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Inserted 15 messages';
  ELSE
    RAISE NOTICE 'Messages already exist, skipping';
  END IF;

  -- Step 4e: Insert 8 parent queries
  IF (SELECT COUNT(*) FROM public.parent_queries WHERE school_id = dps_id) < 8 THEN
    FOR i IN 1..8 LOOP
      INSERT INTO public.parent_queries (
        school_id, student_id, parent_phone, parent_name, query_text,
        response_text, status, resolved_at
      ) VALUES (
        dps_id,
        s_ids[i],
        '98765' || LPAD((43210 + i)::TEXT, 5, '0'),
        parent_names[i],
        query_texts[i],
        CASE WHEN i % 3 = 0 THEN 'Thank you for reaching out. We have addressed your concern.' ELSE NULL END,
        CASE WHEN i % 3 = 0 THEN 'resolved' ELSE 'pending' END,
        CASE WHEN i % 3 = 0 THEN NOW() - ((i % 5) || ' days')::INTERVAL ELSE NULL END
      ) ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Inserted 8 parent queries';
  ELSE
    RAISE NOTICE 'Parent queries already exist, skipping';
  END IF;

  -- Step 4f: Insert 30 activity log entries
  IF (SELECT COUNT(*) FROM public.activity_log WHERE school_id = dps_id) < 30 THEN
    FOR i IN 1..30 LOOP
      INSERT INTO public.activity_log (
        school_id, user_id, action, description, entity_type, entity_id
      ) VALUES (
        dps_id,
        admin_user_id,
        activity_actions[((i-1) % 8) + 1],
        activity_descs[((i-1) % 8) + 1],
        CASE WHEN i % 3 = 0 THEN 'student' WHEN i % 3 = 1 THEN 'fee' ELSE 'message' END,
        CASE WHEN ARRAY_LENGTH(s_ids, 1) >= i THEN s_ids[i] ELSE NULL END
      ) ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Inserted 30 activity log entries';
  ELSE
    RAISE NOTICE 'Activity log already exists, skipping';
  END IF;

  -- Step 4g: Insert 10 calendar events
  IF (SELECT COUNT(*) FROM public.academic_calendar WHERE school_id = dps_id) < 10 THEN
    INSERT INTO public.academic_calendar (school_id, title, description, event_type, start_date, end_date, color, is_all_day, created_by)
    VALUES
      (dps_id, 'Annual Examination', 'Annual exams for all classes', 'exam', CURRENT_DATE + 15, CURRENT_DATE + 22, '#EF4444', true, admin_user_id),
      (dps_id, 'Parent-Teacher Meeting', 'PTM for Classes 6-10', 'ptm', CURRENT_DATE + 8, NULL, '#8B5CF6', true, admin_user_id),
      (dps_id, 'Eid Holiday', 'School closed for Eid', 'holiday', CURRENT_DATE + 5, NULL, '#10B981', true, admin_user_id),
      (dps_id, 'Annual Sports Day', 'Inter-house sports competition', 'event', CURRENT_DATE + 20, CURRENT_DATE + 20, '#F59E0B', true, admin_user_id),
      (dps_id, 'Result Declaration', 'Term 1 results announced', 'result_day', CURRENT_DATE + 25, NULL, '#3B82F6', true, admin_user_id),
      (dps_id, 'Science Exhibition', 'Annual science project exhibition', 'event', CURRENT_DATE + 30, NULL, '#EC4899', true, admin_user_id),
      (dps_id, 'Summer Vacation', 'School closed for summer', 'holiday', CURRENT_DATE + 45, CURRENT_DATE + 75, '#10B981', true, admin_user_id),
      (dps_id, 'Mid-Term Exam', 'Mid-term examinations', 'exam', CURRENT_DATE + 35, CURRENT_DATE + 40, '#EF4444', true, admin_user_id),
      (dps_id, 'Founder''s Day', 'School Founder''s Day celebration', 'event', CURRENT_DATE + 12, NULL, '#F59E0B', true, admin_user_id),
      (dps_id, 'PTM - Primary Classes', 'PTM for Classes 1-5', 'ptm', CURRENT_DATE + 18, NULL, '#8B5CF6', true, admin_user_id)
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Inserted 10 calendar events';
  ELSE
    RAISE NOTICE 'Calendar events already exist, skipping';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
