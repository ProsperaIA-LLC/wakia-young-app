// GET   /api/admin/cohorts — all cohorts with student count
// POST  /api/admin/cohorts — create a new cohort
// PATCH /api/admin/cohorts — update status or current_week
// Requires role === 'admin'. Uses service role.

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

export async function GET() {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const service = getServiceClient()

  const { data: cohorts, error } = await service
    .from('cohorts')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Student counts per cohort
  const cohortIds = (cohorts ?? []).map(c => c.id)
  const { data: enrollments } = await service
    .from('enrollments')
    .select('cohort_id')
    .in('cohort_id', cohortIds)
    .eq('status', 'active')

  const countMap = new Map<string, number>()
  for (const e of enrollments ?? []) {
    countMap.set(e.cohort_id, (countMap.get(e.cohort_id) ?? 0) + 1)
  }

  const result = (cohorts ?? []).map(c => ({
    ...c,
    studentCount: countMap.get(c.id) ?? 0,
  }))

  return NextResponse.json({ cohorts: result })
}

export async function POST(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { name, market, start_date, end_date, price_usd, max_students } = body

  if (!name?.trim() || !market || !start_date || !end_date) {
    return NextResponse.json(
      { error: 'name, market, start_date y end_date son requeridos' },
      { status: 400 }
    )
  }
  if (!['LATAM', 'USA'].includes(market)) {
    return NextResponse.json({ error: 'market debe ser LATAM o USA' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('cohorts')
    .insert({
      name: name.trim(),
      market,
      start_date,
      end_date,
      price_usd: price_usd ?? null,
      max_students: max_students ?? 30,
      status: 'upcoming',
      current_week: 1,
    })
    .select()
    .single()

  if (error) {
    console.error('[/api/admin/cohorts POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cohort: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { cohortId, status, current_week, name } = body
  if (!cohortId) {
    return NextResponse.json({ error: 'cohortId es requerido' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (status !== undefined) {
    if (!['upcoming', 'active', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 })
    }
    updates.status = status
  }
  if (current_week !== undefined) {
    if (typeof current_week !== 'number' || current_week < 1 || current_week > 6) {
      return NextResponse.json({ error: 'current_week debe ser 1–6' }, { status: 400 })
    }
    updates.current_week = current_week
  }
  if (name !== undefined) updates.name = name.trim()

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('cohorts')
    .update(updates)
    .eq('id', cohortId)
    .select()
    .single()

  if (error) {
    console.error('[/api/admin/cohorts PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cohort: data })
}
