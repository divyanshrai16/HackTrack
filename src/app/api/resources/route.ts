import { NextRequest, NextResponse } from 'next/server'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.json({ data: null })
  try {
    const { supabase } = await getCurrentUser(request, response)
    const body = await request.json() as {
      hackathon_id: string
      github_url?: string
      figma_url?: string
      presentation_url?: string
      api_keys?: string
      extra_links?: unknown[]
    }

    if (!body.hackathon_id) {
      return NextResponse.json({ error: 'hackathon_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('resources')
      .update({
        github_url: body.github_url || null,
        figma_url: body.figma_url || null,
        presentation_url: body.presentation_url || null,
        api_keys: body.api_keys || null,
        extra_links: body.extra_links ?? [],
      })
      .eq('hackathon_id', body.hackathon_id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to save resources' }, { status: 400 })
  }
}
