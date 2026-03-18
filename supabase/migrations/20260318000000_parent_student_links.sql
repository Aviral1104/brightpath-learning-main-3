-- ================================================================
-- Parent-Student Linking + Sample Credentials Migration
-- ================================================================
-- This migration:
--   1. Adds a parent_student_links table to associate parents with students
--   2. Establishes RLS so parents only see THEIR child's data
--   3. Provides sample INSERT statements for three student-parent pairs
-- ================================================================

-- ── Parent-Student link table ──────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Parents can read their own links
CREATE POLICY "Parents can view own child links"
  ON public.parent_student_links FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id);

-- Only service role / admin can insert links (done via this migration or admin UI)
CREATE POLICY "Service role can manage links"
  ON public.parent_student_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Helper: get child student_id for authenticated parent ──
CREATE OR REPLACE FUNCTION public.get_child_id(_parent_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT student_id FROM public.parent_student_links
  WHERE parent_id = _parent_id
  LIMIT 1;
$$;

-- ── SAMPLE CREDENTIALS ──────────────────────────────────
-- Register these three pairs via the Auth page (Sign Up).
-- After signup, the trigger creates their profiles/roles.
-- Then run the INSERT block below (in Supabase SQL editor) 
-- replacing the UUIDs with the actual auth.users IDs created during signup.
--
-- PAIR 1 ─ Student "Alex Carter" / Parent "Morgan Carter"
--   Student  → email: alex.carter@brightpath.edu   / password: BrightPath@2025
--   Parent   → email: morgan.carter@brightpath.edu / password: BrightPath@2025
--
-- PAIR 2 ─ Student "Priya Sharma" / Parent "Rajan Sharma"
--   Student  → email: priya.sharma@brightpath.edu  / password: BrightPath@2025
--   Parent   → email: rajan.sharma@brightpath.edu  / password: BrightPath@2025
--
-- PAIR 3 ─ Student "Liam Nguyen" / Parent "Hoa Nguyen"
--   Student  → email: liam.nguyen@brightpath.edu   / password: BrightPath@2025
--   Parent   → email: hoa.nguyen@brightpath.edu    / password: BrightPath@2025
--
-- Teacher account (create courses, assignments, feedback):
--   Teacher  → email: dr.johnson@brightpath.edu    / password: BrightPath@2025
-- ─────────────────────────────────────────────────────────

-- After signing up all users, look up their IDs and link them:
-- (Supabase SQL Editor — replace UUIDs accordingly)
--
-- INSERT INTO public.parent_student_links (parent_id, student_id) VALUES
--   ('<morgan_carter_user_id>',  '<alex_carter_user_id>'),
--   ('<rajan_sharma_user_id>',   '<priya_sharma_user_id>'),
--   ('<hoa_nguyen_user_id>',     '<liam_nguyen_user_id>');

-- ── Updated submissions RLS for parents ────────────────
-- Allow parents to SELECT submissions belonging to their linked child
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'submissions'
  ) THEN
    -- Drop existing catch-all parent policy if it exists
    DROP POLICY IF EXISTS "Parents can view child submissions" ON public.submissions;

    CREATE POLICY "Parents can view child submissions"
      ON public.submissions FOR SELECT
      TO authenticated
      USING (
        -- student can always see own submissions
        auth.uid() = student_id
        OR
        -- parent can see submissions of their linked child
        student_id = (SELECT public.get_child_id(auth.uid()))
      );
  END IF;
END $$;
