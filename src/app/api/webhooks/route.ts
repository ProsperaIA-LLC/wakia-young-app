/**
 * POST /api/webhooks — Stripe webhook handler
 *
 * Handles checkout.session.completed:
 *   1. Verify Stripe signature (raw body required)
 *   2. Find or create the student's Supabase account
 *   3. Find the active/upcoming cohort for the market
 *   4. Create enrollment record in the DB
 *   5. If student age < 18 → send parent consent email
 *
 * Always returns 200 to Stripe (even on partial errors) to prevent
 * infinite retries. Errors are logged for manual recovery.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createHmac } from 'crypto'
import { getStripe } from '@/lib/stripe/checkout'
import { createClient } from '@supabase/supabase-js'
import type { Database, Market } from '@/types'

/** Generate a signed token for parent consent. Token = `<userId>.<hmac>`. */
function generateConsentToken(userId: string): string {
  const secret = process.env.CONSENT_TOKEN_SECRET
  if (!secret) throw new Error('CONSENT_TOKEN_SECRET is not set')
  const sig = createHmac('sha256', secret).update(userId).digest('base64url')
  return `${userId}.${sig}`
}

// Raw body is needed for Stripe signature verification.
// Next.js App Router does not auto-parse the body, so req.text() works directly.

/** Supabase admin client — uses SERVICE_ROLE key, bypasses RLS. */
function adminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

/** Send parent consent email via Resend (no SDK — plain fetch). */
async function sendParentConsentEmail(opts: {
  parentName:   string
  parentEmail:  string
  studentName:  string
  studentId:    string
  market:       Market
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[webhook] RESEND_API_KEY not set — skipping parent consent email')
    return
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wakia.app'
  const from    = process.env.RESEND_FROM_EMAIL   ?? 'noreply@wakia.app'
  const subject = `Autorización requerida: ${opts.studentName} se inscribió en WakiaYoung`
  const token   = generateConsentToken(opts.studentId)

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,'Segoe UI',system-ui,sans-serif;background:#f5f4f0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(17,17,16,0.08);">

    <!-- Header -->
    <div style="background:#0E2A47;padding:28px 32px;">
      <div style="font-weight:900;font-size:18px;color:#00c896;letter-spacing:-0.02em;">WakiaYoung</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">Programa de IA para jóvenes latinos</div>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:15px;color:#111110;margin:0 0 16px;">Hola, <strong>${opts.parentName}</strong>:</p>

      <p style="font-size:15px;color:#3a3936;line-height:1.7;margin:0 0 16px;">
        <strong style="color:#111110;">${opts.studentName}</strong> se inscribió en <strong>WakiaYoung</strong> —
        un programa intensivo de 6 semanas donde jóvenes de 14 a 18 años construyen productos reales con inteligencia artificial.
      </p>

      <p style="font-size:15px;color:#3a3936;line-height:1.7;margin:0 0 24px;">
        Como ${opts.studentName} es menor de 18 años, necesitamos tu autorización para que pueda acceder a la plataforma.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${appUrl}/consent?token=${encodeURIComponent(token)}&name=${encodeURIComponent(opts.studentName)}"
           style="display:inline-block;background:#0E2A47;color:#ffffff;border-radius:10px;padding:14px 32px;font-weight:800;font-size:15px;text-decoration:none;">
          Autorizar participación →
        </a>
      </div>

      <div style="background:#f5f4f0;border-radius:10px;padding:16px;margin:0 0 24px;">
        <p style="font-size:12px;font-weight:700;color:#8a8884;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Qué incluye el programa</p>
        <ul style="font-size:13px;color:#3a3936;line-height:1.8;margin:0;padding-left:18px;">
          <li>6 semanas de proyecto real con IA</li>
          <li>Mentoría personalizada cada semana</li>
          <li>Pod de 4–5 estudiantes de toda Latinoamérica</li>
          <li>Certificación internacional (FGU)</li>
        </ul>
      </div>

      <p style="font-size:13px;color:#8a8884;line-height:1.6;margin:0;">
        Si tenés preguntas, escribinos a <a href="mailto:hola@wakia.app" style="color:#008ca5;">hola@wakia.app</a>.<br>
        Mercado: <strong>${opts.market}</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid rgba(17,17,16,0.08);">
      <p style="font-size:11px;color:#c5c2bb;margin:0;">
        © 2025 Wakia · Todos los derechos reservados
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ from, to: opts.parentEmail, subject, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error('[webhook] Resend error:', res.status, body)
    }
  } catch (err) {
    console.error('[webhook] Failed to send parent consent email:', err)
  }
}

