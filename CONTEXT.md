# CONTEXT.md — Wakia Young Platform
> Load this file at the start of every Claude Code session.
> This is the single source of truth for the entire project.

---

## 1. WHAT WE ARE BUILDING

**Wakia Young** is an intensive 6-week virtual program for Latino students aged 14–18 (in LATAM and the US) where they build real AI-powered products from day one. The platform supports the full learning experience: weekly challenges, deliverables, peer accountability (pods), an AI tutor (Luna), and mentor oversight.

**Two user types:**
- **Students** — complete weekly challenges, submit deliverables, chat with Luna, interact with their pod
- **Mentors** — monitor cohort progress, run weekly live sessions, flag at-risk students

---

## 2. TECH STACK

```
Framework:     Next.js 16 (App Router) + TypeScript
Styling:       Tailwind CSS v4
Database:      Supabase (Postgres + Auth + Realtime)
Auth:          Supabase Auth — magic link only (no passwords)
AI Tutor:      Anthropic SDK (@anthropic-ai/sdk) — claude-sonnet-4-6
Payments:      Stripe (already installed)
PDF:           jsPDF (certificates)
Deployment:    Vercel
Repo:          GitHub
```

---

## 3. BRAND & DESIGN SYSTEM

### Color Palette (CSS variables — defined in globals.css)
```css
--navy:     #0E2A47   /* sidebar, hero banners, dark backgrounds */
--navy2:    #163857   /* secondary dark surfaces */
--teal:     #008ca5   /* links, progress bars, info states */
--teal-l:   #e0f4f8   /* teal light background */
--green:    #00c896   /* PRIMARY ACTION — buttons, success, CTA */
--green-d:  #00a87a   /* green hover/dark */
--green-l:  #d6faf2   /* green light background */
--gold:     #e0a326   /* streaks, achievements, highlights */
--gold-l:   #fef3d7   /* gold light background */
--coral:    #ff5c35   /* urgency, deadlines, alerts, pending */
--coral-l:  #ffede8   /* coral light background */
--magenta:  #a5086b   /* Luna AI tutor, mentor identity */
--mag-l:    #fce8f4   /* magenta light background */
--ink:      #111110   /* primary text */
--ink2:     #3a3936   /* secondary text */
--ink3:     #8a8884   /* muted text, labels */
--ink4:     #c5c2bb   /* placeholder text, disabled */
--bg:       #f5f4f0   /* page background */
--bg2:      #ebebE4   /* secondary background, input fields */
--white:    #ffffff   /* cards, surfaces */
--border:   rgba(17,17,16,0.08)  /* default borders */
```

### Color Semantics (NEVER mix these up)
- `--green` → any action the student takes (submit, build, succeed)
- `--coral` → urgency, deadlines, missing activity
- `--gold` → streak, achievements, Pod Leader status
- `--teal` → information, navigation, links
- `--magenta` → anything related to Luna AI or mentors
- `--navy` → structural backgrounds (sidebar, banners)

### Typography
- Font: system font stack (`-apple-system, 'Segoe UI', system-ui, sans-serif`)
- Base size: 15px
- Headings: font-weight 800
- Body: font-weight 400–500
- Labels/badges: font-weight 700, uppercase, letter-spacing 0.06em

### Spacing & Radius
- Card border-radius: 16px
- Button border-radius: 10px
- Badge border-radius: 20px (pill)
- Standard gap: 12px–14px between cards
- Card padding: 18px–20px

---

## 4. DATABASE SCHEMA

### Key concepts to understand before reading tables:
- A **cohort** is one run of the 6-week program (e.g. "Cohorte 1 — Mayo 2025")
- A **pod** is a group of 4–5 students within a cohort, grouped by timezone
- A **buddy** is a paired student within a pod for daily accountability
- A **Pod Leader** rotates weekly — one student per pod facilitates that week
- **Deliverables** are submitted once per week per student
- **Reflections** are 2 questions (Finnish method) unlocked only on Sundays

### Tables

