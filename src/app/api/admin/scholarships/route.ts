// GET   /api/admin/scholarships — all scholarship applications
// PATCH /api/admin/scholarships — approve (creates user + enrollment) or reject
// Requires role === 'admin'. Uses service role.

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
    .from('users').select('role, id').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return { ...user, adminId: user.id }
}

export async function GET() {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const service = getServiceClient()
  const { data, error } = await service
    .from('scholarship_applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ applications: data ?? [] })
}

export async function PATCH(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { applicationId, action } = body
  if (!applicationId || !action) {
    return NextResponse.json({ error: 'applicationId y action son requeridos' }, { status: 400 })
  }
  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action debe ser approve o reject' }, { status: 400 })
  }

  const service = getServiceClient()

  // Load the application
  const { data: app, error: appErr } = await service
    .from('scholarship_applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appErr || !app) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }
  if (app.status !== 'pending') {
    return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 409 })
  }

  if (action === 'reject') {
    const { error } = await service
      .from('scholarship_applications')
      .update({ status: 'rejected' })
      .eq('id', applicationId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, status: 'rejected' })
  }

  // ── APPROVE: create Supabase Auth user + users row + enrollment ──────────────

  // 1. Find the active cohort for the applicant's market (or first active cohort)
  const market = app.country === 'US' ? 'USA' : 'LATAM'
  const { data: cohort } = await service
    .from('cohorts')
    .select('id, market')
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!cohort) {
    return NextResponse.json(
      { error: 'No hay una cohorte activa para asignar al becario' },
      { status: 422 }
    )
  }

  // 2. Create Auth user (magic link — no password)
  const { data: authData, error: authErr } = await service.auth.admin.createUser({
    email: app.email,
    email_confirm: true,
    user_metadata: {
      full_name: app.full_name,
      age: app.age,
      country: app.country,
    },
  })

  if (authErr) {
    // If user already exists, look them up
    if (!authErr.message.includes('already registered')) {
      console.error('[/api/admin/scholarships approve] createUser:', authErr)
      return NextResponse.json({ error: 'Error creando la cuenta: ' + authErr.message }, { status: 500 })
    }
  }

  const authUserId = authData?.user?.id

  // 3. Upsert users row
  if (authUserId) {
    await service.from('users').upsert({
      id: authUserId,
      email: app.email,
      full_name: app.full_name,
      age: app.age ?? null,
      country: app.country ?? null,
      role: 'student',
      parent_consent: (app.age ?? 18) >= 18,
      market,
    }, { onConflict: 'id' })

    // 4. Create enrollment
    await service.from('enrollments').upsert({
      user_id: authUserId,
      cohort_id: cohort.id,
      market: cohort.market,
      price_paid_usd: 0,
      is_scholarship: true,
      status: 'active',
    }, { onConflict: 'user_id,cohort_id' })
  }

  // 5. Mark application approved
  const { error: updateErr } = await service
    .from('scholarship_applications')
    .update({ status: 'approved' })
    .eq('id', applicationId)

  if (updateErr) {
    console.error('[/api/admin/scholarships approve] update:', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: 'approved', userId: authUserId ?? null })
}
