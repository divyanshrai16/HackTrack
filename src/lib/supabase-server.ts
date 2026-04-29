import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ─── Server Component / Route Handler client (respects RLS) ──────────────────
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          // In Server Components, Next.js forbids cookie mutation.
          // Route handlers use `createRouteSupabaseClient` for writable cookies.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // no-op in read-only cookie contexts
          }
        },
      },
    },
  )
}

// ─── Admin / Service-role client (bypasses RLS — server only!) ───────────────
// Only use in cron jobs and trusted server contexts
export function createAdminSupabaseClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── Get the currently authenticated user (throws if not authed) ──────────────
export async function getAuthUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { user, supabase }
}
