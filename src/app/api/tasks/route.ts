import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ data: null })
  try {
    const { user } = await getCurrentUser(request, response)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
      return NextResponse.json({ error: 'Server config error: missing SUPABASE_SERVICE_ROLE_KEY in .env.local' }, { status: 500 })
    }
    const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } })
    const body = await request.json() as {
      hackathon_id: string
      title: string
      description?: string
      assignee_email?: string
      status?: 'todo' | 'in-progress' | 'done'
    }

    if (!body.hackathon_id || !body.title?.trim()) {
      return NextResponse.json({ error: 'Task title and hackathon are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        hackathon_id: body.hackathon_id,
        title: body.title.trim(),
        description: body.description || null,
        assignee_email: body.assignee_email || null,
        status: body.status || 'todo',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create task' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const response = NextResponse.json({ data: null })
  try {
    await getCurrentUser(request, response)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
      return NextResponse.json({ error: 'Server config error: missing SUPABASE_SERVICE_ROLE_KEY in .env.local' }, { status: 500 })
    }
    const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } })
    const body = await request.json() as {
      id: string
      status?: 'todo' | 'in-progress' | 'done'
      assignee_email?: string | null
      title?: string
      description?: string | null
    }

    if (!body.id) return NextResponse.json({ error: 'Task id is required' }, { status: 400 })

    const updatePayload: Record<string, string | null> = {}
    if (body.status) updatePayload.status = body.status
    if (body.assignee_email !== undefined) updatePayload.assignee_email = body.assignee_email
    if (body.title !== undefined) updatePayload.title = body.title
    if (body.description !== undefined) updatePayload.description = body.description

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', body.id)
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to update task' }, { status: 400 })
  }
}
