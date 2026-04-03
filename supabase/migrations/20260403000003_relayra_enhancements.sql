-- Academic Calendar Table
CREATE TABLE IF NOT EXISTS public.academic_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL DEFAULT 'custom', -- exam, ptm, holiday, event, result_day, custom
  start_date date NOT NULL,
  end_date date,
  color text DEFAULT '#6B7280',
  is_all_day boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academic_calendar_school_date ON public.academic_calendar(school_id, start_date);

-- Message Templates Table
CREATE TABLE IF NOT EXISTS public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE, -- null = system template
  name text NOT NULL,
  category text NOT NULL, -- fee, attendance, academic, administrative, emergency, greetings
  language text DEFAULT 'EN', -- EN, HI
  body text NOT NULL,
  variables jsonb DEFAULT '[]',
  is_system boolean DEFAULT false,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_school ON public.message_templates(school_id);

-- Add assigned_class to users for school_staff
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='assigned_class') THEN
    ALTER TABLE public.users ADD COLUMN assigned_class text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='assigned_section') THEN
    ALTER TABLE public.users ADD COLUMN assigned_section text;
  END IF;
END $$;

-- Add alert rule columns to schools
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='consecutive_absent_alert') THEN
    ALTER TABLE public.schools ADD COLUMN consecutive_absent_alert integer DEFAULT 2;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='monthly_absent_alert') THEN
    ALTER TABLE public.schools ADD COLUMN monthly_absent_alert integer DEFAULT 5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='festival_greeting_enabled') THEN
    ALTER TABLE public.schools ADD COLUMN festival_greeting_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='monthly_report_enabled') THEN
    ALTER TABLE public.schools ADD COLUMN monthly_report_enabled boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='monthly_report_day') THEN
    ALTER TABLE public.schools ADD COLUMN monthly_report_day integer DEFAULT 1;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.academic_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_calendar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='academic_calendar' AND policyname='super_admin_all_calendar') THEN
    CREATE POLICY super_admin_all_calendar ON public.academic_calendar
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='academic_calendar' AND policyname='school_users_calendar') THEN
    CREATE POLICY school_users_calendar ON public.academic_calendar
      FOR ALL USING (
        school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid() AND school_id IS NOT NULL)
      );
  END IF;
END $$;

-- RLS Policies for message_templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='message_templates' AND policyname='super_admin_all_templates') THEN
    CREATE POLICY super_admin_all_templates ON public.message_templates
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'super_admin')
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='message_templates' AND policyname='school_users_templates') THEN
    CREATE POLICY school_users_templates ON public.message_templates
      FOR ALL USING (
        is_system = true OR
        school_id IN (SELECT school_id FROM public.users WHERE auth_id = auth.uid() AND school_id IS NOT NULL)
      );
  END IF;
END $$;

