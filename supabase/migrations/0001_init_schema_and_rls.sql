-- ============================================================================
-- EduOS: Complete Multi-Tenant Database Schema with Row-Level Security (RLS)
-- Migration: 0001_init_schema_and_rls.sql
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Schools Table (Tenants)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand_color TEXT DEFAULT '#2563eb',
  feature_flags JSONB DEFAULT '{"attendance": true, "fees": true, "homework": true, "announcements": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'principal', 'teacher', 'student', 'parent')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  section TEXT,
  class_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  designation TEXT NOT NULL,
  department TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guardian_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  roll_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, date)
);

-- 7. Fee Structure Table
CREATE TABLE IF NOT EXISTS public.fee_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  fee_head TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  term TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Fee Payments Table
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_structure_id UUID REFERENCES public.fee_structure(id) ON DELETE SET NULL,
  amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
  payment_method TEXT DEFAULT 'cash',
  transaction_reference TEXT,
  receipt_number TEXT NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 9. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT DEFAULT 'all',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Homework Table
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Homework Submissions Table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  homework_id UUID NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_content TEXT,
  grade TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (homework_id, student_id)
);

-- ============================================================================
-- Helper Functions for Security & RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auth_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policies: schools
-- ============================================================================
DROP POLICY IF EXISTS "schools_super_admin_all" ON public.schools;
CREATE POLICY "schools_super_admin_all" ON public.schools
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin')
  WITH CHECK (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "schools_read_own" ON public.schools;
CREATE POLICY "schools_read_own" ON public.schools
  FOR SELECT TO authenticated
  USING (id = public.auth_school_id());

-- ============================================================================
-- Policies: profiles
-- ============================================================================
DROP POLICY IF EXISTS "profiles_super_admin_all" ON public.profiles;
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin')
  WITH CHECK (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "profiles_read_same_school" ON public.profiles;
CREATE POLICY "profiles_read_same_school" ON public.profiles
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- Policies: classes
-- ============================================================================
DROP POLICY IF EXISTS "classes_super_admin_all" ON public.classes;
CREATE POLICY "classes_super_admin_all" ON public.classes
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "classes_tenant_read" ON public.classes;
CREATE POLICY "classes_tenant_read" ON public.classes
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id());

DROP POLICY IF EXISTS "classes_staff_write" ON public.classes;
CREATE POLICY "classes_staff_write" ON public.classes
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'))
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'));

-- ============================================================================
-- Policies: staff
-- ============================================================================
DROP POLICY IF EXISTS "staff_super_admin_all" ON public.staff;
CREATE POLICY "staff_super_admin_all" ON public.staff
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "staff_tenant_read" ON public.staff;
CREATE POLICY "staff_tenant_read" ON public.staff
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id());

DROP POLICY IF EXISTS "staff_principal_write" ON public.staff;
CREATE POLICY "staff_principal_write" ON public.staff
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal')
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal');

-- ============================================================================
-- Policies: students
-- ============================================================================
DROP POLICY IF EXISTS "students_super_admin_all" ON public.students;
CREATE POLICY "students_super_admin_all" ON public.students
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "students_tenant_read_staff" ON public.students;
CREATE POLICY "students_tenant_read_staff" ON public.students
  FOR SELECT TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'parent' AND guardian_profile_id = auth.uid())
      OR (public.auth_user_role() = 'student' AND profile_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "students_staff_write" ON public.students;
CREATE POLICY "students_staff_write" ON public.students
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'))
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'));

-- ============================================================================
-- Policies: attendance
-- ============================================================================
DROP POLICY IF EXISTS "attendance_super_admin_all" ON public.attendance;
CREATE POLICY "attendance_super_admin_all" ON public.attendance
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "attendance_tenant_read" ON public.attendance;
CREATE POLICY "attendance_tenant_read" ON public.attendance
  FOR SELECT TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'parent' AND student_id IN (SELECT id FROM public.students WHERE guardian_profile_id = auth.uid()))
      OR (public.auth_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "attendance_teacher_write" ON public.attendance;
CREATE POLICY "attendance_teacher_write" ON public.attendance
  FOR ALL TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() = 'principal'
      OR (
        public.auth_user_role() = 'teacher'
        AND class_id IN (SELECT id FROM public.classes WHERE class_teacher_id = auth.uid() OR school_id = public.auth_school_id())
      )
    )
  )
  WITH CHECK (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() = 'principal'
      OR (
        public.auth_user_role() = 'teacher'
        AND class_id IN (SELECT id FROM public.classes WHERE class_teacher_id = auth.uid() OR school_id = public.auth_school_id())
      )
    )
  );

