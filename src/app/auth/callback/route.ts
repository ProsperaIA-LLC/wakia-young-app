import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type') as EmailOtpType | null
  const next       = searchParams.get('next') ?? '/dashboard'

  // Collect cookies written during the auth exchange so we can attach them
  // directly to the redirect response. Using next/headers + NextResponse.redirect
  // creates two separate response objects — the Set-Cookie headers from the
  // cookie store are NOT automatically merged onto the redirect, so the browser
  // never receives the session and the middleware sees no user on the next request.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push({ name, value, options: options ?? {} })
          )
        },
      },
    }
  )

  // ── PKCE flow (code) ──────────────────────────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // ── Magic link / OTP flow (token_hash) ───────────────────────
  else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  else {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // ── Redirect: onboarding if new user, dashboard if existing ──
  const { data: { user } } = await supabase.auth.getUser()

  let redirectTo = `${origin}${next}`
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('nickname')
      .eq('id', user.id)
      .single()

    if (!profile?.nickname) {
      redirectTo = `${origin}/onboarding`
    }
  }

  // Attach all session cookies directly to the redirect response
  const response = NextResponse.redirect(redirectTo)
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  )
  return response
}
