import { NextRequest, NextResponse } from 'next/server'
import { createRouteSupabaseClient } from '@/lib/supabase-route'

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({ data: null })

    const cookies = request.cookies.getAll().map(c => ({ name: c.name, value: c.value }))

    const supabase = createRouteSupabaseClient(request, response)
    const { data: { user }, error } = await supabase.auth.getUser()

    return NextResponse.json({ user: user ?? null, error: error?.message ?? null, cookies }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
