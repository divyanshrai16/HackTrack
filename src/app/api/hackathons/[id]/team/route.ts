import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase, user } = await getCurrentUser(request, response)
    const { id } = params
    const body = await request.json() as { email: string; role?: string }
    const email = body.email?.trim().toLowerCase()
    const role = body.role?.trim() || 'Member'

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: hackathon, error: hackathonError } = await supabase
      .from('hackathons')
      .select('id, owner_id, name')
      .eq('id', id)
      .single()

    if (hackathonError) throw hackathonError
    if (hackathon.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can invite teammates' }, { status: 403 })
    }

    const { data: existing } = await supabase
      .from('team_members')
      .select('*')
      .eq('hackathon_id', id)
      .eq('email', email)
      .maybeSingle()

    let teamMember = existing

    if (existing) {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', existing.id)
        .select('*')
        .single()
      if (error) throw error
      teamMember = data
    } else {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          hackathon_id: id,
          email,
          role,
        })
        .select('*')
        .single()
      if (error) throw error
      teamMember = data
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profile?.id) {
      await supabase.from('notifications').insert({
        user_id: profile.id,
        hackathon_id: id,
        message: `You were invited to ${hackathon.name}`,
        type: 'team',
        is_read: false,
        is_urgent: false,
      })
    }

    return NextResponse.json({ data: teamMember }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to invite teammate' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase, user } = await getCurrentUser(request, response)
    const { id } = params
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const { data: hackathon } = await supabase
      .from('hackathons')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (!hackathon || hackathon.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only the owner can remove teammates' }, { status: 403 })
    }

    const { error } = await supabase.from('team_members').delete().eq('hackathon_id', id).eq('email', email)
    if (error) throw error

    return NextResponse.json({ data: { id, email } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to remove teammate' }, { status: 400 })
  }
}