```sql
-- Users (students and mentors)
users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  nickname text,                          -- display name, e.g. "Valentina"
  country text,                           -- "MX", "CO", "US", etc.
  role text DEFAULT 'student',            -- 'student' | 'mentor'
  avatar_url text,
  timezone text,                          -- e.g. "America/Mexico_City"
  age integer,
  parent_consent boolean DEFAULT false,   -- required for under 18
  created_at timestamptz DEFAULT now()
)

-- Cohorts (one run of the 6-week program)
cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                     -- e.g. "Cohorte 1 — Mayo 2025"
  market text NOT NULL,                   -- 'LATAM' | 'USA'
  start_date date NOT NULL,
  end_date date NOT NULL,                 -- start_date + 42 days
  status text DEFAULT 'upcoming',        -- 'upcoming' | 'active' | 'completed'
  price_usd numeric(10,2),
  max_students integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
)

-- Pods (groups of 4-5 students per cohort)
pods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE,
  name text NOT NULL,                     -- e.g. "Pod Norteño"
  timezone_region text,                  -- e.g. "GMT-6 to GMT-5"
  discord_channel_url text,
  created_at timestamptz DEFAULT now()
)

-- Pod members (students assigned to pods)
pod_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id uuid REFERENCES pods(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id),
  buddy_id uuid REFERENCES users(id),    -- assigned buddy (nullable)
  is_pod_leader_this_week boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(pod_id, user_id)
)

-- Weeks (6 weeks of content per cohort)
weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE,
  week_number integer NOT NULL,           -- 1 through 6
  phase text NOT NULL,                    -- 'Despertar' | 'Construir' | 'Lanzar'
  title text NOT NULL,                    -- e.g. "El problema que te duele"
  opening_question text NOT NULL,        -- the Finnish "fenómeno de apertura"
  deliverable_description text NOT NULL,
  success_signal text NOT NULL,          -- how student knows they're done
  reflection_q1 text NOT NULL,           -- Finnish reflection question 1
  reflection_q2 text NOT NULL,           -- Finnish reflection question 2
  tools text[],                          -- e.g. ["Claude", "Glide", "n8n"]
  unlock_date date NOT NULL,             -- Monday of that week
  due_date date NOT NULL,                -- Sunday of that week
  created_at timestamptz DEFAULT now()
)

-- Deliverables (one per student per week)
deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_id uuid REFERENCES weeks(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id),
  content text,                          -- free text or URL
  status text DEFAULT 'pending',         -- 'pending' | 'submitted' | 'reviewed'
  submitted_at timestamptz,
  mentor_feedback text,
  buddy_feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_id)
)

-- Reflections (unlocked Sunday only, tied to deliverable)
reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  week_id uuid REFERENCES weeks(id) ON DELETE CASCADE,
  deliverable_id uuid REFERENCES deliverables(id),
  answer_q1 text,                        -- "Lo que aprendí esta semana fue..."
  answer_q2 text,                        -- "La semana que viene cambio..."
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_id)
)

-- Chat messages (Luna AI tutor history)
chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id),
  week_id uuid REFERENCES weeks(id),    -- context: which week
  role text NOT NULL,                    -- 'user' | 'assistant'
  content text NOT NULL,
  daily_count integer DEFAULT 0,        -- guardrail: max 3 per topic per day
  created_at timestamptz DEFAULT now()
)

-- Activity log (for detecting inactive students)
activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id),
  action text NOT NULL,                  -- 'login' | 'deliverable_submitted' | 'chat' | 'reflection'
  metadata jsonb,
  created_at timestamptz DEFAULT now()
)

-- Mentor notes (private notes per student)
mentor_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES users(id),
  student_id uuid REFERENCES users(id),
  cohort_id uuid REFERENCES cohorts(id),
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Enrollments (student registered in a cohort)
enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES cohorts(id) ON DELETE CASCADE,
  market text NOT NULL,                  -- 'LATAM' | 'USA'
  price_paid_usd numeric(10,2),
  is_scholarship boolean DEFAULT false,
  stripe_payment_id text,
  status text DEFAULT 'active',          -- 'active' | 'completed' | 'dropped'
  enrolled_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cohort_id)
)
```

---

## 5. PROGRAM STRUCTURE (6 weeks)

