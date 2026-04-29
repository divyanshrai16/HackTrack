import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client — safe to call multiple times
export function createClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, return a noop proxy that throws if used.
  // This prevents a hard crash during import while making the error
  // explicit when the client is actually invoked.
  if (!url || !key) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase client not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      )
    }

    const noop: any = new Proxy(
      {},
      {
        get() {
          return () => {
            throw new Error(
              'Supabase client not configured. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
            )
          }
        },
      },
    )

    return noop
  }

  return createBrowserClient(url, key)
}
