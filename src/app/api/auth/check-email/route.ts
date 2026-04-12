// POST /api/auth/check-email
// Verifica si un email está registrado en la tabla users antes de enviar OTP.
// Usa service role para leer sin depender del estado de sesión.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/utils/rate-limit'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
         ?? req.headers.get('x-real-ip')
         ?? 'unknown'
  const { allowed, retryAfterMs } = rateLimit(`check-email:${ip}`, 10, 60_000)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Esperá un momento.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((retryAfterMs ?? 60_000) / 1000)) },
      }
    )
  }

  let body: { email?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const { data, error } = await getServiceClient()
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('[/api/auth/check-email]', error)
    // En caso de error de DB, dejamos pasar para no bloquear al usuario legítimo
    return NextResponse.json({ exists: true })
  }

  return NextResponse.json({ exists: !!data })
}
