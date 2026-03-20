// ============================================================
// types/index.ts — Prospera Young AI
// All TypeScript interfaces matching the Supabase schema.
// Import from here everywhere in the app.
// ============================================================

// ── ENUMS ────────────────────────────────────────────────────

export type UserRole = 'student' | 'mentor' | 'admin'
export type Market = 'LATAM' | 'USA'
export type CohortStatus = 'upcoming' | 'active' | 'completed'
export type EnrollmentStatus = 'active' | 'completed' | 'dropped'
export type DeliverableStatus = 'not_started' | 'draft' | 'pending' | 'submitted' | 'reviewed'
export type Phase = 'Despertar' | 'Construir' | 'Lanzar'
export type ChatRole = 'user' | 'assistant'
export type AlertType = 'inactive_48h' | 'inactive_72h' | 'no_deliverable' | 'buddy_no_response'
export type AlertSeverity = 'yellow' | 'red'
export type ActivityAction =
  | 'login'
  | 'deliverable_submitted'
  | 'chat_message'
  | 'reflection_submitted'
  | 'pod_checkin'
  | 'video_viewed'
  | 'buddy_message_sent'
export type ScholarshipStatus = 'pending' | 'approved' | 'rejected'

// ── DATABASE TABLES ──────────────────────────────────────────

export interface User {
  id: string
  email: string
  full_name: string
  nickname: string | null
  country: string | null
  role: UserRole
  avatar_url: string | null
  timezone: string | null
  age: number | null
  parent_consent: boolean
  market: Market | null
  created_at: string
  updated_at: string
}

export interface Cohort {
  id: string
  name: string
  market: Market
  start_date: string
  end_date: string
  status: CohortStatus
  price_full_usd: number | null
  price_early_usd: number | null
  max_students: number
  current_week: number
  created_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  cohort_id: string
  market: Market
  price_paid_usd: number
  is_scholarship: boolean
  stripe_payment_id: string | null
  stripe_customer_id: string | null
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
}

export interface Pod {
  id: string
  cohort_id: string
  name: string
  timezone_region: string | null
  discord_channel_url: string | null
  created_at: string
}

export interface PodMember {
  id: string
  pod_id: string
  user_id: string
  cohort_id: string
  buddy_id: string | null
  is_pod_leader_this_week: boolean
  pod_leader_week_number: number | null
  joined_at: string
}

export interface Week {
  id: string
  cohort_id: string
  week_number: number
  phase: Phase
  title: string
  opening_question: string
  deliverable_description: string
  success_signal: string
  reflection_q1: string
  reflection_q2: string
  tools: string[] | null
  mentor_video_url: string | null
  notion_guide_url: string | null
  unlock_date: string
  due_date: string
  created_at: string
}

