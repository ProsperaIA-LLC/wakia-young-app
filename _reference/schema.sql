-- ============================================================
-- PROSPERA YOUNG AI — Supabase SQL Schema
-- Version: 1.0 | March 2026
-- Instructions: Paste this entire file into the Supabase
-- SQL Editor and click "Run". Run in this exact order.
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  nickname        text,
  country         text,                        -- 'MX' | 'CO' | 'US' | 'AR' | 'PE' etc.
  role            text NOT NULL DEFAULT 'student', -- 'student' | 'mentor' | 'admin'
  avatar_url      text,
  timezone        text,                        -- e.g. 'America/Mexico_City'
  age             integer,
  parent_consent  boolean NOT NULL DEFAULT false, -- required for under 18
  market          text,                        -- 'LATAM' | 'USA'
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT users_role_check CHECK (role IN ('student', 'mentor', 'admin')),
  CONSTRAINT users_market_check CHECK (market IN ('LATAM', 'USA') OR market IS NULL)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Mentors can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 2. COHORTS
-- ============================================================

CREATE TABLE cohorts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,               -- e.g. 'Cohorte 1 — Mayo 2025'
  market          text NOT NULL,               -- 'LATAM' | 'USA'
  start_date      date NOT NULL,
  end_date        date NOT NULL,               -- start_date + 42 days (6 weeks)
  status          text NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'active' | 'completed'
  price_full_usd  numeric(10,2),               -- $297 LATAM / $797 USA
  price_early_usd numeric(10,2),               -- $197 LATAM / $497 USA
  max_students    integer NOT NULL DEFAULT 30,
  current_week    integer NOT NULL DEFAULT 0,  -- 0 = not started, 1-6 = active
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT cohorts_market_check CHECK (market IN ('LATAM', 'USA')),
  CONSTRAINT cohorts_status_check CHECK (status IN ('upcoming', 'active', 'completed')),
  CONSTRAINT cohorts_week_check CHECK (current_week BETWEEN 0 AND 6),
  CONSTRAINT cohorts_dates_check CHECK (end_date > start_date)
);

ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cohorts"
  ON cohorts FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify cohorts"
  ON cohorts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );


-- ============================================================
-- 3. ENROLLMENTS
-- ============================================================

CREATE TABLE enrollments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id           uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  market              text NOT NULL,           -- 'LATAM' | 'USA'
  price_paid_usd      numeric(10,2) DEFAULT 0,
  is_scholarship      boolean NOT NULL DEFAULT false,
  stripe_payment_id   text,
  stripe_customer_id  text,
  status              text NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'dropped'
  enrolled_at         timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz,

  UNIQUE (user_id, cohort_id),
  CONSTRAINT enrollments_market_check CHECK (market IN ('LATAM', 'USA')),
  CONSTRAINT enrollments_status_check CHECK (status IN ('active', 'completed', 'dropped'))
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their own enrollment"
  ON enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can read all enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 4. PODS
-- ============================================================

CREATE TABLE pods (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id           uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  name                text NOT NULL,           -- e.g. 'Pod Norteño'
  timezone_region     text,                    -- e.g. 'GMT-6 to GMT-5'
  discord_channel_url text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read pods in their cohort"
  ON pods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = auth.uid() AND e.cohort_id = pods.cohort_id
    )
  );

CREATE POLICY "Mentors can read all pods"
  ON pods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

CREATE POLICY "Admins can manage pods"
  ON pods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 5. POD MEMBERS
-- ============================================================

CREATE TABLE pod_members (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id                    uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  user_id                   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id                 uuid NOT NULL REFERENCES cohorts(id),
  buddy_id                  uuid REFERENCES users(id),     -- assigned buddy
  is_pod_leader_this_week   boolean NOT NULL DEFAULT false,
  pod_leader_week_number    integer,                       -- which week they are leading
  joined_at                 timestamptz NOT NULL DEFAULT now(),

  UNIQUE (pod_id, user_id)
);

ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read pod members in their pod"
  ON pod_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pod_members pm
      WHERE pm.user_id = auth.uid() AND pm.pod_id = pod_members.pod_id
    )
  );

CREATE POLICY "Mentors can read all pod members"
  ON pod_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

CREATE POLICY "Admins can manage pod members"
  ON pod_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 6. WEEKS (program content per cohort)
-- ============================================================

