// GET  /api/admin/pods?cohort_id=xxx  — pods + members + unassigned students
// POST /api/admin/pods                — create pod
// PATCH /api/admin/pods               — update pod (name, timezone_region, discord_channel_url)
// DELETE /api/admin/pods              — delete pod (only if empty)

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

async function authCheck() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const cohortId = req.nextUrl.searchParams.get('cohort_id')
  if (!cohortId) return NextResponse.json({ error: 'cohort_id requerido' }, { status: 400 })

  const service = getServiceClient()

  // Pods with members
  const { data: pods, error: podsErr } = await service
    .from('pods')
    .select('id, name, timezone_region, discord_channel_url')
    .eq('cohort_id', cohortId)
    .order('name')

  if (podsErr) return NextResponse.json({ error: podsErr.message }, { status: 500 })

  // All pod members for this cohort
  const podIds = (pods ?? []).map(p => p.id)
  const { data: members } = podIds.length > 0
    ? await service
        .from('pod_members')
        .select('id, pod_id, user_id, buddy_id, is_pod_leader_this_week')
        .in('pod_id', podIds)
    : { data: [] }

  // User info for members
  const memberUserIds = [...new Set((members ?? []).map(m => m.user_id))]
  const { data: memberUsers } = memberUserIds.length > 0
    ? await service
        .from('users')
        .select('id, full_name, nickname, country, timezone')
        .in('id', memberUserIds)
    : { data: [] }

  const userMap = new Map((memberUsers ?? []).map(u => [u.id, u]))

  const podsWithMembers = (pods ?? []).map(pod => ({
    ...pod,
    members: (members ?? [])
      .filter(m => m.pod_id === pod.id)
      .map(m => ({
        member_id: m.id,
        user_id:   m.user_id,
        buddy_id:  m.buddy_id,
        is_pod_leader_this_week: m.is_pod_leader_this_week,
        ...userMap.get(m.user_id),
      })),
  }))

  // Enrolled students NOT assigned to any pod
  const assignedIds = new Set((members ?? []).map(m => m.user_id))

  const { data: enrollments } = await service
    .from('enrollments')
    .select('user_id')
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  const enrolledIds = (enrollments ?? []).map(e => e.user_id).filter(id => !assignedIds.has(id))

  const { data: unassignedUsers } = enrolledIds.length > 0
    ? await service
        .from('users')
        .select('id, full_name, nickname, country, timezone')
        .in('id', enrolledIds)
        .order('full_name')
    : { data: [] }

  return NextResponse.json({ pods: podsWithMembers, unassigned: unassignedUsers ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { cohort_id?: string; name?: string; timezone_region?: string; discord_channel_url?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { cohort_id, name, timezone_region, discord_channel_url } = body
  if (!cohort_id || !name?.trim()) {
    return NextResponse.json({ error: 'cohort_id y name son requeridos' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('pods')
    .insert({ cohort_id, name: name.trim(), timezone_region: timezone_region ?? null, discord_channel_url: discord_channel_url ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pod: { ...data, members: [] } })
}

export async function PATCH(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { pod_id?: string; name?: string; timezone_region?: string; discord_channel_url?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { pod_id, ...patch } = body
  if (!pod_id) return NextResponse.json({ error: 'pod_id requerido' }, { status: 400 })

  const service = getServiceClient()
  const { error } = await service.from('pods').update(patch).eq('id', pod_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { pod_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.pod_id) return NextResponse.json({ error: 'pod_id requerido' }, { status: 400 })

  const service = getServiceClient()

  // Block deletion if pod has members
  const { data: members } = await service
    .from('pod_members')
    .select('id')
    .eq('pod_id', body.pod_id)
    .limit(1)

  if (members && members.length > 0) {
    return NextResponse.json({ error: 'No podés eliminar un pod con estudiantes asignados' }, { status: 409 })
  }

  const { error } = await service.from('pods').delete().eq('id', body.pod_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