-- Insert 30 system message templates
INSERT INTO public.message_templates (name, category, language, body, variables, is_system)
SELECT name, category, language, body, variables::jsonb, true
FROM (VALUES
  -- Fee Templates (5)
  ('Fee Reminder - Gentle', 'fee', 'EN', 'Dear {{parent_name}}, this is a gentle reminder that {{student_name}}''s {{fee_type}} fee of Rs. {{amount}} is due on {{due_date}}. Kindly clear the dues at the earliest. For queries, contact the school office. — {{school_name}}', '["parent_name","student_name","fee_type","amount","due_date","school_name"]'),
  ('Fee Due Today', 'fee', 'EN', 'Dear {{parent_name}}, {{student_name}}''s {{fee_type}} fee of Rs. {{amount}} is due TODAY. Please make the payment to avoid late charges. — {{school_name}}', '["parent_name","student_name","fee_type","amount","school_name"]'),
  ('Fee Overdue - Soft', 'fee', 'EN', 'Dear {{parent_name}}, {{student_name}}''s {{fee_type}} fee of Rs. {{amount}} is now {{days}} days overdue. Please clear the dues immediately. Contact us if you need assistance. — {{school_name}}', '["parent_name","student_name","fee_type","amount","days","school_name"]'),
  ('Fee Overdue - Firm', 'fee', 'EN', 'Dear {{parent_name}}, this is a firm reminder that {{student_name}}''s fee of Rs. {{amount}} remains unpaid for {{days}} days. Immediate payment is required to avoid further action. — {{school_name}} Administration', '["parent_name","student_name","amount","days","school_name"]'),
  ('Fee Final Notice', 'fee', 'EN', 'FINAL NOTICE: Dear {{parent_name}}, {{student_name}}''s outstanding fee of Rs. {{amount}} is critically overdue. Please contact the school office immediately. — {{school_name}} Administration', '["parent_name","student_name","amount","school_name"]'),
  -- Attendance Templates (3)
  ('Absent Today', 'attendance', 'EN', 'Dear {{parent_name}}, {{student_name}} was marked absent today ({{date}}). If this is an error, please contact the school. — {{school_name}}', '["parent_name","student_name","date","school_name"]'),
  ('Consecutive Absence', 'attendance', 'EN', 'Dear {{parent_name}}, {{student_name}} has been absent for {{days}} consecutive days. Please inform the school about the reason. — {{school_name}}', '["parent_name","student_name","days","school_name"]'),
  ('Low Attendance Warning', 'attendance', 'EN', 'Dear {{parent_name}}, {{student_name}}''s attendance has dropped to {{percentage}}% which is below the required 75%. Please ensure regular attendance. — {{school_name}}', '["parent_name","student_name","percentage","school_name"]'),
  -- Academic Templates (8)
  ('Exam Schedule', 'academic', 'EN', 'Dear {{parent_name}}, the {{event_name}} examinations for {{class}} will begin from {{date}}. Please ensure {{student_name}} is well prepared. Timetable available at school. — {{school_name}}', '["parent_name","event_name","class","date","student_name","school_name"]'),
  ('Results Declared', 'academic', 'EN', 'Dear {{parent_name}}, {{student_name}}''s {{event_name}} results have been declared. Report card will be distributed on {{date}}. — {{school_name}}', '["parent_name","student_name","event_name","date","school_name"]'),
  ('PTM Invitation', 'academic', 'EN', 'Dear {{parent_name}}, you are invited to the Parent-Teacher Meeting on {{date}}. Your presence is requested to discuss {{student_name}}''s academic progress. — {{school_name}}', '["parent_name","date","student_name","school_name"]'),
  ('PTM Reminder', 'academic', 'EN', 'Dear {{parent_name}}, reminder: Parent-Teacher Meeting is scheduled for TOMORROW. Please ensure your attendance. — {{school_name}}', '["parent_name","school_name"]'),
  ('Homework Reminder', 'academic', 'EN', 'Dear {{parent_name}}, please ensure {{student_name}} completes the assigned homework for {{date}}. Regular practice is key to academic success. — {{school_name}}', '["parent_name","student_name","date","school_name"]'),
  ('New Session Notice', 'academic', 'EN', 'Dear {{parent_name}}, the new academic session begins on {{date}}. School timings: {{event_name}}. Please ensure {{student_name}} is present on the first day. — {{school_name}}', '["parent_name","date","event_name","student_name","school_name"]'),
  ('Book List', 'academic', 'EN', 'Dear {{parent_name}}, the book list for {{class}} (Session {{event_name}}) is now available. Please collect it from the school office. — {{school_name}}', '["parent_name","class","event_name","school_name"]'),
  ('Admission Open', 'academic', 'EN', 'Dear {{parent_name}}, admissions for the new academic session are now open at {{school_name}}. For details, contact the school office or visit us. — {{school_name}} Administration', '["parent_name","school_name"]'),
  -- Administrative Templates (6)
  ('Holiday Announcement', 'administrative', 'EN', 'Dear Parents, {{school_name}} will remain closed on {{date}} on account of {{event_name}}. Classes will resume on the next working day. — {{school_name}} Administration', '["school_name","date","event_name"]'),
  ('Timing Change', 'administrative', 'EN', 'Dear {{parent_name}}, please note that school timings will be changed to {{event_name}} from {{date}}. — {{school_name}} Administration', '["parent_name","event_name","date","school_name"]'),
  ('Uniform Notice', 'administrative', 'EN', 'Dear {{parent_name}}, all students are required to wear proper school uniform from {{date}}. Non-compliance will be noted. — {{school_name}} Administration', '["parent_name","date","school_name"]'),
  ('Fee Structure', 'administrative', 'EN', 'Dear {{parent_name}}, the revised fee structure for the new session is now available. Please collect the details from the school office. — {{school_name}}', '["parent_name","school_name"]'),
  ('Event Invitation', 'administrative', 'EN', 'Dear {{parent_name}}, you are cordially invited to {{event_name}} at {{school_name}} on {{date}}. We look forward to your presence. — {{school_name}} Administration', '["parent_name","event_name","school_name","date"]'),
  ('General Notice', 'administrative', 'EN', 'Dear {{parent_name}}, {{school_name}} wishes to inform you that {{event_name}}. For more details, please contact the school office. — {{school_name}} Administration', '["parent_name","school_name","event_name"]'),
  -- Emergency Templates (4)
  ('Weather Closure', 'emergency', 'EN', 'URGENT: Dear Parents, due to adverse weather conditions, {{school_name}} will remain closed tomorrow. Stay safe. — {{school_name}} Administration', '["school_name"]'),
  ('Emergency Closure', 'emergency', 'EN', 'URGENT: Dear Parents, {{school_name}} is closed today due to an emergency. Students should not come to school. Further updates will follow. — {{school_name}} Administration', '["school_name"]'),
  ('Security Alert', 'emergency', 'EN', 'IMPORTANT: Dear {{parent_name}}, please be informed about a security advisory. {{event_name}}. Please follow all safety guidelines. — {{school_name}} Administration', '["parent_name","event_name","school_name"]'),
  ('Health Advisory', 'emergency', 'EN', 'Dear {{parent_name}}, a health advisory has been issued. {{event_name}}. Please ensure {{student_name}} follows all health protocols. — {{school_name}}', '["parent_name","event_name","student_name","school_name"]'),
  -- Greetings Templates (4)
  ('Birthday Greeting', 'greetings', 'EN', 'Dear {{parent_name}}, {{school_name}} wishes {{student_name}} a very Happy Birthday! 🎂 May this special day bring joy and happiness. — {{school_name}} Family', '["parent_name","student_name","school_name"]'),
  ('Festival Greeting', 'greetings', 'EN', 'Dear {{parent_name}}, {{school_name}} wishes you and your family a very Happy {{event_name}}! 🎉 May this festival bring joy, peace and prosperity. — {{school_name}} Family', '["parent_name","event_name","school_name"]'),
  ('National Day', 'greetings', 'EN', 'Dear {{parent_name}}, on the occasion of {{event_name}}, {{school_name}} wishes you and your family a heartfelt greeting. Jai Hind! 🇮🇳 — {{school_name}}', '["parent_name","event_name","school_name"]'),
  ('New Year Greeting', 'greetings', 'EN', 'Dear {{parent_name}}, {{school_name}} wishes you and your family a very Happy New Year! 🎊 May the new year bring success and happiness. — {{school_name}} Family', '["parent_name","school_name"]')
) AS t(name, category, language, body, variables)
WHERE NOT EXISTS (SELECT 1 FROM public.message_templates WHERE is_system = true AND name = t.name);

