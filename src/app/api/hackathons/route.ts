import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { HackathonFull, CreateHackathonPayload } from '@/types'
import { getRouteUser, createRouteSupabaseClient } from '@/lib/supabase-route'

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

async function loadHackathonsForUser(request: NextRequest, response: NextResponse, userId: string, email: string | null) {
  const supabase = createRouteSupabaseClient(request, response)

  const [{ data: owned }, { data: teamLinks }] = await Promise.all([
    supabase
      .from('hackathons')
      .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('team_members')
      .select('hackathon_id')
      .eq('email', email ?? ''),
  ])

  const teamHackathonIds = Array.from(new Set((teamLinks ?? []).map((link: { hackathon_id: string }) => link.hackathon_id)))

  const { data: teamHackathons } = teamHackathonIds.length
    ? await supabase
        .from('hackathons')
        .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
        .in('id', teamHackathonIds)
        .neq('owner_id', userId)
        .order('created_at', { ascending: false })
    : { data: [] as any[] }

  const merged = [...(owned ?? []), ...(teamHackathons ?? [])]
  const unique = Array.from(new Map(merged.map((row: any) => [row.id, normalizeHackathon(row)])).values())
  return unique
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: [] })

  try {
    const { user } = await getRouteUser(request, response)
    const hackathons = await loadHackathonsForUser(request, response, user.id, user.email ?? null)
    return NextResponse.json({ data: hackathons })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ data: null })

  try {
    const { supabase, user } = await getRouteUser(request, response)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
      return NextResponse.json(
        {
          error: 'Server config error: missing SUPABASE_SERVICE_ROLE_KEY in .env.local',
          details: 'Open Supabase Dashboard -> Settings -> API and copy the service_role/secret key.',
          hint: 'After updating .env.local, restart npm run dev.',
          code: 'MISSING_SERVICE_ROLE_KEY',
        },
        { status: 500 },
      )
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { persistSession: false } },
    )
    const payload = (await request.json()) as CreateHackathonPayload

    if (!payload.name?.trim()) {
      return NextResponse.json({ error: 'Hackathon name is required' }, { status: 400 })
    }

    // Some existing accounts may predate the auth trigger. Ensure FK owner profile exists.
    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileLookupError) throw profileLookupError

    if (!existingProfile) {
      const { error: profileInsertError } = await admin
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email ?? '',
        }, { onConflict: 'id' })

      if (profileInsertError) throw profileInsertError
    }

    if (!payload.rounds?.length) {
      return NextResponse.json({ error: 'At least one round is required' }, { status: 400 })
    }

    const invalidRound = payload.rounds.find((round) => Number.isNaN(Date.parse(round.deadline)))
    if (invalidRound) {
      return NextResponse.json({ error: `Invalid deadline for round: ${invalidRound.name}` }, { status: 400 })
    }

    const { data: hackathon, error: hackathonError } = await admin
      .from('hackathons')
      .insert({
        owner_id: user.id,
        name: payload.name.trim(),
        organizer: payload.organizer.trim(),
        platform: payload.platform,
        platform_url: payload.platform_url || null,
        theme: payload.theme || null,
        color: payload.color,
        status: 'upcoming',
      })
      .select()
      .single()

    if (hackathonError) throw hackathonError

    const rounds = payload.rounds.map((round) => ({
      hackathon_id: hackathon.id,
      name: round.name.trim(),
      deadline: round.deadline,
      submission_link: round.submission_link || null,
      notes: round.notes || null,
      sort_order: round.sort_order,
      status: 'pending',
    }))

    if (rounds.length > 0) {
      const { error: roundsError } = await admin.from('rounds').insert(rounds)
      if (roundsError) throw roundsError
    }

    const ownerEmail = (user.email ?? '').trim().toLowerCase()
    const invitedTeam = [
      { hackathon_id: hackathon.id, email: ownerEmail, role: 'Owner', joined_at: new Date().toISOString() },
      ...payload.team_emails.map((member) => ({
        hackathon_id: hackathon.id,
        email: member.email.trim().toLowerCase(),
        role: member.role || 'Member',
      })),
    ]
      .filter(member => member.email)
      .filter((member, index, arr) => arr.findIndex(m => m.email === member.email) === index)

    const { error: teamError } = await admin.from('team_members').insert(invitedTeam)
    if (teamError) throw teamError

    const { data: inserted } = await admin
      .from('hackathons')
      .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
      .eq('id', hackathon.id)
      .maybeSingle()

    return NextResponse.json({ data: inserted ? normalizeHackathon(inserted) : hackathon }, { status: 201 })
  } catch (error: any) {
    const errorMessage = error?.message ?? 'Failed to create hackathon'
    const details = error?.details ?? null
    const hint = error?.hint ?? null
    const code = error?.code ?? null

    return NextResponse.json(
      {
        error: errorMessage,
        details,
        hint,
        code,
      },
      { status: 400 },
    )
  }
}
