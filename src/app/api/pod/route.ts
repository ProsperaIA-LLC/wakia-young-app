import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────────────────────

export interface PodMemberData {
  userId: string
  fullName: string
  nickname: string | null
  avatarUrl: string | null
  country: string | null
  isPodLeader: boolean
  buddyId: string | null
  lastActivityAt: string | null
  hoursSinceActivity: number | null
  /** true when hoursSinceActivity > 48 (CONTEXT.md §7 dropout trigger) */
  isInactive: boolean
  /** true when this week's deliverable status is 'submitted' or 'reviewed' */
  hasSubmittedThisWeek: boolean
  deliverableStatus: string | null
  isCurrentUser: boolean
}

export interface PodResponse {
  pod: {
    id: string
    name: string
    cohortId: string
    timezoneRegion: string | null
    discordChannelUrl: string | null
  }
  currentWeekId: string | null
  members: PodMemberData[]
}

// ── GET /api/pod ─────────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 2. Find the caller's pod membership
  const { data: myMembership, error: membershipError } = await supabase
    .from('pod_members')
    .select('pod_id, cohort_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json({ error: 'Error buscando tu pod' }, { status: 500 })
  }
  if (!myMembership) {
    return NextResponse.json({ error: 'No estás asignado a ningún pod todavía' }, { status: 404 })
  }

  const { pod_id, cohort_id } = myMembership

  // 3. Fetch pod info, all pod members+users, cohort current_week — parallel
  const [podRes, membersRes, cohortRes] = await Promise.all([
    supabase
      .from('pods')
      .select('id, name, cohort_id, timezone_region, discord_channel_url')
      .eq('id', pod_id)
      .single(),

    supabase
      .from('pod_members')
      .select(`
        id,
        user_id,
        cohort_id,
        buddy_id,
        is_pod_leader_this_week,
        users!user_id (
          id,
          full_name,
          nickname,
          avatar_url,
          country
        )
      `)
      .eq('pod_id', pod_id),

    supabase
      .from('cohorts')
      .select('current_week')
      .eq('id', cohort_id)
      .single(),
  ])

  if (podRes.error || !podRes.data) {
    return NextResponse.json({ error: 'Pod no encontrado' }, { status: 404 })
  }
  if (membersRes.error) {
    return NextResponse.json({ error: 'Error obteniendo miembros del pod' }, { status: 500 })
  }

  const pod = podRes.data
  const rawMembers = membersRes.data ?? []
  const currentWeekNumber = cohortRes.data?.current_week ?? null

  // 4. Get current week id for deliverable lookup
  let currentWeekId: string | null = null
  if (currentWeekNumber !== null) {
    const { data: weekRow } = await supabase
      .from('weeks')
      .select('id')
      .eq('cohort_id', cohort_id)
      .eq('week_number', currentWeekNumber)
      .maybeSingle()
    currentWeekId = weekRow?.id ?? null
  }

  const memberUserIds = rawMembers.map(m => m.user_id)

  // 5. Batch-fetch last activity per member and current-week deliverables — parallel
  const [activityRes, deliverablesRes] = await Promise.all([
    // Get all recent activity_log rows for these users, sorted newest first.
    // We'll pick the first per user_id in JS.
    supabase
      .from('activity_log')
      .select('user_id, created_at')
      .in('user_id', memberUserIds)
      .order('created_at', { ascending: false }),

    currentWeekId
      ? supabase
          .from('deliverables')
          .select('user_id, status')
          .in('user_id', memberUserIds)
          .eq('week_id', currentWeekId)
      : Promise.resolve({ data: [], error: null }),
  ])

  // 6. Build lookup maps
  // Last activity per user (first row = most recent because we sorted desc)
  const lastActivityMap = new Map<string, string>()
  for (const row of activityRes.data ?? []) {
    if (!lastActivityMap.has(row.user_id)) {
      lastActivityMap.set(row.user_id, row.created_at)
    }
  }

  // Deliverable status per user
  const deliverableMap = new Map<string, string>()
  for (const row of (deliverablesRes.data ?? []) as { user_id: string; status: string }[]) {
    deliverableMap.set(row.user_id, row.status)
  }

  // 7. Assemble response
  const now = Date.now()

  const members: PodMemberData[] = rawMembers.map(m => {
    const u = (m.users as unknown as { id: string; full_name: string; nickname: string | null; avatar_url: string | null; country: string | null } | null)

    const lastActivityAt = lastActivityMap.get(m.user_id) ?? null
    const hoursSinceActivity = lastActivityAt
      ? Math.floor((now - new Date(lastActivityAt).getTime()) / 36e5)
      : null

    const deliverableStatus = deliverableMap.get(m.user_id) ?? null
    const hasSubmittedThisWeek =
      deliverableStatus === 'submitted' || deliverableStatus === 'reviewed'

    return {
      userId: m.user_id,
      fullName: u?.full_name ?? 'Estudiante',
      nickname: u?.nickname ?? null,
      avatarUrl: u?.avatar_url ?? null,
      country: u?.country ?? null,
      isPodLeader: m.is_pod_leader_this_week,
      buddyId: m.buddy_id,
      lastActivityAt,
      hoursSinceActivity,
      isInactive: hoursSinceActivity !== null ? hoursSinceActivity > 48 : false,
      hasSubmittedThisWeek,
      deliverableStatus,
      isCurrentUser: m.user_id === user.id,
    }
  })

  // Sort: current user first, then pod leader, then by activity recency
  members.sort((a, b) => {
    if (a.isCurrentUser) return -1
    if (b.isCurrentUser) return 1
    if (a.isPodLeader && !b.isPodLeader) return -1
    if (b.isPodLeader && !a.isPodLeader) return 1
    // Most recently active first
    if (a.lastActivityAt && b.lastActivityAt) {
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
    }
    return 0
  })

  const response: PodResponse = {
    pod: {
      id: pod.id,
      name: pod.name,
      cohortId: pod.cohort_id,
      timezoneRegion: pod.timezone_region,
      discordChannelUrl: pod.discord_channel_url,
    },
    currentWeekId,
    members,
  }

  return NextResponse.json(response)
}
