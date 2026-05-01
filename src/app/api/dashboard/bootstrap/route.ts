import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'
import type { HackathonFull, Notification, Profile } from '@/types'

function normalizeHackathon(row: any): HackathonFull {
  return {
    ...row,
    rounds: (row.rounds ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    team_members: row.team_members ?? [],
    resources: Array.isArray(row.resources) ? row.resources[0] ?? null : row.resources ?? null,
    tasks: row.tasks ?? [],
    owner: row.owner ?? { full_name: '', avatar_url: null, email: '' },
  }
}

async function loadHackathons(admin: ReturnType<typeof createAdminClient>, userId: string, email: string | null) {
  const [{ data: owned }, { data: teamLinks }] = await Promise.all([
    admin
      .from('hackathons')
      .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }),
    admin
      .from('team_members')
      .select('hackathon_id')
      .eq('email', email ?? ''),
  ])

  const teamHackathonIds = Array.from(new Set((teamLinks ?? []).map((link: { hackathon_id: string }) => link.hackathon_id)))

  const { data: teamHackathons } = teamHackathonIds.length
    ? await admin
        .from('hackathons')
        .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
        .in('id', teamHackathonIds)
        .neq('owner_id', userId)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const merged = [...(owned ?? []), ...(teamHackathons ?? [])]
  return Array.from(new Map(merged.map((row: any) => [row.id, normalizeHackathon(row)])).values())
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: null })

  try {
    const { supabase: admin, user } = await getRouteUser(request, response)

    const [{ data: profile }, { data: notifications }] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ])

    const hackathons = await loadHackathons(admin, user.id, user.email ?? null)

    return NextResponse.json({
      data: {
        user,
        profile: profile as Profile | null,
        initialHackathons: hackathons,
        initialNotifications: (notifications ?? []) as Notification[],
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 })
  }
}
