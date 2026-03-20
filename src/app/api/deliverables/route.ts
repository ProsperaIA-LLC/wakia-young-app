// POST /api/deliverables
// Create or update a deliverable for the authenticated student.
//
// Business rules enforced here (CONTEXT.md §11):
//   - Student must be actively enrolled in the given cohort
//   - The week must belong to that cohort
//   - A deliverable already marked 'reviewed' (mentor gave feedback) cannot be re-submitted
//   - content must be non-empty
//   - Submitting a deliverable is the prerequisite for unlocking the reflection form
//     (the reflection gate lives in /api/reflections — it checks deliverable status there)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse + validate body
  let body: { weekId?: string; cohortId?: string; content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { weekId, cohortId, content } = body

  if (!weekId || !cohortId) {
    return NextResponse.json({ error: 'weekId and cohortId are required' }, { status: 400 })
  }

  const trimmedContent = (content ?? '').trim()
  if (!trimmedContent) {
    return NextResponse.json({ error: 'content cannot be empty' }, { status: 400 })
  }

  // 3. Verify enrollment: student must be active in this cohort
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

  // 4. Verify week belongs to this cohort
  const { data: week } = await supabase
    .from('weeks')
    .select('id')
    .eq('id', weekId)
    .eq('cohort_id', cohortId)
    .single()

  if (!week) {
    return NextResponse.json({ error: 'Week not found in this cohort' }, { status: 404 })
  }

  // 5. Check existing deliverable — block re-submission if already reviewed
  const { data: existing } = await supabase
    .from('deliverables')
    .select('id, status')
    .eq('user_id', authUser.id)
    .eq('week_id', weekId)
    .single()

  if (existing?.status === 'reviewed') {
    return NextResponse.json(
      { error: 'Deliverable has already been reviewed by a mentor and cannot be changed' },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()

  // 6. Upsert deliverable — UNIQUE(user_id, week_id) guarantees one row per student per week
  const { data: deliverable, error: upsertError } = await supabase
    .from('deliverables')
    .upsert(
      {
        user_id: authUser.id,
        week_id: weekId,
        cohort_id: cohortId,
        content: trimmedContent,
        status: 'submitted',
        submitted_at: now,
      },
      { onConflict: 'user_id,week_id' }
    )
    .select('id, user_id, week_id, cohort_id, content, status, submitted_at, mentor_feedback, created_at')
    .single()

  if (upsertError || !deliverable) {
    console.error('[POST /api/deliverables] upsert error:', upsertError)
    return NextResponse.json({ error: 'Failed to save deliverable' }, { status: 500 })
  }

  // 7. Log to activity_log (fire-and-forget — don't block the response on this)
  supabase.from('activity_log').insert({
    user_id: authUser.id,
    cohort_id: cohortId,
    action: 'deliverable_submitted',
    metadata: {
      week_id: weekId,
      deliverable_id: deliverable.id,
    },
  }).then(({ error }) => {
    if (error) console.error('[POST /api/deliverables] activity_log error:', error)
  })

  return NextResponse.json({ deliverable }, { status: 200 })
}
