import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  const supabase = createRouteSupabaseClient(request, response)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase } = await getCurrentUser(request, response)
    const { id } = await params
    const body = await request.json() as { status?: string; submission_link?: string; notes?: string; deadline?: string }

    const updatePayload: Record<string, string> = {}
    if (body.status) updatePayload.status = body.status
    if (body.submission_link !== undefined) updatePayload.submission_link = body.submission_link
    if (body.notes !== undefined) updatePayload.notes = body.notes
    if (body.deadline !== undefined) updatePayload.deadline = body.deadline

    const { data, error } = await supabase
      .from('rounds')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update round' }, { status: 400 })
  }
}
