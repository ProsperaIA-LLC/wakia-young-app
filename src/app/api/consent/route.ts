// POST /api/consent — Verify a signed consent token and set parent_consent=true.
// Called from the public /consent page (parent is NOT authenticated).
// Uses service role to bypass RLS.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/**
 * Verify a consent token of the form `<userId>.<base64url-hmac>`.
 * Returns the userId if valid, null otherwise.
 */
function verifyConsentToken(token: string): string | null {
  const secret = process.env.CONSENT_TOKEN_SECRET
  if (!secret) {
    console.error('[/api/consent] CONSENT_TOKEN_SECRET is not set')
    return null
  }
  const lastDot = token.lastIndexOf('.')
  if (lastDot === -1) return null

  const userId      = token.slice(0, lastDot)
  const receivedSig = token.slice(lastDot + 1)
  if (!userId || !receivedSig) return null

  const expectedSig = createHmac('sha256', secret).update(userId).digest('base64url')

  try {
    const a = Buffer.from(receivedSig)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  return userId
}

export async function POST(req: NextRequest) {
  let body: { token?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const token = (body.token ?? '').trim()
  if (!token) {
    return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
  }

  const userId = verifyConsentToken(token)
  if (!userId) {
    return NextResponse.json(
      { error: 'Enlace inválido o expirado. Revisá el email o contactá a hola@wakia.app.' },
      { status: 403 }
    )
  }

  const service = getServiceClient()

  const { data: student, error: lookupErr } = await service
    .from('users')
    .select('id, full_name, parent_consent, role')
    .eq('id', userId)
    .eq('role', 'student')
    .maybeSingle()

  if (lookupErr) {
    console.error('[/api/consent]', lookupErr)
    return NextResponse.json({ error: 'Error al buscar el estudiante' }, { status: 500 })
  }

  if (!student) {
    return NextResponse.json(
      { error: 'Enlace inválido o expirado. Revisá el email o contactá a hola@wakia.app.' },
      { status: 404 }
    )
  }

  // Already consented — idempotent success
  if (student.parent_consent) {
    return NextResponse.json({ ok: true, alreadyConsented: true, studentName: student.full_name })
  }

  const { error: updateErr } = await service
    .from('users')
    .update({ parent_consent: true })
    .eq('id', student.id)

  if (updateErr) {
    console.error('[/api/consent] update error:', updateErr)
    return NextResponse.json({ error: 'No se pudo guardar la autorización' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, studentName: student.full_name })
}
