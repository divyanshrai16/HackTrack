import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { HackathonFull, Notification, Profile } from '@/types'
import DashboardClient from '../../components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (!user) redirect('/')

  const [{ data: profile }, { data: ownedHackathons }, { data: teamLinks }, { data: notifications }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('hackathons')
      .select(`
        *,
        rounds (*),
        team_members (*),
        resources (*),
        tasks (*)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('team_members').select('hackathon_id').eq('email', user.email ?? ''),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const teamHackathonIds = Array.from(new Set((teamLinks ?? []).map((link: { hackathon_id: string }) => link.hackathon_id)))

  const teamHackathons = teamHackathonIds.length > 0
    ? (await supabase
        .from('hackathons')
        .select(`
          *,
          rounds (*),
          team_members (*),
          resources (*),
          tasks (*)
        `)
        .in('id', teamHackathonIds)
        .neq('owner_id', user.id)
        .order('created_at', { ascending: false })).data ?? []
    : []

  const hackathons = Array.from(
    new Map(
      [...(ownedHackathons ?? []), ...teamHackathons].map((row: any) => [row.id, {
        ...row,
        owner: {
          full_name: profile?.full_name ?? user.email?.split('@')[0] ?? 'Dev',
          avatar_url: profile?.avatar_url ?? null,
          email: user.email ?? '',
        },
        rounds: row.rounds ?? [],
        team_members: row.team_members ?? [],
        resources: row.resources?.[0] ?? row.resources ?? null,
        tasks: row.tasks ?? [],
      } satisfies HackathonFull]),
    ).values(),
  )

  return (
    <DashboardClient
      user={user}
      profile={profile}
      initialHackathons={hackathons}
      initialNotifications={(notifications ?? []) as Notification[]}
      initialAccessToken={session?.access_token ?? null}
    />
  )
}