-- Insert sample calendar events for demo school
INSERT INTO public.academic_calendar (school_id, title, description, event_type, start_date, end_date, color)
SELECT 
  s.id,
  e.title,
  e.description,
  e.event_type,
  (CURRENT_DATE + e.days_offset)::date,
  CASE WHEN e.duration > 1 THEN (CURRENT_DATE + e.days_offset + e.duration - 1)::date ELSE NULL END,
  e.color
FROM public.schools s
CROSS JOIN (VALUES
  ('Unit Test - Class 6-10', 'Unit test for classes 6 to 10', 'exam', 7, 3, '#EF4444'),
  ('Parent-Teacher Meeting', 'Quarterly PTM for all classes', 'ptm', 14, 1, '#3B82F6'),
  ('Holi Holiday', 'School closed for Holi festival', 'holiday', 21, 2, '#10B981'),
  ('Annual Sports Day', 'Annual sports day celebration', 'event', 30, 1, '#8B5CF6'),
  ('Half-Yearly Results', 'Distribution of half-yearly report cards', 'result_day', 45, 1, '#F59E0B'),
  ('Summer Vacation Begins', 'School closes for summer vacation', 'holiday', 60, 45, '#10B981'),
  ('Independence Day', 'Independence Day celebration at school', 'event', 75, 1, '#8B5CF6'),
  ('PTM - Term 2', 'Parent-Teacher Meeting for Term 2', 'ptm', 90, 1, '#3B82F6'),
  ('Annual Exam Schedule', 'Annual examinations begin', 'exam', 105, 10, '#EF4444'),
  ('Annual Day', 'School Annual Day celebration', 'event', 120, 1, '#8B5CF6')
) AS e(title, description, event_type, days_offset, duration, color)
WHERE NOT EXISTS (SELECT 1 FROM public.academic_calendar WHERE school_id = s.id AND title = e.title);
