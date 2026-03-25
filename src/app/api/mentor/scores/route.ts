// POST /api/mentor/scores — upsert competency scores for a student
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

export async function POST(req: NextRequest) {
  const mentor = await authCheck()
  if (!mentor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const {
    student_id, cohort_id,
    validation_score, creation_score, communication_score, growth_score,
    attendance_percent, presented_at_demo_day, notes,
  } = body

  if (!student_id || !cohort_id) {
    return NextResponse.json({ error: 'student_id y cohort_id son requeridos' }, { status: 400 })
  }

  // Validate score ranges 0–4
  const scoreFields = { validation_score, creation_score, communication_score, growth_score }
  for (const [field, val] of Object.entries(scoreFields)) {
    if (val !== undefined && (typeof val !== 'number' || val < 0 || val > 4)) {
      return NextResponse.json({ error: `${field} debe ser un número entre 0 y 4` }, { status: 400 })
    }
  }

  if (attendance_percent !== undefined && (attendance_percent < 0 || attendance_percent > 100)) {
    return NextResponse.json({ error: 'attendance_percent debe estar entre 0 y 100' }, { status: 400 })
  }

  const service = getServiceClient()

  const { data, error } = await service
    .from('competency_scores')
    .upsert({
      student_id,
      cohort_id,
      validation_score:    validation_score    ?? 0,
      creation_score:      creation_score      ?? 0,
      communication_score: communication_score ?? 0,
      growth_score:        growth_score        ?? 0,
      attendance_percent:  attendance_percent  ?? 0,
      presented_at_demo_day: presented_at_demo_day ?? false,
      notes: notes ?? null,
      scored_by: mentor.id,
      scored_at: new Date().toISOString(),
    }, { onConflict: 'student_id,cohort_id' })
    .select()
    .single()

  if (error) {
    console.error('[/api/mentor/scores POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ scores: data })
}

export async function GET(req: NextRequest) {
  const mentor = await authCheck()
  if (!mentor) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const student_id = searchParams.get('student_id')
  const cohort_id  = searchParams.get('cohort_id')

  if (!student_id || !cohort_id) {
    return NextResponse.json({ error: 'student_id y cohort_id son requeridos' }, { status: 400 })
  }

  const service = getServiceClient()
  const { data, error } = await service
    .from('competency_scores')
    .select('*')
    .eq('student_id', student_id)
    .eq('cohort_id', cohort_id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ scores: data })
}