```
PHASE 1 — DESPERTAR (Weeks 1–2)
  Week 1: "El problema que te duele"
    → Student identifies a real problem through 3 external conversations
    → Deliverable: 3 external evidences the problem exists
    → Signal: At least 1 person who doesn't know them confirmed the problem
    → Tools: Claude (interview analysis), Notion

  Week 2: "IA como forma de pensar"
    → 30-min challenge: solve your problem with AI right now (fail fast)
    → Learn prompting from the failure, not from theory
    → Deliverable: Personal library of 5 pod-validated prompts
    → Signal: Each prompt has a name, use case, tested by at least one peer
    → Tools: Claude, ChatGPT

PHASE 2 — CONSTRUIR (Weeks 3–5)
  Week 3: "Algo real en 5 días"
    → Build a functional prototype (MVP)
    → Deliverable: Functional prototype — a stranger completes the flow alone
    → Signal: Buddy completed the main flow without any instructions
    → Tools: Claude Code, Glide

  Week 4: "Las 3 preguntas del negocio"
    → Who pays? How much? Why me over doing nothing?
    → Deliverable: 1-page business model + 2 real prices confirmed externally
    → Signal: 2 people who don't know them said a number when asked price
    → Tools: Claude (model analysis), WhatsApp for price experiment

  Week 5: "Agentes que trabajan mientras dormís"
    → Map repetitive tasks → build first n8n/Make agent
    → Deliverable: Working agent that saves 30+ min/week on their project
    → Signal: Agent ran without manual intervention at least 3 times
    → Tools: n8n or Make, Claude as agent brain

PHASE 3 — LANZAR (Week 6)
  Week 6: "Demo Day: tu primer hito público"
    → Build 5-min pitch (30s problem + 60s demo + 60s evidence + 60s model + 30s next steps)
    → Deliverable: Recorded pitch + published product link + 30-day public commitment
    → Signal: Product link works and a stranger can use it without instructions right now
    → Tools: Claude (pitch prep), Loom
```

---

## 6. WEEKLY RHYTHM (for every week)

```
Monday      → Week challenge activates (video + opening question unlocks in app)
             → Student sends buddy a message: "My plan this week is..."
Tue–Thu     → Individual work + async pod channel activity
Wednesday   → Buddy mid-week check: "How are you going?"
Friday      → Pod check-in: 20-min voice call (NO mentors) — each member shows something real
             → Pod Leader sends 3-line summary to mentor channel
Saturday    → Full cohort live session (60–75 min):
               5 min: emotional check-in ("how did you arrive today?")
               15 min: real LATAM case study
               30 min: spotlight (2–3 student projects, mentor acts as unknown user)
               15 min: next week intro question (leaves curiosity open)
               10 min: Q&A
Sunday      → Student submits deliverable in app
             → Finnish reflection questions unlock (ONLY on Sundays)
             → Buddy leaves first feedback comment
```

---

## 7. POD & BUDDY SYSTEM

```
Cohort size:     20–30 students
Pod size:        4–5 students per pod
Pod grouping:    By timezone (max 2hr difference within a pod)
Buddy:           1 assigned partner within the pod
Pod Leader:      Rotates weekly — facilitates Friday check-in + sends mentor summary

Pod Leader duties:
  - Schedule Friday 20-min check-in
  - Remind buddies of daily check-in
  - Write 3-line pod summary on Sunday
  - Escalate blockers to mentor if needed

Buddy duties:
  - Daily async message (2 lines max)
  - First feedback on Sunday deliverable
  - Alert Pod Leader if no response in 48hrs
  - Celebrate wins, not just problems

Dropout prevention triggers (app alerts mentor automatically):
  - Student hasn't logged in for 48 hours → yellow alert on mentor panel
  - Student hasn't submitted deliverable by Saturday → red alert
  - Buddy hasn't responded to 2 consecutive messages → Pod Leader notified
```

---

## 8. LUNA AI TUTOR

```
Model:          claude-sonnet-4-6
API route:      /api/chat (POST)
Auth:           Supabase session (never expose API key to client)

System prompt core identity:
  - Name: Luna
  - Role: AI tutor for Wakia Young program
  - Language: Spanish, voseo latinoamericano (vos, tenés, podés)
  - Tone: warm, direct, Gen Z friendly — NOT corporate
  - Response length: max 3–4 sentences or short bullets
  - Method: Socratic — guide with questions, never do the work for them
  - Always connects answer to the current week's deliverable
  - Knows student name, country, pod, current week, buddy name

Guardrails (enforced in database, NOT just frontend):
  - Max 3 queries per day on the same topic (tracked in chat_messages)
  - Never substitute for real user validation
  - Always asks for independent verification
  - Never advises on mental health — escalates to mentor
  - If student mentions feeling overwhelmed/sad/anxious → flag to mentor

Context passed with every message:
  - student name, country, pod name
  - current week number and title
  - current deliverable and success signal
  - buddy name
  - tools for this week
```

---

## 9. EVALUATION SYSTEM (NO final exam)