export interface Deliverable {
  id: string
  user_id: string
  week_id: string
  cohort_id: string
  content: string | null
  status: DeliverableStatus
  mentor_feedback: string | null
  buddy_feedback: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface Reflection {
  id: string
  user_id: string
  cohort_id: string | null
  week_id: string
  deliverable_id: string | null
  q1: string | null
  q2: string | null
  q3: string | null
  status: 'draft' | 'submitted' | null
  mentor_feedback: string | null
  submitted_at: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  cohort_id: string | null
  week_id: string | null
  role: ChatRole
  content: string
  tokens_used: number | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  cohort_id: string | null
  action: ActivityAction
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface MentorAlert {
  id: string
  student_id: string
  cohort_id: string
  alert_type: AlertType
  severity: AlertSeverity
  message: string | null
  is_resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface MentorNote {
  id: string
  mentor_id: string
  student_id: string
  cohort_id: string
  note: string
  created_at: string
}

export interface PodSummary {
  id: string
  pod_id: string
  cohort_id: string
  week_number: number
  pod_leader_id: string
  summary_text: string
  submitted_at: string
}

export interface ScholarshipApplication {
  id: string
  cohort_id: string
  applicant_name: string
  applicant_email: string
  applicant_age: number
  applicant_country: string
  motivation_letter: string
  video_url: string | null
  reference_name: string | null
  reference_contact: string | null
  status: ScholarshipStatus
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
}

// ── DATABASE VIEWS ───────────────────────────────────────────

export interface CohortOverview {
  cohort_id: string
  cohort_name: string
  market: Market
  status: CohortStatus
  current_week: number
  total_students: number
  active_students: number
  dropped_students: number
  red_alerts: number
  yellow_alerts: number
}

export interface StudentProgress {
  user_id: string
  full_name: string
  nickname: string | null
  country: string | null
  cohort_id: string
  enrollment_status: EnrollmentStatus
  pod_id: string | null
  pod_name: string | null
  buddy_id: string | null
  is_pod_leader_this_week: boolean
  deliverables_submitted: number
  reflections_submitted: number
  last_activity_at: string | null
  hours_since_activity: number | null
  open_alerts: number
}

// ── COMPOSITE TYPES (joins — used in components) ─────────────

// Student dashboard: everything needed to render the main view
export interface StudentDashboardData {
  user: User
  cohort: Cohort
  currentWeek: Week
  currentDeliverable: Deliverable | null
  currentReflection: Reflection | null
  pod: Pod | null
  podMembers: PodMemberWithUser[]
  buddy: User | null
  recentActivity: ActivityFeedItem[]
  streakDays: number
  isPodLeader: boolean
}

// Pod member with user info joined
export interface PodMemberWithUser {
  podMember: PodMember
  user: User
  lastActivityAt: string | null
  hoursInactive: number
  hasSubmittedThisWeek: boolean
  isOnline: boolean // based on activity in last 15 min
}

// Activity feed item for dashboard
export interface ActivityFeedItem {
  id: string
  user: Pick<User, 'id' | 'full_name' | 'nickname' | 'avatar_url' | 'country'>
  action: ActivityAction
  message: string
  timeAgo: string
  createdAt: string
  podName?: string
  tagType?: 'pod' | 'wins' | 'general'
  tagLabel?: string
}

// Mentor dashboard: full cohort view
export interface MentorDashboardData {
  cohort: Cohort
  overview: CohortOverview
  students: StudentProgress[]
  redAlerts: MentorAlertWithStudent[]
  yellowAlerts: MentorAlertWithStudent[]
  podSummaries: PodSummaryWithPod[]
  recentDeliverables: DeliverableWithStudent[]
}

// Alert with student info
export interface MentorAlertWithStudent {
  alert: MentorAlert
  student: Pick<User, 'id' | 'full_name' | 'nickname' | 'avatar_url' | 'country'>
  pod: Pick<Pod, 'id' | 'name'> | null
}

// Pod summary with pod info
export interface PodSummaryWithPod {
  summary: PodSummary
  pod: Pod
  podLeader: Pick<User, 'id' | 'full_name' | 'nickname'>
}

// Deliverable with student info
export interface DeliverableWithStudent {
  deliverable: Deliverable
  student: Pick<User, 'id' | 'full_name' | 'nickname' | 'avatar_url' | 'country'>
  week: Pick<Week, 'week_number' | 'title'>
}

// ── API TYPES ────────────────────────────────────────────────

// POST /api/chat — request body
export interface ChatRequest {
  message: string
  weekId: string
  cohortId: string
}

// POST /api/chat — response body
export interface ChatResponse {
  reply: string
  dailyCount: number
  limitReached: boolean
}

// POST /api/deliverables — request body
export interface SubmitDeliverableRequest {
  weekId: string
  cohortId: string
  content: string
}

// POST /api/reflections — request body
export interface SubmitReflectionRequest {
  weekId: string
  deliverableId: string
  answerQ1: string
  answerQ2: string
}

// POST /api/pod-summary — request body
export interface SubmitPodSummaryRequest {
  podId: string
  cohortId: string
  weekNumber: number
  summaryText: string
}

// POST /api/checkout — request body
export interface CheckoutRequest {
  cohortId: string
  market: Market
  priceType: 'full' | 'early'
  studentName: string
  studentEmail: string
  studentAge: number
  studentCountry: string
}

// GET /api/student/dashboard — response
export interface DashboardResponse {
  data: StudentDashboardData
  isReflectionUnlocked: boolean  // true only on Sundays
  daysUntilDeadline: number
  cohortProgressPercent: number
}

// ── FORM TYPES ───────────────────────────────────────────────

export interface RegistrationForm {
  email: string
  fullName: string
  nickname: string
  age: number
  country: string
  timezone: string
  market: Market
  parentName: string
  parentEmail: string
  parentPhone: string
}

export interface OnboardingStep1 {
  nickname: string
  country: string
  timezone: string
}

export interface OnboardingStep2 {
  avatarUrl: string | null
  avatarEmoji: string | null  // fallback if no photo
}

export interface OnboardingStep3 {
  parentConsentSigned: boolean
  termsAccepted: boolean
  programRulesAccepted: boolean
}

export interface ScholarshipForm {
  cohortId: string
  applicantName: string
  applicantEmail: string
  applicantAge: number
  applicantCountry: string
  motivationLetter: string
  videoUrl: string
  referenceName: string
  referenceContact: string
}

// ── DATABASE TYPE (for typed Supabase client) ────────────────
// Explicit inline format matching Supabase's auto-generated output.
// Required columns are required in Insert; auto-generated/nullable cols are optional.

export type Database = {
  public: {
    PostgrestVersion: "12"
    Tables: {
      users: {
        Row: { id: string; email: string; full_name: string; nickname: string | null; country: string | null; role: UserRole; avatar_url: string | null; timezone: string | null; age: number | null; parent_consent: boolean; market: Market | null; created_at: string; updated_at: string }
        Insert: { id?: string; email: string; full_name: string; nickname?: string | null; country?: string | null; role?: UserRole; avatar_url?: string | null; timezone?: string | null; age?: number | null; parent_consent?: boolean; market?: Market | null; created_at?: string; updated_at?: string }
        Update: { id?: string; email?: string; full_name?: string; nickname?: string | null; country?: string | null; role?: UserRole; avatar_url?: string | null; timezone?: string | null; age?: number | null; parent_consent?: boolean; market?: Market | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      cohorts: {
        Row: { id: string; name: string; market: Market; start_date: string; end_date: string; status: CohortStatus; price_full_usd: number | null; price_early_usd: number | null; max_students: number; current_week: number; created_at: string }
        Insert: { id?: string; name: string; market: Market; start_date: string; end_date: string; status: CohortStatus; price_full_usd?: number | null; price_early_usd?: number | null; max_students?: number; current_week?: number; created_at?: string }
        Update: { id?: string; name?: string; market?: Market; start_date?: string; end_date?: string; status?: CohortStatus; price_full_usd?: number | null; price_early_usd?: number | null; max_students?: number; current_week?: number; created_at?: string }
        Relationships: []
      }
      enrollments: {
        Row: { id: string; user_id: string; cohort_id: string; market: Market; price_paid_usd: number; is_scholarship: boolean; stripe_payment_id: string | null; stripe_customer_id: string | null; status: EnrollmentStatus; enrolled_at: string; completed_at: string | null }
        Insert: { id?: string; user_id: string; cohort_id: string; market: Market; price_paid_usd?: number; is_scholarship?: boolean; stripe_payment_id?: string | null; stripe_customer_id?: string | null; status?: EnrollmentStatus; enrolled_at?: string; completed_at?: string | null }
        Update: { id?: string; user_id?: string; cohort_id?: string; market?: Market; price_paid_usd?: number; is_scholarship?: boolean; stripe_payment_id?: string | null; stripe_customer_id?: string | null; status?: EnrollmentStatus; enrolled_at?: string; completed_at?: string | null }
        Relationships: []
      }
      pods: {
        Row: { id: string; cohort_id: string; name: string; timezone_region: string | null; discord_channel_url: string | null; created_at: string }
        Insert: { id?: string; cohort_id: string; name: string; timezone_region?: string | null; discord_channel_url?: string | null; created_at?: string }
        Update: { id?: string; cohort_id?: string; name?: string; timezone_region?: string | null; discord_channel_url?: string | null; created_at?: string }
        Relationships: []
      }
      pod_members: {
        Row: { id: string; pod_id: string; user_id: string; cohort_id: string; buddy_id: string | null; is_pod_leader_this_week: boolean; pod_leader_week_number: number | null; joined_at: string }
        Insert: { id?: string; pod_id: string; user_id: string; cohort_id: string; buddy_id?: string | null; is_pod_leader_this_week?: boolean; pod_leader_week_number?: number | null; joined_at?: string }
        Update: { id?: string; pod_id?: string; user_id?: string; cohort_id?: string; buddy_id?: string | null; is_pod_leader_this_week?: boolean; pod_leader_week_number?: number | null; joined_at?: string }
        Relationships: []
      }
      weeks: {
        Row: { id: string; cohort_id: string; week_number: number; phase: Phase; title: string; opening_question: string; deliverable_description: string; success_signal: string; reflection_q1: string; reflection_q2: string; tools: string[] | null; mentor_video_url: string | null; notion_guide_url: string | null; unlock_date: string; due_date: string; created_at: string }
        Insert: { id?: string; cohort_id: string; week_number: number; phase: Phase; title: string; opening_question: string; deliverable_description: string; success_signal: string; reflection_q1?: string; reflection_q2?: string; tools?: string[] | null; mentor_video_url?: string | null; notion_guide_url?: string | null; unlock_date?: string; due_date: string; created_at?: string }
        Update: { id?: string; cohort_id?: string; week_number?: number; phase?: Phase; title?: string; opening_question?: string; deliverable_description?: string; success_signal?: string; reflection_q1?: string; reflection_q2?: string; tools?: string[] | null; mentor_video_url?: string | null; notion_guide_url?: string | null; unlock_date?: string; due_date?: string; created_at?: string }
        Relationships: []
      }
      deliverables: {
        Row: { id: string; user_id: string; week_id: string; cohort_id: string; content: string | null; status: DeliverableStatus; mentor_feedback: string | null; buddy_feedback: string | null; submitted_at: string | null; reviewed_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; week_id: string; cohort_id: string; content?: string | null; status?: DeliverableStatus; mentor_feedback?: string | null; buddy_feedback?: string | null; submitted_at?: string | null; reviewed_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; week_id?: string; cohort_id?: string; content?: string | null; status?: DeliverableStatus; mentor_feedback?: string | null; buddy_feedback?: string | null; submitted_at?: string | null; reviewed_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      reflections: {
        Row: { id: string; user_id: string; cohort_id: string | null; week_id: string; deliverable_id: string | null; q1: string | null; q2: string | null; q3: string | null; status: string | null; mentor_feedback: string | null; submitted_at: string | null; created_at: string }
        Insert: { id?: string; user_id: string; cohort_id?: string | null; week_id: string; deliverable_id?: string | null; q1?: string | null; q2?: string | null; q3?: string | null; status?: string | null; mentor_feedback?: string | null; submitted_at?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; cohort_id?: string | null; week_id?: string; deliverable_id?: string | null; q1?: string | null; q2?: string | null; q3?: string | null; status?: string | null; mentor_feedback?: string | null; submitted_at?: string | null; created_at?: string }
        Relationships: []
      }
      chat_messages: {
        Row: { id: string; user_id: string; cohort_id: string | null; week_id: string | null; role: ChatRole; content: string; tokens_used: number | null; created_at: string }
        Insert: { id?: string; user_id: string; cohort_id?: string | null; week_id?: string | null; role: ChatRole; content: string; tokens_used?: number | null; created_at?: string }
        Update: { id?: string; user_id?: string; cohort_id?: string | null; week_id?: string | null; role?: ChatRole; content?: string; tokens_used?: number | null; created_at?: string }
        Relationships: []
      }
      activity_log: {
        Row: { id: string; user_id: string; cohort_id: string | null; action: ActivityAction; metadata: Record<string, unknown> | null; created_at: string }
        Insert: { id?: string; user_id: string; cohort_id?: string | null; action: ActivityAction; metadata?: Record<string, unknown> | null; created_at?: string }
        Update: { id?: string; user_id?: string; cohort_id?: string | null; action?: ActivityAction; metadata?: Record<string, unknown> | null; created_at?: string }
        Relationships: []
      }
      mentor_alerts: {
        Row: { id: string; student_id: string; cohort_id: string; alert_type: AlertType; severity: AlertSeverity; message: string | null; is_resolved: boolean; resolved_by: string | null; resolved_at: string | null; created_at: string }
        Insert: { id?: string; student_id: string; cohort_id: string; alert_type: AlertType; severity: AlertSeverity; message?: string | null; is_resolved?: boolean; resolved_by?: string | null; resolved_at?: string | null; created_at?: string }
        Update: { id?: string; student_id?: string; cohort_id?: string; alert_type?: AlertType; severity?: AlertSeverity; message?: string | null; is_resolved?: boolean; resolved_by?: string | null; resolved_at?: string | null; created_at?: string }
        Relationships: []
      }
      mentor_notes: {
        Row: { id: string; mentor_id: string; student_id: string; cohort_id: string; note: string; created_at: string }
        Insert: { id?: string; mentor_id: string; student_id: string; cohort_id: string; note: string; created_at?: string }
        Update: { id?: string; mentor_id?: string; student_id?: string; cohort_id?: string; note?: string; created_at?: string }
        Relationships: []
      }
      pod_summaries: {
        Row: { id: string; pod_id: string; cohort_id: string; week_number: number; pod_leader_id: string; summary_text: string; submitted_at: string }
        Insert: { id?: string; pod_id: string; cohort_id: string; week_number: number; pod_leader_id: string; summary_text: string; submitted_at?: string }
        Update: { id?: string; pod_id?: string; cohort_id?: string; week_number?: number; pod_leader_id?: string; summary_text?: string; submitted_at?: string }
        Relationships: []
      }
      scholarship_applications: {
        Row: { id: string; cohort_id: string | null; applicant_name: string; applicant_email: string; applicant_age: number; applicant_country: string; motivation_letter: string; video_url: string | null; reference_name: string | null; reference_contact: string | null; status: ScholarshipStatus; reviewed_by: string | null; reviewed_at: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; cohort_id?: string | null; applicant_name: string; applicant_email: string; applicant_age: number; applicant_country: string; motivation_letter: string; video_url?: string | null; reference_name?: string | null; reference_contact?: string | null; status?: ScholarshipStatus; reviewed_by?: string | null; reviewed_at?: string | null; notes?: string | null; created_at?: string }
        Update: { id?: string; cohort_id?: string | null; applicant_name?: string; applicant_email?: string; applicant_age?: number; applicant_country?: string; motivation_letter?: string; video_url?: string | null; reference_name?: string | null; reference_contact?: string | null; status?: ScholarshipStatus; reviewed_by?: string | null; reviewed_at?: string | null; notes?: string | null; created_at?: string }
        Relationships: []
      }
    }
    Views: {
      cohort_overview: { Row: { cohort_id: string; cohort_name: string; market: Market; status: CohortStatus; current_week: number; total_students: number; active_students: number; dropped_students: number; red_alerts: number; yellow_alerts: number }; Relationships: [] }
      student_progress: { Row: { user_id: string; full_name: string; nickname: string | null; country: string | null; cohort_id: string; enrollment_status: EnrollmentStatus; pod_id: string | null; pod_name: string | null; buddy_id: string | null; is_pod_leader_this_week: boolean; deliverables_submitted: number; reflections_submitted: number; last_activity_at: string | null; hours_since_activity: number | null; open_alerts: number }; Relationships: [] }
    }
    Functions: {
      get_daily_message_count: { Args: { p_user_id: string }; Returns: number }
      hours_since_last_activity: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
