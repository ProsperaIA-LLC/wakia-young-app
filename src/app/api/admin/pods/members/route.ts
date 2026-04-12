// POST   /api/admin/pods/members — assign student to pod
// DELETE /api/admin/pods/members — remove student from pod
// PATCH  /api/admin/pods/members — set buddy_id for a member

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

// POST — assign a student to a pod
export async function POST(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { pod_id?: string; user_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { pod_id, user_id } = body
  if (!pod_id || !user_id) {
    return NextResponse.json({ error: 'pod_id y user_id son requeridos' }, { status: 400 })
  }

  const service = getServiceClient()

  // Check student isn't already in a pod for this cohort
  const { data: pod } = await service
    .from('pods').select('cohort_id').eq('id', pod_id).single()

  if (!pod) return NextResponse.json({ error: 'Pod no encontrado' }, { status: 404 })

  // Check if user already has a pod_member row in any pod of this cohort
  const { data: existingPods } = await service
    .from('pods').select('id').eq('cohort_id', pod.cohort_id)
  const existingPodIds = (existingPods ?? []).map(p => p.id)

  if (existingPodIds.length > 0) {
    const { data: existingMember } = await service
      .from('pod_members')
      .select('id')
      .eq('user_id', user_id)
      .in('pod_id', existingPodIds)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: 'El estudiante ya está asignado a un pod en esta cohorte' }, { status: 409 })
    }
  }

  const { data, error } = await service
    .from('pod_members')
    .insert({ pod_id, user_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ member: data })
}

// DELETE — remove a student from a pod
export async function DELETE(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { member_id?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  if (!body.member_id) return NextResponse.json({ error: 'member_id requerido' }, { status: 400 })

  const service = getServiceClient()
  const { error } = await service
    .from('pod_members').delete().eq('id', body.member_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// PATCH — update a member (buddy_id, is_pod_leader_this_week)
export async function PATCH(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { member_id?: string; buddy_id?: string | null; is_pod_leader_this_week?: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { member_id, ...patch } = body
  if (!member_id) return NextResponse.json({ error: 'member_id requerido' }, { status: 400 })

  const service = getServiceClient()
  const { error } = await service
    .from('pod_members').update(patch).eq('id', member_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
