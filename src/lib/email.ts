import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'HackTrack <noreply@hacktrack.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hacktrack.dev'

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HackTrack</title>
<style>
  body{margin:0;padding:0;background:#090c14;font-family:'Courier New',monospace;color:#e2e8f0}
  .wrap{max-width:560px;margin:40px auto;background:#0f1825;border:1px solid #1a2740;border-radius:12px;overflow:hidden}
  .header{background:#070c18;padding:24px 28px;border-bottom:1px solid #1a2740;display:flex;align-items:center;gap:10px}
  .logo{background:#00d4aa;color:#000;font-weight:900;font-size:14px;padding:4px 8px;border-radius:4px;letter-spacing:0.1em}
  .app-name{color:#00d4aa;font-weight:700;font-size:14px;letter-spacing:0.1em}
  .body{padding:28px}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.06em;margin-bottom:16px}
  .urgent{background:#2d1a0a;color:#fbbf24;border:1px solid #854f0b}
  .normal{background:#0a2e1e;color:#00d4aa;border:1px solid #0f6e56}
  h1{font-size:20px;color:#e2e8f0;margin:0 0 8px;font-weight:700}
  p{color:#8ba3c0;font-size:13px;line-height:1.7;margin:0 0 16px}
  .info-box{background:#070c18;border:1px solid #1a2740;border-radius:8px;padding:14px 16px;margin:16px 0}
  .info-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #0a1020;font-size:12px}
  .info-row:last-child{border-bottom:none}
  .info-label{color:#4b6080}
  .info-val{color:#e2e8f0;font-weight:600}
  .cta{display:inline-block;background:#00d4aa;color:#000;font-weight:700;font-size:12px;letter-spacing:0.08em;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:8px}
  .team-row{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid #0a1020}
  .team-row:last-child{border-bottom:none}
  .avatar{width:24px;height:24px;background:#0ea5e920;color:#0ea5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
  .footer{padding:16px 28px;border-top:1px solid #1a2740;font-size:11px;color:#4b6080;text-align:center}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <span class="logo">H</span>
    <span class="app-name">HACKTRACK</span>
    <span style="color:#4b6080;font-size:11px;margin-left:auto">COMMAND CENTER</span>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    HackTrack · Automated reminder · <a href="${APP_URL}/dashboard" style="color:#00d4aa;text-decoration:none">Open Dashboard</a>
    <br><a href="${APP_URL}/settings/notifications" style="color:#4b6080;text-decoration:none">Manage notification preferences</a>
  </div>
</div>
</body>
</html>`
}

// ─── Deadline Reminder Email ──────────────────────────────────────────────────

interface DeadlineReminderParams {
  to: string
  recipientName: string
  hackathonName: string
  hackathonId: string
  roundName: string
  deadline: Date
  hoursUntil: number
  submissionLink?: string
  teamMembers: { name: string; role: string }[]
}

export async function sendDeadlineReminder(params: DeadlineReminderParams) {
  const {
    to, recipientName, hackathonName, hackathonId,
    roundName, deadline, hoursUntil, submissionLink, teamMembers,
  } = params

  const isUrgent = hoursUntil <= 6
  const timeLabel =
    hoursUntil <= 1 ? 'less than 1 hour'
    : hoursUntil < 24 ? `${hoursUntil} hours`
    : `${Math.round(hoursUntil / 24)} day${hoursUntil >= 48 ? 's' : ''}`

  const badgeClass = isUrgent ? 'urgent' : 'normal'
  const badgeLabel = isUrgent ? `⚠ URGENT — ${timeLabel.toUpperCase()} LEFT` : `${timeLabel.toUpperCase()} REMAINING`

  const teamHtml = teamMembers
    .map(m => `
      <div class="team-row">
        <div class="avatar">${m.name.slice(0, 2).toUpperCase()}</div>
        <span style="color:#8ba3c0">${m.name}</span>
        <span style="color:#4b6080;margin-left:auto">${m.role}</span>
      </div>`)
    .join('')

  const content = `
    <span class="badge ${badgeClass}">${badgeLabel}</span>
    <h1>Submission deadline approaching</h1>
    <p>Hey ${recipientName}, you have a hackathon deadline coming up. Don't miss it!</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">HACKATHON</span><span class="info-val">${hackathonName}</span></div>
      <div class="info-row"><span class="info-label">ROUND</span><span class="info-val">${roundName}</span></div>
      <div class="info-row"><span class="info-label">DEADLINE</span><span class="info-val">${deadline.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })} IST</span></div>
    </div>
    ${teamMembers.length > 0 ? `
    <p style="margin-bottom:8px">Your team:</p>
    <div class="info-box">${teamHtml}</div>` : ''}
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">
      <a class="cta" href="${APP_URL}/hackathon/${hackathonId}">VIEW IN HACKTRACK →</a>
      ${submissionLink ? `<a class="cta" href="${submissionLink}" style="background:#0f1825;color:#00d4aa;border:1px solid #1a2740">SUBMIT NOW ↗</a>` : ''}
    </div>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${isUrgent ? '⚠️ URGENT: ' : '⏰ '}${roundName} — ${hackathonName} (${timeLabel} left)`,
    html: baseTemplate(content),
  })
}

// ─── Team Invite Email ────────────────────────────────────────────────────────

interface TeamInviteParams {
  to: string
  inviterName: string
  hackathonName: string
  hackathonId: string
  role: string
  roundCount: number
}

export async function sendTeamInvite(params: TeamInviteParams) {
  const { to, inviterName, hackathonName, hackathonId, role, roundCount } = params

  const content = `
    <span class="badge normal">TEAM INVITE</span>
    <h1>You've been added to a hackathon team</h1>
    <p>${inviterName} has added you as <strong style="color:#e2e8f0">${role}</strong> for <strong style="color:#e2e8f0">${hackathonName}</strong>.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">HACKATHON</span><span class="info-val">${hackathonName}</span></div>
      <div class="info-row"><span class="info-label">YOUR ROLE</span><span class="info-val">${role}</span></div>
      <div class="info-row"><span class="info-label">ROUNDS</span><span class="info-val">${roundCount} round${roundCount !== 1 ? 's' : ''}</span></div>
    </div>
    <p>Sign in with this email to see the full hackathon timeline, deadlines, shared resources, and Kanban board on your personal dashboard.</p>
    <a class="cta" href="${APP_URL}/auth/login">JOIN YOUR TEAM →</a>
  `

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} added you to "${hackathonName}" on HackTrack`,
    html: baseTemplate(content),
  })
}
