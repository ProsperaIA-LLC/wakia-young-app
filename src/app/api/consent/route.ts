// POST /api/consent — Set parent_consent=true for a student by name + parent email.
// Called from the public /consent page (parent is NOT authenticated).
// Uses service role to bypass RLS.

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
  let body: { studentName?: string; parentEmail?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const studentName = (body.studentName ?? '').trim()
  if (!studentName) {
    return NextResponse.json({ error: 'Nombre de estudiante requerido' }, { status: 400 })
  }

  const service = getServiceClient()

  // Look up student by full_name — name is set at enrollment time from Stripe metadata
  const { data: student, error: lookupErr } = await service
    .from('users')
    .select('id, parent_consent, role')
    .eq('full_name', studentName)
    .eq('role', 'student')
    .maybeSingle()

  if (lookupErr) {
    console.error('[/api/consent]', lookupErr)
    return NextResponse.json({ error: 'Error al buscar el estudiante' }, { status: 500 })
  }

  if (!student) {
    return NextResponse.json(
      { error: 'No encontramos un estudiante con ese nombre. Revisá el enlace o contactá a hola@prosperayoung.ai.' },
      { status: 404 }
    )
  }

  // Already consented — idempotent success
  if (student.parent_consent) {
    return NextResponse.json({ ok: true, alreadyConsented: true })
  }

  const { error: updateErr } = await service
    .from('users')
    .update({ parent_consent: true })
    .eq('id', student.id)

  if (updateErr) {
    console.error('[/api/consent] update error:', updateErr)
    return NextResponse.json({ error: 'No se pudo guardar la autorización' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