```
4 continuous competencies (scale 0–4):

1. VALIDATION (Weeks 1–2)
   Rubric: Is your problem REAL according to external validation?
   High (4): 3+ interviews, clear problem, triangulated evidence

2. CREATION (Weeks 3–5)
   Rubric: Did you build something that works?
   High (4): MVP iterated 2+ times, 5–7 documented external users

3. COMMUNICATION (Week 6)
   Rubric: Can you tell your story well?
   High (4): Clear pitch, live product online, demo executed

4. GROWTH (All weeks)
   Rubric: Did you learn about yourself as a problem-solver?
   High (4): Deep emotional reflections, identity shift documented

Certificate awarded when:
  - 100% attendance at live sessions
  - All 6 weekly deliverables submitted
  - Average 3.0+ across 4 competencies
  - Presented at Demo Day
  - FGU certification backing
```

---

## 10. FILE STRUCTURE

```
/app
  /api
    /chat          → Luna AI tutor endpoint
    /webhooks      → Stripe webhooks
  /(auth)
    /login         → Magic link login
    /register      → Student registration + parent consent
    /onboarding    → 3-step onboarding after first login
  /(student)
    /dashboard     → Main student dashboard (week view)
    /deliverables  → Submit deliverable + reflection
    /pod           → Pod view + buddy system
    /diary         → All past reflections (Finnish learning journal)
    /project       → Student's project page
  /(mentor)
    /dashboard     → Cohort overview + alerts
    /students/[id] → Individual student view
    /pods          → All pods status
  /(public)
    /             → Landing page
    /apply        → Enrollment + payment (Stripe)
    /scholarship  → Scholarship application

/components
  /ui             → Reusable UI (Button, Card, Badge, Avatar)
  /student        → Student-specific components
  /mentor         → Mentor-specific components
  /tutor          → Luna chat component
  /pod            → Pod and buddy components

/lib
  /supabase       → client.ts, server.ts, middleware.ts
  /anthropic      → prospero.ts (system prompt + chat logic)
  /stripe         → checkout.ts
  /utils          → date helpers, timezone utils, activity tracker

/types
  index.ts        → All TypeScript interfaces matching DB schema

/styles
  globals.css     → CSS variables (all brand colors defined here)
```

---

## 11. KEY BUSINESS RULES (enforce in code)

```
1. Reflections unlock ONLY on Sundays
   → Check: new Date().getDay() === 0
   → If not Sunday: show lock UI, disable form

2. Student cannot submit reflection without submitting deliverable first
   → Check deliverable status === 'submitted' before enabling reflection form

3. Parent consent required for students under 18
   → Block access to program content until parent_consent === true
   → Show pending consent screen

4. Luna daily query limit
   → Count chat_messages WHERE user_id = X AND DATE(created_at) = today
   → If count >= 15 total messages today: show "Volvé mañana" message
   → Guardrail is server-side in /api/chat, never client-only

5. Inactivity alerts (run via Supabase cron or Edge Function)
   → 48hrs no activity_log entry → set yellow alert for mentor
   → Saturday no deliverable submitted → set red alert for mentor
   → These alerts surface on the mentor dashboard automatically

6. Pod Leader rotation
   → Rotate every Monday automatically
   → Update pod_members.is_pod_leader_this_week for all pods in active cohorts

7. Certificate generation (jsPDF)
   → Only generate when all 4 conditions are met (see section 9)
   → Include FGU certification mention
   → Student name, cohort name, completion date, competency scores

8. Pricing markets
   → USA market: $797 full / $497 early bird (Stripe product IDs stored in env)
   → LATAM market: $297 full / $197 early bird
   → Scholarship: $0 (requires admin approval, is_scholarship = true)
```

---

## 12. ENVIRONMENT VARIABLES NEEDED

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_PRICE_USA_FULL=
STRIPE_PRICE_USA_EARLY=
STRIPE_PRICE_LATAM_FULL=
STRIPE_PRICE_LATAM_EARLY=

# App
NEXT_PUBLIC_APP_URL=

# Email (Resend) — para emails de consentimiento parental
RESEND_API_KEY=
RESEND_FROM_EMAIL=           # ej: noreply@wakia.app

# Seguridad — token HMAC para links de consentimiento parental
CONSENT_TOKEN_SECRET=        # string aleatorio largo, ej: openssl rand -base64 32
```

---

## 13. HOW TO WORK WITH THIS FILE IN CLAUDE CODE

**Start every session with:**
> "Read CONTEXT.md. We are building Wakia Young. Today we are working on [specific feature]."

**When building a new component:**
> "Using the design system in CONTEXT.md section 3, build [component name]. Use the color semantics exactly as defined."

**When building a new API route:**
> "Following the database schema in CONTEXT.md section 4, build the API route for [feature]."

**When something seems wrong:**
> "Check CONTEXT.md section [X] — does this implementation match what's defined there?"

---

*Last updated: March 2026 | Version 1.0*
*Maintained by: Wakia Young dev team*
