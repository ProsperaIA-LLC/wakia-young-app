// PATCH /api/mentor/deliverables
// Mentor adds feedback to a student deliverable and marks it as 'reviewed'.
// Auth: role === 'mentor' | 'admin'

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
  if (!profile || !['mentor', 'admin'].includes(profile.role)) return null
  return user
}

export async function PATCH(req: NextRequest) {
  const mentor = await authCheck()
  if (!mentor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { deliverable_id?: string; mentor_feedback?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { deliverable_id, mentor_feedback } = body
  if (!deliverable_id || typeof mentor_feedback !== 'string' || !mentor_feedback.trim()) {
    return NextResponse.json({ error: 'deliverable_id y mentor_feedback son requeridos' }, { status: 400 })
  }

  const service = getServiceClient()

  const { error } = await service
    .from('deliverables')
    .update({
      mentor_feedback: mentor_feedback.trim(),
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', deliverable_id)

  if (error) {
    console.error('[PATCH /api/mentor/deliverables]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
