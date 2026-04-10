// POST /api/onboarding/save
// Saves the onboarding profile for the authenticated user.
// Uses service role to handle the case where a users row already exists
// with the same email but a different id (e.g. from a prior registration or scholarship approval).

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function POST(req: NextRequest) {
  // Authenticate via session
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: {
    nickname?: string
    country?: string
    timezone?: string
    avatar?: string
    market?: string
    fullName?: string
    age?: number
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { nickname, country, timezone, avatar, market, fullName, age } = body

  if (!nickname || !country) {
    return NextResponse.json({ error: 'nickname y country son requeridos' }, { status: 400 })
  }

  const service = getServiceClient()

  // Check if a row already exists with this email (but possibly a different id)
  const { data: existingByEmail } = await service
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .maybeSingle()

  if (existingByEmail && existingByEmail.id !== user.id) {
    // There's a stale row with the same email but wrong id.
    // Updating the PK (id) is blocked by the FK to auth.users, so delete the stale row instead.
    await service
      .from('users')
      .delete()
      .eq('email', user.email!)
  }

  // Now upsert safely — email conflict is resolved above
  const { error: upsertError } = await service
    .from('users')
    .upsert({
      id:             user.id,
      email:          user.email!,
      full_name:      fullName ?? nickname,
      nickname,
      country,
      timezone:       timezone ?? 'America/Bogota',
      market:         market ?? (country === 'US' ? 'USA' : 'LATAM'),
      avatar_url:     avatar ?? '😎',
      age:            age || null,
      parent_consent: (age ?? 18) >= 18,
      role:           'student',
    }, { onConflict: 'id' })

  if (upsertError) {
    console.error('[/api/onboarding/save]', upsertError)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // Verify the save worked
  const { data: saved } = await service
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  if (!saved?.nickname) {
    return NextResponse.json({ error: 'No se pudo verificar el perfil guardado' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
