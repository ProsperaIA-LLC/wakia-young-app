import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardResponse } from '@/types'

export async function GET() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. User profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 3. Active enrollment + cohort
  const { data: enrollmentRaw } = await supabase
    .from('enrollments')
    .select('*, cohorts(*)')
    .eq('user_id', authUser.id)
    .eq('status', 'active')
    .single()

  const enrollment = enrollmentRaw as any

  if (!enrollment?.cohorts) {
    return NextResponse.json({ error: 'No active cohort' }, { status: 404 })
  }

  const cohort = enrollment.cohorts as {
    id: string; name: string; market: string; status: string;
    current_week: number; start_date: string; end_date: string
  }

  // 4. Current week
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('*')
    .eq('cohort_id', cohort.id)
    .eq('week_number', cohort.current_week)
    .single()

  if (!currentWeek) {
    return NextResponse.json({ error: 'Current week not found' }, { status: 404 })
  }

  // 5. Deliverable for this week
  const { data: currentDeliverable } = await supabase
    .from('deliverables')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('week_id', currentWeek.id)
    .maybeSingle()

  // 6. Reflection for this week
  const { data: currentReflection } = await supabase
    .from('reflections')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('week_id', currentWeek.id)
    .maybeSingle()

  // 7. Pod membership (includes buddy_id and is_pod_leader_this_week)
  const { data: podMembershipRaw } = await supabase
    .from('pod_members')
    .select('*, pods(*)')
    .eq('user_id', authUser.id)
    .eq('cohort_id', cohort.id)
    .maybeSingle()

  const podMembership = podMembershipRaw as any

  const pod = podMembership?.pods as {
    id: string; name: string; timezone_region: string | null;
    discord_channel_url: string | null; cohort_id: string; created_at: string
  } | null

  const isPodLeader = podMembership?.is_pod_leader_this_week ?? false
  const buddyId = podMembership?.buddy_id ?? null

  // 8. Pod members with last activity
  let podMembers: object[] = []
  if (pod) {
    const { data: members } = await supabase
      .from('pod_members')
      .select('*, users(id, full_name, nickname, avatar_url, country)')
      .eq('pod_id', pod.id)

    if (members) {
      // Get last activity for each member in parallel
      const membersWithActivity = await Promise.all(
        members.map(async (m: any) => {
          const { data: lastActivity } = await supabase
            .from('activity_log')
            .select('created_at')
            .eq('user_id', m.user_id)
            .eq('cohort_id', cohort.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          // Check if submitted deliverable this week
          const { data: memberDeliverable } = await supabase
            .from('deliverables')
            .select('status')
            .eq('user_id', m.user_id)
            .eq('week_id', currentWeek.id)
            .maybeSingle()

          const lastActivityAt = lastActivity?.created_at ?? null
          const hoursInactive = lastActivityAt
            ? (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60)
            : 999

          return {
            podMember: {
              id: m.id,
              pod_id: m.pod_id,
              user_id: m.user_id,
              cohort_id: m.cohort_id,
              buddy_id: m.buddy_id,
              is_pod_leader_this_week: m.is_pod_leader_this_week,
              pod_leader_week_number: m.pod_leader_week_number,
              joined_at: m.joined_at,
            },
            user: m.users,
            lastActivityAt,
            hoursInactive: Math.round(hoursInactive),
            hasSubmittedThisWeek: ['submitted', 'reviewed'].includes(memberDeliverable?.status ?? ''),
            isOnline: hoursInactive < 0.25, // active in last 15 min
          }
        })
      )
      podMembers = membersWithActivity
    }
  }

  // 9. Buddy info
  let buddy = null
  if (buddyId) {
    const { data: buddyData } = await supabase
      .from('users')
      .select('id, full_name, nickname, avatar_url, country')
      .eq('id', buddyId)
      .single()
    buddy = buddyData
  }

  // 10. Streak days — count consecutive days with activity_log entries
  const { data: activityRows } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', authUser.id)
    .eq('cohort_id', cohort.id)
    .order('created_at', { ascending: false })
    .limit(60)

  let streakDays = 0
  if (activityRows && activityRows.length > 0) {
    const activeDates = new Set(
      activityRows.map((r: { created_at: string }) =>
        new Date(r.created_at).toISOString().split('T')[0]
      )
    )

    const cursor = new Date()
    // If no activity today, start checking from yesterday
    const todayStr = cursor.toISOString().split('T')[0]
    if (!activeDates.has(todayStr)) cursor.setDate(cursor.getDate() - 1)

    for (let i = 0; i < 60; i++) {
      const dateStr = cursor.toISOString().split('T')[0]
      if (activeDates.has(dateStr)) {
        streakDays++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }
  }

  // 11. Recent activity feed (last 10 items from pod)
  let recentActivity: object[] = []
  if (pod) {
    const { data: podMemberIds } = await supabase
      .from('pod_members')
      .select('user_id')
      .eq('pod_id', pod.id)

    if (podMemberIds && podMemberIds.length > 0) {
      const userIds = podMemberIds.map((m: { user_id: string }) => m.user_id)

      const { data: feedRows } = await supabase
        .from('activity_log')
        .select('*, users(id, full_name, nickname, avatar_url, country)')
        .in('user_id', userIds)
        .eq('cohort_id', cohort.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const ACTION_LABELS: Record<string, string> = {
        login:                  'entró a la plataforma',
        deliverable_submitted:  'subió su entregable',
        chat_message:           'habló con Luna',
        reflection_submitted:   'completó su reflexión',
        pod_checkin:            'hizo check-in en el pod',
        video_viewed:           'vio el video de la semana',
        buddy_message_sent:     'le escribió a su buddy',
      }

      const now = Date.now()
      recentActivity = (feedRows || []).map((row: any) => {
        const diffMs = now - new Date(row.created_at).getTime()
        const diffMin = Math.floor(diffMs / 60000)
        const diffHrs = Math.floor(diffMin / 60)
        const diffDays = Math.floor(diffHrs / 24)
        const timeAgo = diffMin < 60
          ? `${diffMin} min`
          : diffHrs < 24
            ? `${diffHrs} hrs`
            : diffDays === 1 ? 'ayer' : `${diffDays} días`

        return {
          id: row.id,
          user: row.users,
          action: row.action,
          message: `${row.users?.nickname || row.users?.full_name?.split(' ')[0] || 'Alguien'} ${ACTION_LABELS[row.action] || row.action}`,
          timeAgo,
          createdAt: row.created_at,
        }
      })
    }
  }

  // 12. Computed values
  const isSunday = new Date().getDay() === 0
  const isReflectionUnlocked = isSunday && (currentDeliverable?.status === 'submitted' || currentDeliverable?.status === 'reviewed')

  const dueDate = new Date(currentWeek.due_date)
  const daysUntilDeadline = Math.max(0, Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const startDate = new Date(cohort.start_date)
  const endDate = new Date(cohort.end_date)
  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysPassed = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const cohortProgressPercent = Math.min(100, Math.round((daysPassed / totalDays) * 100))

  const response: DashboardResponse = {
    data: {
      user,
      cohort: {
        id: cohort.id,
        name: cohort.name,
        market: cohort.market as 'LATAM' | 'USA',
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        status: cohort.status as 'upcoming' | 'active' | 'completed',
        price_full_usd: null,
        price_early_usd: null,
        max_students: 30,
        current_week: cohort.current_week,
        created_at: '',
      },
      currentWeek,
      currentDeliverable: currentDeliverable ?? null,
      currentReflection: currentReflection as any ?? null,
      pod: pod ?? null,
      podMembers: podMembers as any,
      buddy: buddy as any,
      recentActivity: recentActivity as any,
      streakDays,
      isPodLeader,
    },
    isReflectionUnlocked,
    daysUntilDeadline,
    cohortProgressPercent,
  }

  return NextResponse.json(response)
}