CREATE TABLE weeks (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id                 uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number               integer NOT NULL,  -- 1 through 6
  phase                     text NOT NULL,     -- 'Despertar' | 'Construir' | 'Lanzar'
  title                     text NOT NULL,     -- e.g. 'El problema que te duele'
  opening_question          text NOT NULL,     -- Finnish fenómeno de apertura
  deliverable_description   text NOT NULL,     -- what to submit
  success_signal            text NOT NULL,     -- how student knows they're done
  reflection_q1             text NOT NULL,     -- Finnish reflection question 1
  reflection_q2             text NOT NULL,     -- Finnish reflection question 2
  tools                     text[],            -- e.g. ARRAY['Claude', 'Glide']
  mentor_video_url          text,              -- Loom video URL
  notion_guide_url          text,              -- Technical guide link
  unlock_date               date NOT NULL,     -- Monday of that week
  due_date                  date NOT NULL,     -- Sunday of that week
  created_at                timestamptz NOT NULL DEFAULT now(),

  UNIQUE (cohort_id, week_number),
  CONSTRAINT weeks_phase_check CHECK (phase IN ('Despertar', 'Construir', 'Lanzar')),
  CONSTRAINT weeks_number_check CHECK (week_number BETWEEN 1 AND 6)
);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read weeks in their cohort"
  ON weeks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.user_id = auth.uid() AND e.cohort_id = weeks.cohort_id
    )
  );

CREATE POLICY "Mentors can manage weeks"
  ON weeks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 7. DELIVERABLES
-- ============================================================

CREATE TABLE deliverables (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_id           uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  cohort_id         uuid NOT NULL REFERENCES cohorts(id),
  content           text,                      -- free text or URL
  status            text NOT NULL DEFAULT 'pending', -- 'pending' | 'submitted' | 'reviewed'
  mentor_feedback   text,
  buddy_feedback    text,
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_id),
  CONSTRAINT deliverables_status_check CHECK (status IN ('not_started', 'draft', 'pending', 'submitted', 'reviewed'))
);

CREATE TRIGGER deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own deliverables"
  ON deliverables FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Buddies can read pod deliverables"
  ON deliverables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pod_members pm
      WHERE pm.buddy_id = auth.uid()
        AND pm.user_id = deliverables.user_id
    )
  );

CREATE POLICY "Mentors can read and update all deliverables"
  ON deliverables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 8. REFLECTIONS (Finnish method — Sunday only)
-- ============================================================

CREATE TABLE reflections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_id           uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  cohort_id         uuid REFERENCES cohorts(id),
  deliverable_id    uuid REFERENCES deliverables(id),
  q1                text,                      -- '¿Qué aprendiste esta semana?'
  q2                text,                      -- '¿Dónde te bloqueaste?'
  q3                text,                      -- '¿Qué harías diferente?'
  status            text DEFAULT 'draft',      -- 'draft' | 'submitted'
  mentor_feedback   text,
  submitted_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_id),
  CONSTRAINT reflections_status_check CHECK (status IN ('draft', 'submitted'))
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their own reflections"
  ON reflections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can read all reflections"
  ON reflections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

CREATE POLICY "Mentors can write feedback on reflections"
  ON reflections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

-- Function: enforce Sunday-only rule at DB level
CREATE OR REPLACE FUNCTION check_reflection_is_sunday()
RETURNS TRIGGER AS $$
BEGIN
  -- EXTRACT DOW: 0=Sunday, 1=Monday ... 6=Saturday
  IF EXTRACT(DOW FROM now()) != 0 THEN
    RAISE EXCEPTION 'Reflections can only be submitted on Sundays';
  END IF;
  -- Must have submitted deliverable first (submitted OR reviewed both count)
  IF NOT EXISTS (
    SELECT 1 FROM deliverables d
    WHERE d.user_id = NEW.user_id
      AND d.week_id = NEW.week_id
      AND d.status IN ('submitted', 'reviewed')
  ) THEN
    RAISE EXCEPTION 'You must submit your deliverable before reflecting';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reflections_sunday_check
  BEFORE INSERT ON reflections
  FOR EACH ROW EXECUTE FUNCTION check_reflection_is_sunday();


-- ============================================================
-- 9. CHAT MESSAGES (Próspero AI tutor history)
-- ============================================================

CREATE TABLE chat_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id     uuid REFERENCES cohorts(id),
  week_id       uuid REFERENCES weeks(id),
  role          text NOT NULL,               -- 'user' | 'assistant'
  content       text NOT NULL,
  tokens_used   integer,                     -- track API usage
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chat_role_check CHECK (role IN ('user', 'assistant'))
);

-- Index for fast history retrieval
CREATE INDEX chat_messages_user_week_idx
  ON chat_messages (user_id, week_id, created_at DESC);

-- Index for daily count guardrail
CREATE INDEX chat_messages_user_date_idx
  ON chat_messages (user_id, DATE(created_at));

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their own chat history"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert their own messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Mentors can read all chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

