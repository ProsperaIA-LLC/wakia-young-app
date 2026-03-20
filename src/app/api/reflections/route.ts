// POST /api/reflections
// Submit a Finnish-method reflection for the authenticated student.
//
// Business rules enforced SERVER-SIDE (CONTEXT.md §11):
//   Rule #1 — Reflections unlock ONLY on Sundays.
//             new Date().getDay() === 0 is checked here, never trusted from the client.
//             If not Sunday → 403. Full stop. No bypass possible.
//   Rule #2 — Student cannot submit reflection without submitting deliverable first.
//             deliverable.status must be 'submitted' or 'reviewed' for this week.
//             If not → 403. The client lock UI is a UX convenience only; this is the real gate.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // ── Rule #1: Sunday check — server clock, never the client ──────────────────
  // getDay() returns 0 for Sunday in the server's local time.
  // This is intentionally evaluated before parsing the body or touching the DB.
  if (new Date().getDay() !== 0) {
    return NextResponse.json(
      { error: 'Reflections can only be submitted on Sundays' },
      { status: 403 }
    )
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse + validate body ───────────────────────────────────────────────────
  let body: { weekId?: string; cohortId?: string; q1?: string; q2?: string; q3?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { weekId, cohortId, q1, q2, q3 } = body

  if (!weekId || !cohortId) {
    return NextResponse.json({ error: 'weekId and cohortId are required' }, { status: 400 })
  }

  const trimQ1 = (q1 ?? '').trim()
  const trimQ2 = (q2 ?? '').trim()
  const trimQ3 = (q3 ?? '').trim()

  if (!trimQ1 || !trimQ2 || !trimQ3) {
    return NextResponse.json({ error: 'q1, q2, and q3 are required and cannot be empty' }, { status: 400 })
  }

  // ── Verify enrollment ───────────────────────────────────────────────────────
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', authUser.id)
    .eq('cohort_id', cohortId)
    .eq('status', 'active')
    .single()

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this cohort' }, { status: 403 })
  }

  // ── Verify week belongs to this cohort ──────────────────────────────────────
  const { data: week } = await supabase
    .from('weeks')
    .select('id')
    .eq('id', weekId)
    .eq('cohort_id', cohortId)
    .single()

  if (!week) {
    return NextResponse.json({ error: 'Week not found in this cohort' }, { status: 404 })
  }

  // ── Rule #2: deliverable must be submitted first ─────────────────────────────
  // Accept 'submitted' or 'reviewed' — both mean the student did the work.
  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, status')
    .eq('user_id', authUser.id)
    .eq('week_id', weekId)
    .single()

  if (!deliverable || !['submitted', 'reviewed'].includes(deliverable.status)) {
    return NextResponse.json(
      { error: 'Deliverable must be submitted before completing the reflection' },
      { status: 403 }
    )
  }

  // ── Check existing reflection — block update if already submitted ────────────
  const { data: existing } = await supabase
    .from('reflections')
    .select('id, status')
    .eq('user_id', authUser.id)
    .eq('week_id', weekId)
    .single()

  if (existing?.status === 'submitted') {
    return NextResponse.json(
      { error: 'Reflection already submitted for this week' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  // ── Upsert reflection — UNIQUE(user_id, week_id) ────────────────────────────
  const { data: reflection, error: upsertError } = await supabase
    .from('reflections')
    .upsert(
      {
        user_id: authUser.id,
        week_id: weekId,
        cohort_id: cohortId,
        deliverable_id: deliverable.id,
        q1: trimQ1,
        q2: trimQ2,
        q3: trimQ3,
        status: 'submitted',
        submitted_at: now,
      },
      { onConflict: 'user_id,week_id' }
    )
    .select('id, user_id, week_id, cohort_id, deliverable_id, q1, q2, q3, status, submitted_at, created_at')
    .single()

  if (upsertError || !reflection) {
    console.error('[POST /api/reflections] upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 })
  }

  // ── Log to activity_log (fire-and-forget) ────────────────────────────────────
  supabase.from('activity_log').insert({
    user_id: authUser.id,
    cohort_id: cohortId,
    action: 'reflection_submitted',
    metadata: {
      week_id: weekId,
      reflection_id: reflection.id,
      deliverable_id: deliverable.id,
    },
  }).then(({ error }) => {
    if (error) console.error('[POST /api/reflections] activity_log error:', error)
  })

  return NextResponse.json({ reflection }, { status: 200 })
}
