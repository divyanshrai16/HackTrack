import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase, user } = await getCurrentUser(request, response)
    const { id } = params
    const payload = await request.json()

    // Check ownership
    const { data: hackathon, error: fetchError } = await supabase
      .from('hackathons')
      .select('owner_id')
      .eq('id', id)
      .single()

    if (fetchError || !hackathon) throw new Error('Hackathon not found')
    if (hackathon.owner_id !== user.id) throw new Error('Only owner can edit')

    // Use admin client to bypass RLS for update
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    const updates = {
      ...(payload.name && { name: payload.name.trim() }),
      ...(payload.organizer && { organizer: payload.organizer.trim() }),
      ...(payload.platform && { platform: payload.platform }),
      ...(payload.platform_url !== undefined && { platform_url: payload.platform_url || null }),
      ...(payload.theme && { theme: payload.theme }),
      ...(payload.color && { color: payload.color }),
      ...(payload.status && { status: payload.status }),
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await admin
      .from('hackathons')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        rounds (*),
        team_members (*),
        resources (*),
        tasks (*)
      `
      )
      .single()

    if (updateError) throw updateError

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update hackathon'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase } = await getCurrentUser(request, response)
    const { id } = params

    const { error } = await supabase.from('hackathons').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete hackathon' }, { status: 400 })
  }
}
