// POST /api/admin/create-user — creates an auth user + public.users profile
// Requires role === 'admin'. Uses service role.
// Sends an invite email via Supabase so the user can set up their session.

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
  if (profile?.role !== 'admin') return null
  return user
}

export async function POST(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: {
    email?: string
    full_name?: string
    nickname?: string
    role?: string
    country?: string
    age?: number
    market?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { email, full_name, nickname, role, country, age, market } = body

  if (!email || !full_name || !role) {
    return NextResponse.json({ error: 'email, full_name y role son requeridos' }, { status: 400 })
  }
  if (!['student', 'mentor'].includes(role)) {
    return NextResponse.json({ error: 'role debe ser student o mentor' }, { status: 400 })
  }

  const service = getServiceClient()

  // 1. Create auth user and send invite email
  const { data: inviteData, error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`,
  })

  if (inviteError) {
    console.error('[/api/admin/create-user invite]', inviteError)
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  const userId = inviteData.user.id

  // 2. Insert public profile immediately with correct role
  const { error: profileError } = await service
    .from('users')
    .upsert({
      id: userId,
      email,
      full_name,
      nickname: nickname || null,
      role,
      country: country || null,
      age: age || null,
      market: market || (country === 'US' ? 'USA' : 'LATAM'),
      parent_consent: role === 'mentor' ? true : false,
    })

  if (profileError) {
    console.error('[/api/admin/create-user profile]', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId })
}
