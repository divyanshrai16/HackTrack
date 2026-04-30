import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getRouteUser } from '@/lib/supabase-route'

async function getCurrentUser(request: NextRequest, response: NextResponse) {
  return await getRouteUser(request, response)
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ data: null })
    const { user } = await getCurrentUser(request, response)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here') {
      return NextResponse.json({ error: 'Server not configured: missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
    }
    const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } })

    const now = new Date()
    const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000) // next 24h

    const { data: rounds, error: roundsError } = await supabase
      .from('rounds')
      .select('id, name, deadline, hackathon_id, hackathon: hackathons(id, name)')
      .gte('deadline', now.toISOString())
      .lt('deadline', cutoff.toISOString())
      .order('deadline', { ascending: true })

    if (roundsError) throw roundsError
    if (!rounds || rounds.length === 0) return NextResponse.json({ data: { sent: 0, message: 'No upcoming rounds in next 24h' } })

    const sendgridKey = process.env.SENDGRID_API_KEY
    const fromEmail = process.env.EMAIL_FROM || 'noreply@hacktrack.app'

    if (!sendgridKey) {
      return NextResponse.json({ error: 'Server not configured: missing SENDGRID_API_KEY' }, { status: 500 })
    }

    // Gather recipients per hackathon
    const hackathonIds = Array.from(new Set(rounds.map((r: any) => r.hackathon_id)))

    const memberPromises = hackathonIds.map(id => supabase.from('team_members').select('email').eq('hackathon_id', id))
    const memberResults = await Promise.all(memberPromises)

    const recipients = new Set<string>()
    memberResults.forEach(res => {
      if (res.error || !res.data) return
      res.data.forEach((m: any) => { if (m.email) recipients.add(m.email) })
    })

    const toEmails = Array.from(recipients).slice(0, 500) // limit

    if (toEmails.length === 0) {
      return NextResponse.json({ data: { sent: 0, message: 'No team members found for upcoming rounds' } })
    }

    const subject = `Reminder: upcoming hackathon rounds in next 24 hours`
    const roundList = rounds.map((r: any) => `• ${r.hackathon?.name || 'Hackathon'} — ${r.name} at ${new Date(r.deadline).toLocaleString()}`).join('\n')
    const text = `Hi there,\n\nThe following hackathon rounds have deadlines in the next 24 hours:\n\n${roundList}\n\nPlease make sure submissions are on track.\n\n— HackTrack`

    // Send via SendGrid (single-email-per-recipient loop to keep payload small)
    let sent = 0
    for (const email of toEmails) {
      const payload = {
        personalizations: [ { to: [ { email } ] , subject } ],
        from: { email: fromEmail, name: 'HackTrack' },
        content: [ { type: 'text/plain', value: text } ]
      }

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) sent++
    }

    return NextResponse.json({ data: { sent } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to send reminders' }, { status: 400 })
  }
}
