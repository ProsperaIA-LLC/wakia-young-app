-- ============================================================
-- PROSPERA YOUNG AI — Migration 001
-- Run this in Supabase SQL Editor on your existing database.
-- Safe to run: uses IF NOT EXISTS, IF EXISTS, DROP IF EXISTS.
-- ============================================================


-- ============================================================
-- 1. FIX: reflections table
-- Add missing columns, remove legacy answer_q1/answer_q2
-- ============================================================

ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS cohort_id      uuid REFERENCES cohorts(id),
  ADD COLUMN IF NOT EXISTS q1             text,
  ADD COLUMN IF NOT EXISTS q2             text,
  ADD COLUMN IF NOT EXISTS q3             text,
  ADD COLUMN IF NOT EXISTS status         text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
  ADD COLUMN IF NOT EXISTS mentor_feedback text;

-- Remove legacy columns (safe — our code never reads them)
ALTER TABLE reflections
  DROP COLUMN IF EXISTS answer_q1,
  DROP COLUMN IF EXISTS answer_q2;


-- ============================================================
-- 2. FIX: deliverables status CHECK constraint
-- Add 'not_started' and 'draft' to allowed values
-- ============================================================

ALTER TABLE deliverables
  DROP CONSTRAINT IF EXISTS deliverables_status_check;

ALTER TABLE deliverables
  ADD CONSTRAINT deliverables_status_check
  CHECK (status IN ('not_started', 'draft', 'pending', 'submitted', 'reviewed'));


-- ============================================================
-- 3. FIX: cohort_overview view
-- Rename total_enrolled → total_students (matches Database type)
-- ============================================================

CREATE OR REPLACE VIEW cohort_overview AS
SELECT
  c.id           AS cohort_id,
  c.name         AS cohort_name,
  c.market,
  c.status,
  c.current_week,
  COUNT(DISTINCT e.user_id)                                                             AS total_students,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'active')                         AS active_students,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'dropped')                        AS dropped_students,
  COUNT(DISTINCT ma.id) FILTER (WHERE ma.is_resolved = false AND ma.severity = 'red')  AS red_alerts,
  COUNT(DISTINCT ma.id) FILTER (WHERE ma.is_resolved = false AND ma.severity = 'yellow') AS yellow_alerts
FROM cohorts c
LEFT JOIN enrollments e    ON e.cohort_id = c.id
LEFT JOIN mentor_alerts ma ON ma.cohort_id = c.id
GROUP BY c.id, c.name, c.market, c.status, c.current_week;


-- ============================================================
-- 4. FIX: missing RLS policies for pods, pod_members, weeks,
--         pod_summaries — students currently can't read their data
-- ============================================================

-- pods
CREATE POLICY pods_select_student ON pods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = auth.uid() AND e.cohort_id = pods.cohort_id
  ));

CREATE POLICY pods_select_mentor ON pods FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));

CREATE POLICY pods_all_mentor ON pods FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));

-- pod_members
CREATE POLICY pod_members_select_student ON pod_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pod_members pm
    WHERE pm.user_id = auth.uid() AND pm.pod_id = pod_members.pod_id
  ));

CREATE POLICY pod_members_select_mentor ON pod_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));

CREATE POLICY pod_members_all_mentor ON pod_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));

-- weeks
CREATE POLICY weeks_select_student ON weeks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.user_id = auth.uid() AND e.cohort_id = weeks.cohort_id
  ));

CREATE POLICY weeks_all_mentor ON weeks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));

-- pod_summaries
CREATE POLICY pod_summaries_insert_leader ON pod_summaries FOR INSERT
  WITH CHECK (auth.uid() = pod_leader_id);

CREATE POLICY pod_summaries_select_member ON pod_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pod_members pm
    WHERE pm.user_id = auth.uid() AND pm.pod_id = pod_summaries.pod_id
  ));

CREATE POLICY pod_summaries_select_mentor ON pod_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));


-- ============================================================
-- 5. FIX: mentors can write feedback on reflections
-- ============================================================

CREATE POLICY reflections_update_mentor ON reflections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));


-- ============================================================
-- 6. FIX: mentors can resolve alerts (UPDATE)
-- ============================================================

CREATE POLICY mentor_alerts_update ON mentor_alerts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
  ));


-- ============================================================
-- DONE ✓
-- ============================================================
