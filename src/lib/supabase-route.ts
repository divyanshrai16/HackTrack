import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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
  const authClient = createRouteSupabaseClient(request, response)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
    throw new Error('Unauthorized')
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } },
  )

  const { data: { user }, error } = await authClient.auth.getUser()
  if (user && !error) {
    return { supabase: admin, user }
  }

  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (bearerToken) {
    const { data, error: tokenError } = await authClient.auth.getClaims(bearerToken)
    const subject = (data as any)?.claims?.sub
    if (!tokenError && subject) {
      const { data: userData, error: userError } = await admin.auth.admin.getUserById(subject)
      if (userData?.user && !userError) {
        return { supabase: admin, user: userData.user }
      }
    }
  }

  throw new Error('Unauthorized')
}