-- Function: get daily message count for a user (used in /api/chat)
CREATE OR REPLACE FUNCTION get_daily_message_count(p_user_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM chat_messages
  WHERE user_id = p_user_id
    AND role = 'user'
    AND DATE(created_at) = CURRENT_DATE;
$$ LANGUAGE sql STABLE;


-- ============================================================
-- 10. ACTIVITY LOG (inactivity detection)
-- ============================================================

CREATE TABLE activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id   uuid REFERENCES cohorts(id),
  action      text NOT NULL,
  -- 'login' | 'deliverable_submitted' | 'chat_message' |
  -- 'reflection_submitted' | 'pod_checkin' | 'video_viewed'
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT activity_action_check CHECK (
    action IN (
      'login', 'deliverable_submitted', 'chat_message',
      'reflection_submitted', 'pod_checkin', 'video_viewed',
      'buddy_message_sent'
    )
  )
);

-- Index for inactivity detection queries
CREATE INDEX activity_log_user_created_idx
  ON activity_log (user_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can read their own activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Mentors can read all activity"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );

-- Function: get hours since last activity for a user
CREATE OR REPLACE FUNCTION hours_since_last_activity(p_user_id uuid)
RETURNS numeric AS $$
  SELECT EXTRACT(EPOCH FROM (now() - MAX(created_at))) / 3600
  FROM activity_log
  WHERE user_id = p_user_id;
$$ LANGUAGE sql STABLE;


-- ============================================================
-- 11. MENTOR ALERTS (auto-generated by triggers)
-- ============================================================

CREATE TABLE mentor_alerts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cohort_id     uuid NOT NULL REFERENCES cohorts(id),
  alert_type    text NOT NULL,
  -- 'inactive_48h' | 'inactive_72h' | 'no_deliverable' | 'buddy_no_response'
  severity      text NOT NULL DEFAULT 'yellow', -- 'yellow' | 'red'
  message       text,
  is_resolved   boolean NOT NULL DEFAULT false,
  resolved_by   uuid REFERENCES users(id),
  resolved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT alert_type_check CHECK (
    alert_type IN ('inactive_48h', 'inactive_72h', 'no_deliverable', 'buddy_no_response')
  ),
  CONSTRAINT alert_severity_check CHECK (severity IN ('yellow', 'red'))
);

ALTER TABLE mentor_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage all alerts"
  ON mentor_alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 12. MENTOR NOTES (private per student)
-- ============================================================

CREATE TABLE mentor_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id   uuid NOT NULL REFERENCES users(id),
  student_id  uuid NOT NULL REFERENCES users(id),
  cohort_id   uuid NOT NULL REFERENCES cohorts(id),
  note        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can manage their own notes"
  ON mentor_notes FOR ALL
  USING (auth.uid() = mentor_id);


-- ============================================================
-- 13. POD LEADER SUMMARIES (weekly Friday summaries)
-- ============================================================

CREATE TABLE pod_summaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id          uuid NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  cohort_id       uuid NOT NULL REFERENCES cohorts(id),
  week_number     integer NOT NULL,
  pod_leader_id   uuid NOT NULL REFERENCES users(id),
  summary_text    text NOT NULL,             -- 3 lines max
  submitted_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (pod_id, week_number)
);

ALTER TABLE pod_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pod leaders can insert summaries for their pod"
  ON pod_summaries FOR INSERT
  WITH CHECK (auth.uid() = pod_leader_id);

CREATE POLICY "Pod members can read their pod summaries"
  ON pod_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pod_members pm
      WHERE pm.user_id = auth.uid() AND pm.pod_id = pod_summaries.pod_id
    )
  );

CREATE POLICY "Mentors can read all summaries"
  ON pod_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 14. SCHOLARSHIP APPLICATIONS
-- ============================================================

CREATE TABLE scholarship_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id           uuid REFERENCES cohorts(id),             -- nullable: assigned by mentor after review
  applicant_name      text NOT NULL,
  applicant_email     text NOT NULL,
  applicant_age       integer NOT NULL,
  applicant_country   text NOT NULL,
  motivation_letter   text NOT NULL,
  video_url           text,                  -- 60-sec video URL
  reference_name      text,
  reference_contact   text,
  status              text NOT NULL DEFAULT 'pending',
  -- 'pending' | 'approved' | 'rejected'
  reviewed_by         uuid REFERENCES users(id),
  reviewed_at         timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT scholarship_status_check
    CHECK (status IN ('pending', 'approved', 'rejected'))
);

ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a scholarship application"
  ON scholarship_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage scholarship applications"
  ON scholarship_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('mentor', 'admin')
    )
  );


-- ============================================================
-- 15. USEFUL VIEWS (for mentor dashboard queries)
-- ============================================================