// ── Webhook handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // ── 1. Verify Stripe signature ───────────────────────────────────────────

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[webhook] Signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook signature invalid: ${msg}` }, { status: 400 })
  }

  // ── 2. Only handle checkout.session.completed ────────────────────────────

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session  = event.data.object
  const meta     = session.metadata ?? {}

  const studentName  = meta.student_name  ?? ''
  const studentEmail = meta.student_email ?? ''
  const studentAge   = parseInt(meta.student_age ?? '0', 10)
  const country      = meta.country       ?? ''
  const market       = meta.market        as Market
  const priceType    = meta.price_type    ?? 'full'
  const parentName   = meta.parent_name   ?? ''
  const parentEmail  = meta.parent_email  ?? ''
  const amountPaid   = (session.amount_total ?? 0) / 100   // cents → USD

  if (!studentEmail || !market) {
    console.error('[webhook] Missing required metadata — manual recovery needed', meta)
    return NextResponse.json({ received: true })   // 200 so Stripe doesn't retry
  }

  const db = adminClient()

  // ── 3. Find or create Supabase auth user ────────────────────────────────

  let userId: string

  // Check our custom users table first
  const { data: existingUser } = await db
    .from('users')
    .select('id')
    .eq('email', studentEmail.toLowerCase())
    .maybeSingle()

  if (existingUser) {
    userId = existingUser.id
  } else {
    // Create Supabase Auth user — confirmed=true (they paid, email verified at checkout)
    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email:            studentEmail.toLowerCase(),
      email_confirm:    true,
      user_metadata: { full_name: studentName },
    })

    if (authErr || !authData.user) {
      console.error('[webhook] Failed to create auth user:', authErr?.message)
      return NextResponse.json({ received: true })
    }

    userId = authData.user.id

    // Insert into our public users table
    const { error: userInsertErr } = await db.from('users').insert({
      id:            userId,
      email:         studentEmail.toLowerCase(),
      full_name:     studentName,
      country:       country || null,
      age:           studentAge || null,
      market:        market,
      role:          'student',
      parent_consent: studentAge >= 18,  // auto-consent for adults
    })

    if (userInsertErr) {
      console.error('[webhook] Failed to insert users row:', userInsertErr.message)
      // Auth user was created — enrollment should still happen
    }
  }

  // ── 4. Find the cohort to enroll into ───────────────────────────────────

  // Prefer active cohort, fall back to upcoming cohort for the market
  const { data: cohort } = await db
    .from('cohorts')
    .select('id')
    .eq('market', market)
    .in('status', ['active', 'upcoming'])
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!cohort) {
    console.error(`[webhook] No active/upcoming cohort found for market=${market}. Enrollment skipped.`)
    // Don't fail — user account was created, admin can enroll manually
    return NextResponse.json({ received: true })
  }

  // ── 5. Create enrollment ─────────────────────────────────────────────────

  const { error: enrollErr } = await db.from('enrollments').upsert(
    {
      user_id:           userId,
      cohort_id:         cohort.id,
      market,
      price_paid_usd:    amountPaid,
      is_scholarship:    false,
      stripe_payment_id: session.payment_intent as string ?? session.id,
      status:            'active',
    },
    { onConflict: 'user_id,cohort_id', ignoreDuplicates: true }
  )

  if (enrollErr) {
    console.error('[webhook] Failed to create enrollment:', enrollErr.message)
  } else {
    console.log(`[webhook] Enrolled ${studentEmail} (age ${studentAge}) in cohort ${cohort.id} — ${market} ${priceType} $${amountPaid}`)
  }

  // ── 6. Parent consent email (age < 18) ──────────────────────────────────
  // CONTEXT.md §11 rule 3 + §8 pricing rule

  if (studentAge < 18 && parentEmail) {
    await sendParentConsentEmail({
      parentName:  parentName || 'Padre/Tutor',
      parentEmail,
      studentName,
      studentId:   userId,
      market,
    })
    console.log(`[webhook] Parent consent email sent to ${parentEmail} for ${studentName}`)
  }

  return NextResponse.json({ received: true })
}