-- ============================================================================
-- Policies: fee_structure
-- ============================================================================
DROP POLICY IF EXISTS "fee_structure_super_admin_all" ON public.fee_structure;
CREATE POLICY "fee_structure_super_admin_all" ON public.fee_structure
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "fee_structure_tenant_read" ON public.fee_structure;
CREATE POLICY "fee_structure_tenant_read" ON public.fee_structure
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id());

DROP POLICY IF EXISTS "fee_structure_principal_write" ON public.fee_structure;
CREATE POLICY "fee_structure_principal_write" ON public.fee_structure
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal')
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal');

-- ============================================================================
-- Policies: fee_payments
-- ============================================================================
DROP POLICY IF EXISTS "fee_payments_super_admin_all" ON public.fee_payments;
CREATE POLICY "fee_payments_super_admin_all" ON public.fee_payments
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "fee_payments_tenant_read" ON public.fee_payments;
CREATE POLICY "fee_payments_tenant_read" ON public.fee_payments
  FOR SELECT TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'parent' AND student_id IN (SELECT id FROM public.students WHERE guardian_profile_id = auth.uid()))
      OR (public.auth_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "fee_payments_principal_write" ON public.fee_payments;
CREATE POLICY "fee_payments_principal_write" ON public.fee_payments
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal')
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() = 'principal');

-- ============================================================================
-- Policies: announcements
-- ============================================================================
DROP POLICY IF EXISTS "announcements_super_admin_all" ON public.announcements;
CREATE POLICY "announcements_super_admin_all" ON public.announcements
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "announcements_tenant_read" ON public.announcements;
CREATE POLICY "announcements_tenant_read" ON public.announcements
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id());

DROP POLICY IF EXISTS "announcements_staff_write" ON public.announcements;
CREATE POLICY "announcements_staff_write" ON public.announcements
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'))
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'));

-- ============================================================================
-- Policies: homework
-- ============================================================================
DROP POLICY IF EXISTS "homework_super_admin_all" ON public.homework;
CREATE POLICY "homework_super_admin_all" ON public.homework
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "homework_tenant_read" ON public.homework;
CREATE POLICY "homework_tenant_read" ON public.homework
  FOR SELECT TO authenticated
  USING (school_id = public.auth_school_id());

DROP POLICY IF EXISTS "homework_teacher_write" ON public.homework;
CREATE POLICY "homework_teacher_write" ON public.homework
  FOR ALL TO authenticated
  USING (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'))
  WITH CHECK (school_id = public.auth_school_id() AND public.auth_user_role() IN ('principal', 'teacher'));

-- ============================================================================
-- Policies: homework_submissions
-- ============================================================================
DROP POLICY IF EXISTS "homework_sub_super_admin_all" ON public.homework_submissions;
CREATE POLICY "homework_sub_super_admin_all" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (public.auth_user_role() = 'super_admin');

DROP POLICY IF EXISTS "homework_sub_tenant_read" ON public.homework_submissions;
CREATE POLICY "homework_sub_tenant_read" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
      OR (public.auth_user_role() = 'parent' AND student_id IN (SELECT id FROM public.students WHERE guardian_profile_id = auth.uid()))
    )
  );

DROP POLICY IF EXISTS "homework_sub_write" ON public.homework_submissions;
CREATE POLICY "homework_sub_write" ON public.homework_submissions
  FOR ALL TO authenticated
  USING (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
    )
  )
  WITH CHECK (
    school_id = public.auth_school_id()
    AND (
      public.auth_user_role() IN ('principal', 'teacher')
      OR (public.auth_user_role() = 'student' AND student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
    )
  );
