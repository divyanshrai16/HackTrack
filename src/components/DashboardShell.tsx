'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { HackathonFull, Notification, Profile } from '@/types'
import type { User } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

export default function DashboardShell() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    user: User
    profile: Profile | null
    initialHackathons: HackathonFull[]
    initialNotifications: Notification[]
  } | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return

      if (!session?.access_token) {
        router.replace('/')
        return
      }

      const response = await fetch('/api/dashboard/bootstrap', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      })
      const payload = await response.json()
      if (!mounted) return

      if (!response.ok) {
        const message = payload?.error ?? 'Failed to load dashboard'
        setError(message)
        if (message === 'Unauthorized') {
          router.replace('/')
        }
        setLoading(false)
        return
      }

      setData(payload.data)
      setLoading(false)
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-secondary">
        Loading dashboard...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-secondary p-6 text-center">
        <div>
          <p className="text-lg font-semibold text-text-primary mb-2">Unable to load dashboard</p>
          <p className="text-sm">{error ?? 'Please sign in again.'}</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardClient
      user={data.user}
      profile={data.profile}
      initialHackathons={data.initialHackathons}
      initialNotifications={data.initialNotifications}
      initialAccessToken={null}
    />
  )
}
