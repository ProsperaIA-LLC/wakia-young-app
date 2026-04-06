// GET /api/mentor/dashboard
// Returns full cohort dashboard for authenticated mentors.
// Uses cohort_overview and student_progress views; requires role === 'mentor' | 'admin'.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  MentorDashboardData,
  MentorAlertWithStudent,
  PodSummaryWithPod,
  DeliverableWithStudent,
  StudentProgress,
  CohortOverview,
} from '@/types'

export async function GET() {
  const supabase = await createClient()

  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // ── 2. Role check ────────────────────────────────────────────────────────────
  // Fetch the user's own row (RLS: auth.uid() = id is always allowed)
  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, nickname, avatar_url')
    .eq('id', authUser.id)
    .single()

  if (!profile || (profile.role !== 'mentor' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Acceso restringido a mentores' }, { status: 403 })
  }

  // ── 3. Active cohort ─────────────────────────────────────────────────────────
  // For now we surface the most-recently-started active cohort.
  // If you need multi-cohort support, accept ?cohortId= as a query param.
  const { data: cohort, error: cohortError } = await supabase
    .from('cohorts')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cohortError) {
    return NextResponse.json({ error: 'Error obteniendo cohorte activa' }, { status: 500 })
  }

  if (!cohort) {
    // No active cohort — return empty shell so the UI can handle it gracefully
    return NextResponse.json({
      mentor: profile,
      cohort: null,
      overview: null,
      students: [],
      redAlerts: [],
      yellowAlerts: [],
      podSummaries: [],
      recentDeliverables: [],
    })
  }

  const cohortId = cohort.id
  const currentWeek = cohort.current_week

  // ── 4. Parallel: views + alerts + pod summaries + deliverables + current week ─
  const [
    overviewRes,
    studentsRes,
    alertsRes,
    podSummariesRes,
    deliverablesRes,
    currentWeekRes,
    nextWeekRes,
  ] = await Promise.all([
    // a. cohort_overview view — aggregates per cohort
    supabase
      .from('cohort_overview')
      .select('*')
      .eq('cohort_id', cohortId)
      .maybeSingle(),

    // b. student_progress view — one row per student in the cohort
    supabase
      .from('student_progress')
      .select('*')
      .eq('cohort_id', cohortId)
      .order('hours_since_activity', { ascending: false, nullsFirst: true }),

    // c. Unresolved alerts + student info joined via FK alias
    supabase
      .from('mentor_alerts')
      .select(`
        id, student_id, cohort_id, alert_type, severity,
        message, is_resolved, resolved_by, resolved_at, created_at,
        users!mentor_alerts_student_id_fkey (
          id, full_name, nickname, avatar_url, country
        )
      `)
      .eq('cohort_id', cohortId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false }),

    // d. Pod summaries for current week + pod + pod leader
    supabase
      .from('pod_summaries')
      .select(`
        id, pod_id, cohort_id, week_number, pod_leader_id, summary_text, submitted_at,
        pods ( id, name, cohort_id, timezone_region, discord_channel_url, created_at ),
        users!pod_summaries_pod_leader_id_fkey ( id, full_name, nickname )
      `)
      .eq('cohort_id', cohortId)
      .eq('week_number', currentWeek)
      .order('submitted_at', { ascending: false }),

    // e. 5 most recent deliverables pending mentor review, with student + week info
    supabase
      .from('deliverables')
      .select(`
        id, user_id, week_id, cohort_id, content, status,
        mentor_feedback, buddy_feedback, submitted_at, reviewed_at, created_at, updated_at,
        users!deliverables_user_id_fkey ( id, full_name, nickname, avatar_url, country ),
        weeks!deliverables_week_id_fkey ( week_number, title )
      `)
      .eq('cohort_id', cohortId)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })
      .limit(5),

    // f. Current week data (for session page)
    supabase
      .from('weeks')
      .select('title, deliverable_description, opening_question')
      .eq('cohort_id', cohortId)
      .eq('week_number', currentWeek)
      .maybeSingle(),

    // g. Next week opening question (for session page "pregunta de apertura")
    supabase
      .from('weeks')
      .select('opening_question')
      .eq('cohort_id', cohortId)
      .eq('week_number', currentWeek + 1)
      .maybeSingle(),
  ])

  // ── 5. Shape: overview ───────────────────────────────────────────────────────
  const overview = (overviewRes.data ?? null) as CohortOverview | null

  // ── 6. Shape: students ───────────────────────────────────────────────────────
  const students = (studentsRes.data ?? []) as StudentProgress[]

  // ── 7. Shape: alerts — split by severity, red first ──────────────────────────
  // Build a pod lookup from student_progress (each student row has pod_id + pod_name)
  const podByStudent = new Map<string, { id: string; name: string } | null>()
  for (const s of students) {
    podByStudent.set(
      s.user_id,
      s.pod_id && s.pod_name ? { id: s.pod_id, name: s.pod_name } : null,
    )
  }

  const rawAlerts = alertsRes.data ?? []

  function shapeAlert(a: typeof rawAlerts[number]): MentorAlertWithStudent {
    const studentRow = (a as any).users as {
      id: string; full_name: string; nickname: string | null
      avatar_url: string | null; country: string | null
    } | null

    return {
      alert: {
        id: a.id,
        student_id: a.student_id,
        cohort_id: a.cohort_id,
        alert_type: a.alert_type as any,
        severity: a.severity as any,
        message: a.message ?? null,
        is_resolved: a.is_resolved,
        resolved_by: a.resolved_by ?? null,
        resolved_at: a.resolved_at ?? null,
        created_at: a.created_at,
      },
      student: {
        id: studentRow?.id ?? a.student_id,
        full_name: studentRow?.full_name ?? 'Estudiante',
        nickname: studentRow?.nickname ?? null,
        avatar_url: studentRow?.avatar_url ?? null,
        country: studentRow?.country ?? null,
      },
      pod: podByStudent.get(a.student_id) ?? null,
    }
  }

  // Sort: red before yellow, then by created_at desc within each group
  const redAlerts: MentorAlertWithStudent[] = rawAlerts
    .filter(a => a.severity === 'red')
    .map(shapeAlert)

  const yellowAlerts: MentorAlertWithStudent[] = rawAlerts
    .filter(a => a.severity === 'yellow')
    .map(shapeAlert)

  // ── 8. Shape: pod summaries ───────────────────────────────────────────────────
  const podSummaries: PodSummaryWithPod[] = (podSummariesRes.data ?? []).map(row => {
    const pod = (row as any).pods as {
      id: string; name: string; cohort_id: string
      timezone_region: string | null; discord_channel_url: string | null; created_at: string
    } | null
    const leader = (row as any).users as {
      id: string; full_name: string; nickname: string | null
    } | null

    return {
      summary: {
        id: row.id,
        pod_id: row.pod_id,
        cohort_id: row.cohort_id,
        week_number: row.week_number,
        pod_leader_id: row.pod_leader_id,
        summary_text: row.summary_text,
        submitted_at: row.submitted_at,
      },
      pod: pod ?? {
        id: row.pod_id,
        name: 'Pod',
        cohort_id: row.cohort_id,
        timezone_region: null,
        discord_channel_url: null,
        created_at: row.submitted_at,
      },
      podLeader: {
        id: leader?.id ?? row.pod_leader_id,
        full_name: leader?.full_name ?? 'Pod Leader',
        nickname: leader?.nickname ?? null,
      },
    }
  })

  // ── 9. Shape: recent deliverables ─────────────────────────────────────────────
  const recentDeliverables: DeliverableWithStudent[] = (deliverablesRes.data ?? []).map(row => {
    const student = (row as any).users as {
      id: string; full_name: string; nickname: string | null
      avatar_url: string | null; country: string | null
    } | null
    const week = (row as any).weeks as {
      week_number: number; title: string
    } | null

    return {
      deliverable: {
        id: row.id,
        user_id: row.user_id,
        week_id: row.week_id,
        cohort_id: row.cohort_id,
        content: row.content ?? null,
        status: row.status as any,
        mentor_feedback: row.mentor_feedback ?? null,
        buddy_feedback: row.buddy_feedback ?? null,
        submitted_at: row.submitted_at ?? null,
        reviewed_at: row.reviewed_at ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      student: {
        id: student?.id ?? row.user_id,
        full_name: student?.full_name ?? 'Estudiante',
        nickname: student?.nickname ?? null,
        avatar_url: student?.avatar_url ?? null,
        country: student?.country ?? null,
      },
      week: {
        week_number: week?.week_number ?? currentWeek,
        title: week?.title ?? '',
      },
    }
  })

  // ── 10. Final response ────────────────────────────────────────────────────────
  const weekData = currentWeekRes.data
  const cohortWithWeek = {
    ...cohort,
    weekTitle:               weekData?.title ?? null,
    deliverableDescription:  weekData?.deliverable_description ?? null,
    nextWeekQuestion:        nextWeekRes.data?.opening_question ?? null,
  }

  const payload: MentorDashboardData & { mentor: typeof profile } = {
    mentor: profile,
    cohort: cohortWithWeek,
    overview: overview ?? {
      cohort_id: cohortId,
      cohort_name: cohort.name,
      market: cohort.market,
      status: cohort.status,
      current_week: currentWeek,
      total_students: 0,
      active_students: 0,
      dropped_students: 0,
      red_alerts: 0,
      yellow_alerts: 0,
    },
    students,
    redAlerts,
    yellowAlerts,
    podSummaries,
    recentDeliverables,
  }

  return NextResponse.json(payload)
}
