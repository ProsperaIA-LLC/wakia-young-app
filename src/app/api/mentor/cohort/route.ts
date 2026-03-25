// GET /api/mentor/cohort — get active cohort details
// PATCH /api/mentor/cohort — update cohort (current_week, status, name)
// Requires role === 'mentor' | 'admin'. Uses service role to bypass RLS.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function authCheck() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || !['mentor', 'admin'].includes(profile.role)) return null
  return user
}

export async function GET() {
  const user = await authCheck()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const service = getServiceClient()
  const { data: cohort, error } = await service
    .from('cohorts')
    .select('*')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also get weeks for this cohort
  let weeks: any[] = []
  if (cohort) {
    const { data } = await service
      .from('weeks')
      .select('id, week_number, phase, title, unlock_date, due_date')
      .eq('cohort_id', cohort.id)
      .order('week_number')
    weeks = data ?? []
  }

  return NextResponse.json({ cohort, weeks })
}

export async function PATCH(req: NextRequest) {
  const user = await authCheck()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { cohortId, current_week, status, name } = body
  if (!cohortId) return NextResponse.json({ error: 'cohortId requerido' }, { status: 400 })

  const updates: Record<string, any> = {}
  if (current_week !== undefined) updates.current_week = current_week
  if (status !== undefined) updates.status = status
  if (name !== undefined) updates.name = name

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('cohorts').update(updates).eq('id', cohortId).select().single()

  if (error) {
    console.error('[/api/mentor/cohort PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cohort: data })
}
