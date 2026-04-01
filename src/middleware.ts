import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/session'

// Routes that require an authenticated session (student)
const STUDENT_ROUTES = ['/dashboard', '/deliverables', '/pod', '/diary', '/project']

// Routes that require role === 'mentor'
const MENTOR_ROUTES = ['/mentor']

// Routes that require role === 'admin'
const ADMIN_ROUTES = ['/admin']

// Routes accessible only when NOT logged in
const AUTH_ROUTES = ['/login', '/register']

function redirect(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh session and get user
  const { supabaseResponse, supabase, user } = await updateSession(request)

  const isStudentRoute = STUDENT_ROUTES.some(r => pathname.startsWith(r))
  const isMentorRoute  = MENTOR_ROUTES.some(r => pathname.startsWith(r))
  const isAdminRoute   = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  const isAuthRoute    = AUTH_ROUTES.some(r => pathname.startsWith(r))
  const isOnboarding   = pathname.startsWith('/onboarding')

  // 1. Unauthenticated → /login
  if (!user && (isStudentRoute || isMentorRoute || isAdminRoute)) {
    return redirect(request, '/login')
  }

  if (user) {
    // 2. Authenticated but no nickname → /onboarding (skip if already there)
    if (!isOnboarding && (isStudentRoute || isMentorRoute || isAdminRoute)) {
      const { data: profile } = await supabase
        .from('users')
        .select('nickname, role')
        .eq('id', user.id)
        .single()

      if (!profile?.nickname) {
        return redirect(request, '/onboarding')
      }

      // 3. Mentor routes require role === 'mentor' or 'admin'
      if (isMentorRoute && !['mentor', 'admin'].includes(profile?.role)) {
        return redirect(request, '/dashboard')
      }

      // 4. Admin routes require role === 'admin' only
      if (isAdminRoute && profile?.role !== 'admin') {
        return redirect(request, '/dashboard')
      }
    }

    // 5. Logged-in users visiting /login or /register → /dashboard
    if (isAuthRoute) {
      return redirect(request, '/dashboard')
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
