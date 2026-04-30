import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.json({ data: null })

  try {
    const { supabase, user } = await getCurrentUser(request, response)
    const { id } = params

    // Fetch original hackathon with all relations
    const { data: original, error: fetchError } = await supabase
      .from('hackathons')
      .select('*, rounds(*), team_members(*), resources(*)')
      .eq('id', id)
      .single()

    if (fetchError || !original) throw new Error('Hackathon not found')

    // Must be owner to clone
    if (original.owner_id !== user.id) throw new Error('Only owner can clone')

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Create new hackathon with same fields
    const { data: cloned, error: hackathonError } = await admin
      .from('hackathons')
      .insert({
        owner_id: user.id,
        name: `${original.name} (copy)`,
        organizer: original.organizer,
        platform: original.platform,
        platform_url: original.platform_url,
        theme: original.theme,
        color: original.color,
        status: original.status,
      })
      .select()
      .single()

    if (hackathonError) throw hackathonError

    // Clone rounds
    if (original.rounds && original.rounds.length > 0) {
      const roundsToClone = original.rounds.map((round: any) => ({
        hackathon_id: cloned.id,
        name: round.name,
        deadline: round.deadline,
        submission_link: round.submission_link,
        notes: round.notes,
        sort_order: round.sort_order,
        status: round.status,
      }))

      const { error: roundsError } = await admin.from('rounds').insert(roundsToClone)
      if (roundsError) throw roundsError
    }

    // Clone team members
    if (original.team_members && original.team_members.length > 0) {
      const teamToClone = original.team_members.map((member: any) => ({
        hackathon_id: cloned.id,
        email: member.email,
        role: member.role,
      }))

      const { error: teamError } = await admin.from('team_members').insert(teamToClone)
      if (teamError) throw teamError
    }

    // Clone resources
    if (original.resources) {
      const resourcesToClone = Array.isArray(original.resources) ? original.resources : [original.resources]
      const resourcesInserts = resourcesToClone
        .filter((r: any) => r !== null)
        .map((resource: any) => ({
          hackathon_id: cloned.id,
          name: resource.name,
          url: resource.url,
          category: resource.category,
        }))

      if (resourcesInserts.length > 0) {
        const { error: resourcesError } = await admin.from('resources').insert(resourcesInserts)
        if (resourcesError) throw resourcesError
      }
    }

    // Fetch complete cloned hackathon
    const { data: complete } = await admin
      .from('hackathons')
      .select('*, rounds(*), team_members(*), resources(*), tasks(*)')
      .eq('id', cloned.id)
      .single()

    return NextResponse.json({ data: complete }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to clone hackathon'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
