-- Supabase schema + Row Level Security migration for TutorBridge
-- Do not execute until reviewed and approved.

-- 0) Enable UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Tutors table
CREATE TABLE tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subjects text[] DEFAULT '{}',
  bio text,
  availability jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','accepted','rejected')),
  created_at timestamptz DEFAULT now()
);

-- 2) Student requests table
CREATE TABLE student_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  grade_level text,
  subject text,
  availability jsonb,
  additional_info text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','assigned','closed')),
  created_at timestamptz DEFAULT now()
);

-- 3) Coordinators table
CREATE TABLE coordinators (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4) Assignments table
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES student_requests(id) ON DELETE CASCADE,
  tutor_id uuid REFERENCES tutors(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES coordinators(user_id),
  assigned_at timestamptz DEFAULT now(),
  notes text,
  CONSTRAINT one_assignment_per_request UNIQUE (request_id)
);

-- 5) Enable Row Level Security on all four tables
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 5a) Explicit table privileges for anon and authenticated roles
REVOKE ALL ON tutors FROM anon;
REVOKE ALL ON student_requests FROM anon;
REVOKE ALL ON coordinators FROM anon;
REVOKE ALL ON assignments FROM anon;
GRANT INSERT ON tutors TO anon;
GRANT INSERT ON student_requests TO anon;

REVOKE ALL ON tutors FROM authenticated;
REVOKE ALL ON student_requests FROM authenticated;
REVOKE ALL ON coordinators FROM authenticated;
REVOKE ALL ON assignments FROM authenticated;
GRANT SELECT, UPDATE ON tutors TO authenticated;
GRANT SELECT, UPDATE ON student_requests TO authenticated;
GRANT SELECT ON coordinators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO authenticated;

-- 6) Tutors policies
CREATE POLICY "Anon insert tutors" ON tutors
  FOR INSERT TO anon
  WITH CHECK (
    auth.role() = 'anon'
    AND status = 'pending'
    AND email IS NOT NULL
  );

CREATE POLICY "Coordinators select tutors" ON tutors
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

CREATE POLICY "Coordinators update tutors" ON tutors
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  )
  WITH CHECK (TRUE);

-- 7) Student requests policies
CREATE POLICY "Anon insert student_requests" ON student_requests
  FOR INSERT TO anon
  WITH CHECK (
    auth.role() = 'anon'
    AND status = 'pending'
    AND email IS NOT NULL
  );

CREATE POLICY "Coordinators select student_requests" ON student_requests
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

CREATE POLICY "Coordinators update student_requests" ON student_requests
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  )
  WITH CHECK (TRUE);

-- 8) Coordinators policies
CREATE POLICY "Select own coordinator row" ON coordinators
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies on coordinators to keep membership management admin-only.

-- 9) Assignments policies
CREATE POLICY "Coordinators select assignments" ON assignments
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

CREATE POLICY "Coordinators insert assignments" ON assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

CREATE POLICY "Coordinators update assignments" ON assignments
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND assigned_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

CREATE POLICY "Coordinators delete assignments" ON assignments
  FOR DELETE TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM coordinators
      WHERE coordinators.user_id = auth.uid()
        AND coordinators.is_active
    )
  );

-- 10) Notes
-- * Anonymous clients may only INSERT into tutors and student_requests.
-- * Coordinators may view and manage tutors and student_requests.
-- * Assignments are managed only by authenticated coordinators.
-- * The coordinators table is only readable by the coordinator user for their own row.
-- * assigned_at and created_at are database-generated timestamps and should not be set by client UI.
