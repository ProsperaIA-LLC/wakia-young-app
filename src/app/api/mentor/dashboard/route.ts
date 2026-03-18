// GET /api/mentor/dashboard — Mentor cohort overview
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // 1. Auth + role check
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, nickname, avatar_url')
    .eq('id', authUser.id)
    .single()

  if (profile?.role !== 'mentor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Active cohorts (mentors oversee all active cohorts for now)
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })

  if (!cohorts || cohorts.length === 0) {
    return NextResponse.json({
      mentor: profile,
      cohorts: [],
      students: [],
      alerts: [],
      podSummary: [],
    })
  }

  const cohortIds = cohorts.map((c: { id: string }) => c.id)

  // 3. All students in active cohorts
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, users(id, full_name, nickname, avatar_url, country, age)')
    .in('cohort_id', cohortIds)
    .eq('status', 'active')

  // 4. Open alerts (unresolved)
  const { data: alerts } = await supabase
    .from('mentor_alerts')
    .select('*, users!mentor_alerts_student_id_fkey(id, full_name, nickname)')
    .in('cohort_id', cohortIds)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  // 5. Current week per cohort
  const weeksByCohotId: Record<string, any> = {}
  await Promise.all(
    cohorts.map(async (cohort: any) => {
      const { data: week } = await supabase
        .from('weeks')
        .select('id, week_number, title, phase, due_date')
        .eq('cohort_id', cohort.id)
        .eq('week_number', cohort.current_week)
        .single()
      if (week) weeksByCohotId[cohort.id] = week
    })
  )

  // 6. Deliverable submission counts for current week per cohort
  const submissionsByCohort: Record<string, number> = {}
  await Promise.all(
    cohorts.map(async (cohort: any) => {
      const week = weeksByCohotId[cohort.id]
      if (!week) return
      const { count } = await supabase
        .from('deliverables')
        .select('*', { count: 'exact', head: true })
        .eq('week_id', week.id)
        .in('status', ['submitted', 'reviewed'])
      submissionsByCohort[cohort.id] = count ?? 0
    })
  )

  // 7. Pods for active cohorts
  const { data: pods } = await supabase
    .from('pods')
    .select('*, pod_members(user_id, is_pod_leader_this_week)')
    .in('cohort_id', cohortIds)

  // 8. Enrich student data with alert status and deliverable
  const studentIds = (enrollments || []).map((e: any) => e.user_id)

  // Get last activity for all students
  const activityMap: Record<string, string | null> = {}
  if (studentIds.length > 0) {
    const { data: activities } = await supabase
      .from('activity_log')
      .select('user_id, created_at')
      .in('user_id', studentIds)
      .in('cohort_id', cohortIds)
      .order('created_at', { ascending: false })

    // Keep only most recent per user
    ;(activities || []).forEach((a: { user_id: string; created_at: string }) => {
      if (!activityMap[a.user_id]) activityMap[a.user_id] = a.created_at
    })
  }

  // Get current week deliverables for all students
  const deliverableMap: Record<string, string> = {}
  const allWeekIds = Object.values(weeksByCohotId).map((w: any) => w.id)
  if (allWeekIds.length > 0 && studentIds.length > 0) {
    const { data: deliverables } = await supabase
      .from('deliverables')
      .select('user_id, week_id, status')
      .in('user_id', studentIds)
      .in('week_id', allWeekIds)

    ;(deliverables || []).forEach((d: { user_id: string; week_id: string; status: string }) => {
      deliverableMap[`${d.user_id}-${d.week_id}`] = d.status
    })
  }

  // Build enriched student list
  const students = (enrollments || []).map((e: any) => {
    const cohort = cohorts.find((c: any) => c.id === e.cohort_id)
    const currentWeek = cohort ? weeksByCohotId[cohort.id] : null
    const lastActivityAt = activityMap[e.user_id] ?? null
    const hoursInactive = lastActivityAt
      ? (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60)
      : 999

    const deliverableKey = currentWeek ? `${e.user_id}-${currentWeek.id}` : null
    const deliverableStatus = deliverableKey ? deliverableMap[deliverableKey] ?? 'not_started' : 'not_started'
    const hasSubmitted = ['submitted', 'reviewed'].includes(deliverableStatus)

    // Determine alert level
    let alertLevel: 'none' | 'yellow' | 'red' = 'none'
    const existingAlert = (alerts || []).find((a: any) => a.student_id === e.user_id)
    if (existingAlert?.severity === 'red') alertLevel = 'red'
    else if (existingAlert?.severity === 'yellow') alertLevel = 'yellow'
    else if (hoursInactive >= 48) alertLevel = 'yellow'

    return {
      enrollment: { id: e.id, cohort_id: e.cohort_id, user_id: e.user_id },
      user: e.users,
      cohortName: cohort?.name ?? '',
      lastActivityAt,
      hoursInactive: Math.round(hoursInactive),
      deliverableStatus,
      hasSubmitted,
      alertLevel,
      currentWeekNumber: currentWeek?.week_number ?? null,
    }
  })

  return NextResponse.json({
    mentor: profile,
    cohorts: cohorts.map((c: any) => ({
      ...c,
      currentWeekData: weeksByCohotId[c.id] ?? null,
      submissionsThisWeek: submissionsByCohort[c.id] ?? 0,
      totalStudents: students.filter((s: any) => s.enrollment.cohort_id === c.id).length,
    })),
    students,
    alerts: (alerts || []).map((a: any) => ({
      id: a.id,
      studentId: a.student_id,
      studentName: a.users?.nickname || a.users?.full_name?.split(' ')[0] || 'Estudiante',
      cohortId: a.cohort_id,
      alertType: a.alert_type,
      severity: a.severity,
      message: a.message,
      createdAt: a.created_at,
    })),
    pods: pods || [],
  })
}