-- View: cohort overview for mentor dashboard
CREATE OR REPLACE VIEW cohort_overview AS
SELECT
  c.id AS cohort_id,
  c.name AS cohort_name,
  c.market,
  c.status,
  c.current_week,
  COUNT(DISTINCT e.user_id) AS total_students,
  COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.user_id END) AS active_students,
  COUNT(DISTINCT CASE WHEN e.status = 'dropped' THEN e.user_id END) AS dropped_students,
  COUNT(DISTINCT CASE WHEN ma.severity = 'red' AND NOT ma.is_resolved THEN ma.student_id END) AS red_alerts,
  COUNT(DISTINCT CASE WHEN ma.severity = 'yellow' AND NOT ma.is_resolved THEN ma.student_id END) AS yellow_alerts
FROM cohorts c
LEFT JOIN enrollments e ON e.cohort_id = c.id
LEFT JOIN mentor_alerts ma ON ma.cohort_id = c.id
GROUP BY c.id, c.name, c.market, c.status, c.current_week;

-- View: student progress for mentor panel
CREATE OR REPLACE VIEW student_progress AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.nickname,
  u.country,
  e.cohort_id,
  e.status AS enrollment_status,
  pm.pod_id,
  p.name AS pod_name,
  pm.buddy_id,
  pm.is_pod_leader_this_week,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'submitted') AS deliverables_submitted,
  COUNT(DISTINCT r.id) AS reflections_submitted,
  MAX(al.created_at) AS last_activity_at,
  EXTRACT(EPOCH FROM (now() - MAX(al.created_at))) / 3600 AS hours_since_activity,
  COUNT(DISTINCT ma.id) FILTER (WHERE NOT ma.is_resolved) AS open_alerts
FROM users u
JOIN enrollments e ON e.user_id = u.id
LEFT JOIN pod_members pm ON pm.user_id = u.id AND pm.cohort_id = e.cohort_id
LEFT JOIN pods p ON p.id = pm.pod_id
LEFT JOIN deliverables d ON d.user_id = u.id AND d.cohort_id = e.cohort_id
LEFT JOIN reflections r ON r.user_id = u.id
LEFT JOIN activity_log al ON al.user_id = u.id AND al.cohort_id = e.cohort_id
LEFT JOIN mentor_alerts ma ON ma.student_id = u.id AND ma.cohort_id = e.cohort_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name, u.nickname, u.country,
         e.cohort_id, e.status, pm.pod_id, p.name,
         pm.buddy_id, pm.is_pod_leader_this_week;


-- ============================================================
-- 16. SEED DATA — Week content for a cohort
-- (Run after creating your first cohort and getting its ID)
-- Replace 'YOUR_COHORT_ID' with the actual cohort UUID
-- ============================================================

-- Week 1: El problema que te duele
-- INSERT INTO weeks (cohort_id, week_number, phase, title, opening_question,
--   deliverable_description, success_signal, reflection_q1, reflection_q2,
--   tools, unlock_date, due_date)
-- VALUES (
--   'YOUR_COHORT_ID', 1, 'Despertar',
--   'El problema que te duele',
--   '¿Por qué hay problemas que llevan años sin resolverse en tu escuela, tu barrio o tu familia, aunque todos los saben y a nadie le gusta?',
--   '3 evidencias externas de que el problema existe (entrevistas grabadas o transcritas con personas reales)',
--   'Al menos 1 persona que no te conoce confirmó tener ese problema.',
--   '¿Qué me sorprendió de lo que dijeron las personas con las que hablé esta semana?',
--   '¿Qué suposición mía resultó falsa esta semana?',
--   ARRAY['Claude (análisis de entrevistas)', 'Notion o doc compartido', 'Grabador del teléfono'],
--   'YOUR_START_DATE',        -- Monday of week 1
--   'YOUR_START_DATE' + 6     -- Sunday of week 1
-- );

-- (Repeat for weeks 2-6 following the same pattern)
-- See CONTEXT.md section 5 for all week content


-- ============================================================
-- 17. REALTIME (enable for live dashboard updates)
-- ============================================================

-- Enable realtime on tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE mentor_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE pod_summaries;


-- ============================================================
-- 18. STORAGE BUCKETS
-- (Run these in Supabase Dashboard > Storage, not SQL editor)
-- ============================================================

-- Bucket: avatars (student profile pictures)
-- Bucket: deliverable-attachments (files attached to deliverables)
-- Bucket: scholarship-videos (60-sec scholarship application videos)
-- Bucket: certificates (generated PDF certificates)
-- All buckets: public = false, except avatars = public


-- ============================================================
-- DONE ✓
-- Tables created: 14
-- Views created: 2
-- Functions created: 3
-- Triggers created: 3
-- RLS enabled: all tables
--
-- Next step: Go to Authentication > URL Configuration
-- and add your app URL to the allowed redirect URLs.
-- ============================================================
