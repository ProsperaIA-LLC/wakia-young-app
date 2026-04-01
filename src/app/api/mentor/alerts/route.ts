// PATCH /api/mentor/alerts — resolve one or all alerts for a cohort
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
    .from('users').select('role, id').eq('id', user.id).single()
  if (!profile || !['mentor', 'admin'].includes(profile.role)) return null
  return user
}

export async function PATCH(req: NextRequest) {
  const mentor = await authCheck()
  if (!mentor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { alertId, cohortId, resolveAll } = body
  const service = getServiceClient()
  const now = new Date().toISOString()

  // Resolve all unresolved alerts for a cohort at once
  if (resolveAll && cohortId) {
    // Verify the cohort exists (prevents resolving alerts in arbitrary cohorts)
    const { data: cohort } = await service
      .from('cohorts')
      .select('id')
      .eq('id', cohortId)
      .maybeSingle()

    if (!cohort) {
      return NextResponse.json({ error: 'Cohorte no encontrada' }, { status: 404 })
    }

    const { error } = await service
      .from('mentor_alerts')
      .update({ is_resolved: true, resolved_by: mentor.id, resolved_at: now })
      .eq('cohort_id', cohortId)
      .eq('is_resolved', false)

    if (error) {
      console.error('[/api/mentor/alerts PATCH resolveAll]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ resolved: 'all' })
  }

  // Resolve a single alert
  if (!alertId) {
    return NextResponse.json({ error: 'alertId o resolveAll+cohortId son requeridos' }, { status: 400 })
  }

  const { data, error } = await service
    .from('mentor_alerts')
    .update({ is_resolved: true, resolved_by: mentor.id, resolved_at: now })
    .eq('id', alertId)
    .select('id')
    .single()

  if (error) {
    console.error('[/api/mentor/alerts PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ resolved: data.id })
}
