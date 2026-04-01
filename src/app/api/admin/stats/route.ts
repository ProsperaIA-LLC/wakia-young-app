// GET /api/admin/stats — platform-wide metrics for the admin dashboard.
// Requires role === 'admin'. Uses service role.

import { NextResponse } from 'next/server'
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

  const [
    userCountsRes,
    enrollmentRes,
    revenueRes,
    activeCohortRes,
    pendingScholarshipsRes,
    recentEnrollmentsRes,
    allCohortsRes,
  ] = await Promise.all([
    // Users by role
    service.from('users').select('role'),

    // Total enrollments
    service.from('enrollments').select('id', { count: 'exact', head: true }),

    // Total revenue (sum of price_paid_usd)
    service.from('enrollments').select('price_paid_usd').not('price_paid_usd', 'is', null),

    // Active cohort
    service.from('cohorts')
      .select('id, name, market, status, current_week, start_date, end_date, max_students')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Pending scholarship applications
    service.from('scholarship_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Last 10 enrollments with user info
    service.from('enrollments')
      .select(`
        id, user_id, cohort_id, market, price_paid_usd, is_scholarship,
        status, enrolled_at,
        users!enrollments_user_id_fkey ( full_name, nickname, country ),
        cohorts!enrollments_cohort_id_fkey ( name )
      `)
      .order('enrolled_at', { ascending: false })
      .limit(10),

    // All cohorts count
    service.from('cohorts').select('status'),
  ])

  // Role counts
  const users = userCountsRes.data ?? []
  const usersByRole = {
    students: users.filter(u => u.role === 'student').length,
    mentors:  users.filter(u => u.role === 'mentor').length,
    admins:   users.filter(u => u.role === 'admin').length,
    total:    users.length,
  }

  // Revenue
  const totalRevenue = (revenueRes.data ?? [])
    .reduce((sum, e) => sum + (e.price_paid_usd ?? 0), 0)

  // Cohort counts
  const cohorts = allCohortsRes.data ?? []
  const cohortCounts = {
    upcoming:  cohorts.filter(c => c.status === 'upcoming').length,
    active:    cohorts.filter(c => c.status === 'active').length,
    completed: cohorts.filter(c => c.status === 'completed').length,
    total:     cohorts.length,
  }

  return NextResponse.json({
    usersByRole,
    totalEnrollments: enrollmentRes.count ?? 0,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    activeCohort: activeCohortRes.data ?? null,
    pendingScholarships: pendingScholarshipsRes.count ?? 0,
    cohortCounts,
    recentEnrollments: (recentEnrollmentsRes.data ?? []).map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      market: e.market,
      pricePaid: e.price_paid_usd,
      isScholarship: e.is_scholarship,
      enrolledAt: e.enrolled_at,
      student: e.users
        ? { fullName: e.users.full_name, nickname: e.users.nickname, country: e.users.country }
        : null,
      cohortName: e.cohorts?.name ?? null,
    })),
  })
}
