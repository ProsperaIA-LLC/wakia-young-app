-- ============================================================
-- Fix recursive RLS on public.users
-- The original users_select_mentor policy queries public.users
-- from within a policy on public.users → infinite recursion → 500.
-- Solution: security-definer function that bypasses RLS to read role.
-- ============================================================

-- Helper function: reads the role of the current user bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Re-create the recursive policy using the helper instead
DROP POLICY IF EXISTS "users_select_mentor" ON public.users;
CREATE POLICY "users_select_mentor" ON public.users FOR SELECT
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- Apply the same fix to all other policies that query public.users recursively

-- pod_members
DROP POLICY IF EXISTS "pod_members_select" ON public.pod_members;
CREATE POLICY "pod_members_select" ON public.pod_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.cohort_id = pod_members.cohort_id AND e.user_id = auth.uid()
    )
    OR public.get_my_role() IN ('mentor', 'admin')
  );

-- weeks
DROP POLICY IF EXISTS "weeks_select" ON public.weeks;
CREATE POLICY "weeks_select" ON public.weeks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.cohort_id = weeks.cohort_id AND e.user_id = auth.uid()
    )
    OR public.get_my_role() IN ('mentor', 'admin')
  );

-- deliverables
DROP POLICY IF EXISTS "deliverables_select_mentor" ON public.deliverables;
CREATE POLICY "deliverables_select_mentor" ON public.deliverables FOR SELECT
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- reflections
DROP POLICY IF EXISTS "reflections_select_mentor" ON public.reflections;
CREATE POLICY "reflections_select_mentor" ON public.reflections FOR SELECT
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- activity_log
DROP POLICY IF EXISTS "activity_log_select_mentor" ON public.activity_log;
CREATE POLICY "activity_log_select_mentor" ON public.activity_log FOR SELECT
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- mentor_alerts
DROP POLICY IF EXISTS "mentor_alerts_mentor" ON public.mentor_alerts;
CREATE POLICY "mentor_alerts_mentor" ON public.mentor_alerts FOR ALL
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- mentor_notes
DROP POLICY IF EXISTS "mentor_notes_mentor" ON public.mentor_notes;
CREATE POLICY "mentor_notes_mentor" ON public.mentor_notes FOR ALL
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- enrollments
DROP POLICY IF EXISTS "enrollments_select_mentor" ON public.enrollments;
CREATE POLICY "enrollments_select_mentor" ON public.enrollments FOR SELECT
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- competency_scores
DROP POLICY IF EXISTS "competency_mentor" ON public.competency_scores;
CREATE POLICY "competency_mentor" ON public.competency_scores FOR ALL
  USING (public.get_my_role() IN ('mentor', 'admin'));

-- cohorts write
DROP POLICY IF EXISTS "cohorts_write_admin" ON public.cohorts;
CREATE POLICY "cohorts_write_admin" ON public.cohorts FOR ALL
  USING (public.get_my_role() = 'admin');

-- scholarship select admin
DROP POLICY IF EXISTS "scholarship_select_admin" ON public.scholarship_applications;
CREATE POLICY "scholarship_select_admin" ON public.scholarship_applications FOR SELECT
  USING (public.get_my_role() = 'admin');
