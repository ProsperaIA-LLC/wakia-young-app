// POST /api/auth/check-email
// Verifica si un email está registrado en la tabla users antes de enviar OTP.
// Usa service role para leer sin depender del estado de sesión.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
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
