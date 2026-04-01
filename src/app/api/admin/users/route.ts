// GET  /api/admin/users — list all users with role + enrollment info
// PATCH /api/admin/users — update a user's role
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
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const service = getServiceClient()

  const { data, error } = await service
    .from('users')
    .select(`
      id, email, full_name, nickname, role, country, age,
      parent_consent, created_at,
      enrollments ( cohort_id, status, market, is_scholarship, enrolled_at,
        cohorts!enrollments_cohort_id_fkey ( name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[/api/admin/users GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

export async function PATCH(req: NextRequest) {
  const admin = await authCheck()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let body: { userId?: string; role?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 })
  }

  const { userId, role } = body
  if (!userId || !role) {
    return NextResponse.json({ error: 'userId y role son requeridos' }, { status: 400 })
  }
  if (!['student', 'mentor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'role debe ser student, mentor o admin' }, { status: 400 })
  }

  const service = getServiceClient()
  const { error } = await service
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    console.error('[/api/admin/users PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
