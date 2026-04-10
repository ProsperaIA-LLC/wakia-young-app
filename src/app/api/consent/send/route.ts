// POST /api/consent/send
// Called from onboarding when student age < 18.
// Generates an HMAC consent token and sends a parent consent email via Resend.
// Requires an authenticated session — userId comes from the session, not the body.

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function generateConsentToken(userId: string): string {
  const secret = process.env.CONSENT_TOKEN_SECRET
  if (!secret) throw new Error('CONSENT_TOKEN_SECRET is not set')
  const sig = createHmac('sha256', secret).update(userId).digest('base64url')
  return `${userId}.${sig}`
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

  let body: { parentName?: string; parentEmail?: string; studentName?: string; market?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const parentName  = (body.parentName  ?? '').trim()
  const parentEmail = (body.parentEmail ?? '').trim().toLowerCase()
  const studentName = (body.studentName ?? user.user_metadata?.full_name ?? '').trim()
  const market      = (body.market      ?? user.user_metadata?.market    ?? 'LATAM') as string

  if (!parentEmail) {
    return NextResponse.json({ error: 'Email del tutor requerido' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[/api/consent/send] RESEND_API_KEY not set — skipping email')
    return NextResponse.json({ ok: true, skipped: true })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wakia.app'
  const from   = process.env.RESEND_FROM_EMAIL   ?? 'noreply@wakia.app'
  const token  = generateConsentToken(user.id)

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,'Segoe UI',system-ui,sans-serif;background:#f5f4f0;margin:0;padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(17,17,16,0.08);">

    <div style="background:#0E2A47;padding:28px 32px;">
      <div style="font-weight:900;font-size:18px;color:#00c896;letter-spacing:-0.02em;">WakiaYoung</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">Programa de IA para jóvenes latinos</div>
    </div>

    <div style="padding:32px;">
      <p style="font-size:15px;color:#111110;margin:0 0 16px;">Hola, <strong>${parentName || 'tutor/a'}</strong>:</p>

      <p style="font-size:15px;color:#3a3936;line-height:1.7;margin:0 0 16px;">
        <strong style="color:#111110;">${studentName}</strong> completó su registro en <strong>WakiaYoung</strong> —
        un programa intensivo de 6 semanas donde jóvenes de 14 a 18 años construyen productos reales con inteligencia artificial.
      </p>

      <p style="font-size:15px;color:#3a3936;line-height:1.7;margin:0 0 24px;">
        Como ${studentName} es menor de 18 años, necesitamos tu autorización para activar su acceso a la plataforma.
      </p>

      <div style="text-align:center;margin:28px 0;">
        <a href="${appUrl}/consent?token=${encodeURIComponent(token)}&name=${encodeURIComponent(studentName)}"
           style="display:inline-block;background:#0E2A47;color:#ffffff;border-radius:10px;padding:14px 32px;font-weight:800;font-size:15px;text-decoration:none;">
          Autorizar participación →
        </a>
      </div>

      <div style="background:#f5f4f0;border-radius:10px;padding:16px;margin:0 0 24px;">
        <p style="font-size:12px;font-weight:700;color:#8a8884;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">El programa incluye</p>
        <ul style="font-size:13px;color:#3a3936;line-height:1.8;margin:0;padding-left:18px;">
          <li>6 semanas de proyecto real con IA</li>
          <li>Mentoría personalizada cada semana</li>
          <li>Pod de 4–5 estudiantes de toda Latinoamérica</li>
          <li>Certificación internacional (FGU)</li>
          <li>Plataforma segura — sin redes sociales ni contacto externo</li>
        </ul>
      </div>

      <p style="font-size:13px;color:#8a8884;line-height:1.6;margin:0;">
        ¿Tenés preguntas? Escribinos a <a href="mailto:hola@wakia.app" style="color:#008ca5;">hola@wakia.app</a>.
      </p>
    </div>

    <div style="padding:16px 32px;border-top:1px solid rgba(17,17,16,0.08);">
      <p style="font-size:11px;color:#c5c2bb;margin:0;">© 2025 Wakia · Todos los derechos reservados</p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to:      [parentEmail],
        subject: `Autorización requerida: ${studentName} se inscribió en WakiaYoung`,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[/api/consent/send] Resend error:', err)
      return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 500 })
    }
  } catch (err) {
    console.error('[/api/consent/send] fetch error:', err)
    return NextResponse.json({ error: 'No se pudo enviar el email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
