import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

export function createRouteSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const safeOptions = {
              path: '/',
              sameSite: 'lax',
              secure: true,
              ...(options ?? {}),
            }
            response.cookies.set(name, value, safeOptions as any)
          })
        },
      },
    },
  )
}

export async function getRouteUser(request: NextRequest, response: NextResponse) {
  const supabase = createRouteSupabaseClient(request, response)

  const { data: { user }, error } = await supabase.auth.getUser()
  if (user && !error) {
    return { supabase, user }
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    const { data, error: tokenError } = await supabase.auth.getUser(bearerToken)
    if (data.user && !tokenError) {
      return { supabase, user: data.user }
    }
  }

  throw new Error('Unauthorized')
}
