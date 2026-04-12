// POST /api/chat — Luna AI tutor endpoint
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  chat,
  loadLunaContext,
  shouldEscalateToMentor,
  createEscalationAlert,
} from '@/lib/anthropic/luna'
import type { ChatRequest } from '@/types'

// In-flight request tracker per user — prevents concurrent requests that would
// bypass the daily limit check before the count is written to the DB.
const inFlight = new Set<string>()

export async function POST(request: Request) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Prevent concurrent requests from the same user
  if (inFlight.has(authUser.id)) {
    return NextResponse.json(
      { error: 'Ya hay una respuesta en proceso. Esperá un momento.' },
      { status: 429 }
    )
  }

  // 3. Parse and validate request body
  let body: ChatRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, cohortId, weekId } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Mensaje demasiado largo (máx. 2000 caracteres)' }, { status: 400 })
  }
  if (!cohortId || !weekId) {
    return NextResponse.json({ error: 'cohortId and weekId are required' }, { status: 400 })
  }

  inFlight.add(authUser.id)
  try {
    // 4. Load Luna context from DB
    const context = await loadLunaContext(authUser.id, cohortId, weekId)
    if (!context) {
      return NextResponse.json({ error: 'Could not load student context' }, { status: 500 })
    }

    // 5. Check for escalation before calling AI
    if (shouldEscalateToMentor(message)) {
      createEscalationAlert(authUser.id, cohortId, message).catch(err =>
        console.error('[Luna] Escalation alert failed:', err)
      )
    }

    // 6. Call Luna
    const result = await chat(authUser.id, body, context)

    return NextResponse.json({
      reply: result.reply,
      dailyCount: result.dailyCount,
      limitReached: result.limitReached,
      tokensUsed: result.tokensUsed,
      remaining: Math.max(0, 15 - result.dailyCount),
    })
  } finally {
    inFlight.delete(authUser.id)
  }
}
