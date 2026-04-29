import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  let response = NextResponse.redirect(new URL(next, requestUrl.origin))

  // Debug: collect what cookies the server attempts to set during the auth flow
  const _cookiesSet: Array<{ name: string; value: string; options?: Record<string, unknown> }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const safeOptions = {
                path: '/',
                sameSite: 'lax',
                secure: true,
                ...(options ?? {}),
              }
              _cookiesSet.push({ name, value, options: safeOptions })
              response.cookies.set(name, value, safeOptions as any)
            })
          },
        },
    },
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // Log debug info to Vercel function logs so we can inspect what happened
  try {
    console.log('Auth callback - incoming request cookies:', request.cookies.getAll().map(c => ({ name: c.name })))
    console.log('Auth callback - cookies server attempted to set:', _cookiesSet.map(c => ({ name: c.name, options: c.options })))
    console.log('Auth callback - exchangeCodeForSession error:', error?.message ?? null)
  } catch (logErr) {
    // ignore logging errors
  }

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
  }

  console.log('Auth callback success, redirecting to:', next)
  return response
}