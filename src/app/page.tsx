import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import LoginClient from '@/components/LoginClient'

export default async function HomePage() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/dashboard')
    }
  } catch {
    // If the session lookup fails, show the login page instead of crashing.
  }

  return <LoginClient />
}
