-- Migration: Add religion field to students and feature_settings to schools
-- Required for religion-based festival greetings and feature toggles

-- 1. Add religion column to students table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='religion') THEN
    ALTER TABLE public.students ADD COLUMN religion TEXT DEFAULT 'Not Specified';
  END IF;
END $$;

-- 2. Add mother_name column to students table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='mother_name') THEN
    ALTER TABLE public.students ADD COLUMN mother_name TEXT;
  END IF;
END $$;

-- 3. Add feature_settings JSONB column to schools table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='schools' AND column_name='feature_settings') THEN
    ALTER TABLE public.schools ADD COLUMN feature_settings JSONB DEFAULT '{
      "fee_reminders": true,
      "fee_escalation": true,
      "attendance_alerts": true,
      "daily_report": true,
      "monthly_report": true,
      "birthday_greetings": true,
      "festival_greetings": true,
      "festival_send_mode": "all",
      "two_way_chat": true,
      "emergency_broadcast": true
    }'::jsonb;
  END IF;
END $$;

-- 4. Create index on religion for filtering
CREATE INDEX IF NOT EXISTS idx_students_religion ON public.students(religion);
