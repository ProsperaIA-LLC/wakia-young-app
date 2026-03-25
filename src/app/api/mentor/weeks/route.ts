// POST /api/mentor/weeks — create a new week for the active cohort
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

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || !['mentor', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Solo mentores pueden crear semanas' }, { status: 403 })
  }

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { cohort_id, week_number, phase, title, opening_question,
          deliverable_description, success_signal, reflection_q1,
          reflection_q2, tools, unlock_date, due_date } = body

  if (!cohort_id || !week_number || !phase || !title || !opening_question ||
      !deliverable_description || !success_signal || !unlock_date || !due_date) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service.from('weeks').insert({
    cohort_id, week_number, phase, title, opening_question,
    deliverable_description, success_signal,
    reflection_q1: reflection_q1 || '',
    reflection_q2: reflection_q2 || '',
    tools: tools || [],
    unlock_date, due_date,
  }).select().single()

  if (error) {
    console.error('[/api/mentor/weeks POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ week: data }, { status: 201 })
}
