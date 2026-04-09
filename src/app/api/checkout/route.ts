/**
 * POST /api/checkout
 *
 * Validates the enrollment form, picks the correct Stripe price ID
 * for the market + price type, and returns a Stripe Checkout URL.
 *
 * The browser then redirects to that URL.
 * On success, Stripe redirects to /apply?success=true&session_id=xxx
 * and the webhook (POST /api/webhooks) creates the enrollment.
 *
 * DEMO MODE: When STRIPE_SECRET_KEY is not configured, skips Stripe entirely,
 * creates the enrollment directly in Supabase, and returns the login URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { createClient } from '@supabase/supabase-js'
import type { Market, Database } from '@/types'
import type { PriceType } from '@/lib/stripe/checkout'

function isDemoMode() {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  return !key || key.startsWith('REEMPLAZAR') || key.startsWith('sk_test_REPLACE')
}

function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

async function createDemoEnrollment(params: {
  market: Market
  studentName: string
  studentEmail: string
  studentAge: number
  country: string
}): Promise<string> {
  const { market, studentName, studentEmail, studentAge, country } = params
  const db = adminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // 1. Find or create Supabase auth user
  let userId: string
  const { data: existingUser } = await db
    .from('users')
    .select('id')
    .eq('email', studentEmail.toLowerCase())
    .maybeSingle()

  if (existingUser) {
    userId = existingUser.id
  } else {
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email:         studentEmail.toLowerCase(),
      email_confirm: true,
      user_metadata: { full_name: studentName },
    })
    if (authErr || !authData.user) throw new Error(authErr?.message ?? 'No se pudo crear el usuario')
    userId = authData.user.id

    await db.from('users').insert({
      id:             userId,
      email:          studentEmail.toLowerCase(),
      full_name:      studentName,
      country:        country || null,
      age:            studentAge || null,
      market,
      role:           'student',
      parent_consent: studentAge >= 18,
    })
  }

  // 2. Find active/upcoming cohort for this market
  const { data: cohort } = await db
    .from('cohorts')
    .select('id')
    .eq('market', market)
    .in('status', ['active', 'upcoming'])
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (cohort) {
    await db.from('enrollments').upsert(
      {
        user_id:        userId,
        cohort_id:      cohort.id,
        market,
        price_paid_usd: 0,
        is_scholarship: false,
        status:         'active',
      },
      { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
    )
  }

  // 3. Send magic link so student can log in immediately
  await db.auth.admin.generateLink({
    type:       'magiclink',
    email:      studentEmail.toLowerCase(),
    options:    { redirectTo: `${appUrl}/auth/callback?next=/onboarding` },
  })

  return `${appUrl}/login?demo=true&email=${encodeURIComponent(studentEmail)}`
}

export async function POST(req: NextRequest) {
  let body: {
    market?:       string
    priceType?:    string
    studentName?:  string
    studentEmail?: string
    studentAge?:   number
    country?:      string
    parentName?:   string
    parentEmail?:  string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { market, priceType, studentName, studentEmail, studentAge, country, parentName, parentEmail } = body

  // ── Validation ────────────────────────────────────────────────────────────

  if (!market || !['USA', 'LATAM'].includes(market)) {
    return NextResponse.json({ error: 'Mercado inválido (USA o LATAM)' }, { status: 400 })
  }
  if (!priceType || !['full', 'early'].includes(priceType)) {
    return NextResponse.json({ error: 'Tipo de precio inválido' }, { status: 400 })
  }
  if (!studentName?.trim()) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }
  if (!studentEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  if (!studentAge || studentAge < 10 || studentAge > 25) {
    return NextResponse.json({ error: 'La edad debe estar entre 10 y 25 años' }, { status: 400 })
  }
  if (!country?.trim()) {
    return NextResponse.json({ error: 'El país es requerido' }, { status: 400 })
  }
  // Parent info required for under 18 (CONTEXT.md §11 rule 3)
  if (studentAge < 18) {
    if (!parentName?.trim()) {
      return NextResponse.json({ error: 'El nombre del padre/tutor es requerido para menores de 18' }, { status: 400 })
    }
    if (!parentEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      return NextResponse.json({ error: 'El email del padre/tutor es requerido para menores de 18' }, { status: 400 })
    }
  }

  // ── Demo mode: Stripe not configured ─────────────────────────────────────

  if (isDemoMode()) {
    try {
      const url = await createDemoEnrollment({
        market:       market as Market,
        studentName:  studentName.trim(),
        studentEmail: studentEmail.trim().toLowerCase(),
        studentAge,
        country:      country.trim(),
      })
      return NextResponse.json({ url })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado'
      console.error('[/api/checkout demo]', message)
      return NextResponse.json({ error: 'No se pudo crear la inscripción de demo.' }, { status: 500 })
    }
  }

  // ── Create Stripe session ─────────────────────────────────────────────────

  try {
    const url = await createCheckoutSession({
      market:       market as Market,
      priceType:    priceType as PriceType,
      studentName:  studentName.trim(),
      studentEmail: studentEmail.trim().toLowerCase(),
      studentAge,
      country:      country.trim(),
      parentName:   parentName?.trim(),
      parentEmail:  parentEmail?.trim().toLowerCase(),
    })

    return NextResponse.json({ url })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    console.error('[/api/checkout]', message)

    if (message.startsWith('Missing Stripe price ID')) {
      return NextResponse.json({ error: 'Configuración de pago incompleta. Contactanos.' }, { status: 500 })
    }
    return NextResponse.json({ error: 'No se pudo iniciar el pago. Intentá de nuevo.' }, { status: 500 })
  }
}
