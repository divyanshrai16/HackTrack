import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const response = NextResponse.json({ data: null })
  try {
    await getCurrentUser(request, response)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
      return NextResponse.json({ error: 'Server config error: missing SUPABASE_SERVICE_ROLE_KEY in .env.local' }, { status: 500 })
    }
    const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } })
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
