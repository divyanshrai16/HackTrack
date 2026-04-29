# HackTrack — Hackathon Command Center

> Never miss a hackathon deadline again. Centralized dashboard for multi-round tracking, team sync, resource vault, and automated reminders.

![HackTrack Banner](https://via.placeholder.com/1200x400/090c14/00d4aa?text=HackTrack+Command+Center)

## ✨ Features

- **Multi-round tracking** — model each hackathon phase (Ideation → Prototype → Pitch) with individual deadlines and submission links
- **Team Sync** — invite teammates by email; the hackathon auto-populates on their dashboard when they log in
- **Smart reminders** — automated email alerts at 48h, 24h, and 6h before every deadline (via Vercel Cron + Resend)
- **Resource Vault** — GitHub, Figma, slides, and API key storage per hackathon
- **Kanban board** — assign and track tasks across todo / in-progress / done
- **Google OAuth** — one-click sign-in, no passwords
- **IST timezone-aware** — deadlines displayed in IST, emails mention timezone explicitly

## 🗂 Project Structure

```
hacktrack/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing / login page
│   │   ├── dashboard/page.tsx          # Main dashboard (server component)
│   │   ├── auth/callback/route.ts      # OAuth callback + team invite linking
│   │   └── api/
│   │       ├── hackathons/route.ts     # GET all, POST create
│   │       ├── hackathons/[id]/route.ts# GET, PATCH, DELETE by id
│   │       ├── rounds/[id]/route.ts    # PATCH round status/deadline
│   │       ├── tasks/route.ts          # POST create, PATCH update tasks
│   │       ├── resources/route.ts      # PATCH resource links
│   │       └── cron/reminders/route.ts # Hourly cron — sends reminder emails
│   ├── components/
│   │   └── DashboardClient.tsx         # Full interactive dashboard UI
│   ├── lib/
│   │   ├── supabase.ts                 # Browser Supabase client
│   │   ├── supabase-server.ts          # Server + admin Supabase clients
│   │   ├── email.ts                    # Resend email templates
│   │   └── utils.ts                    # Countdown, formatting, helpers
│   └── types/index.ts                  # All TypeScript interfaces
├── supabase/migrations/001_init.sql    # Complete DB schema with RLS
├── vercel.json                         # Cron schedule (hourly)
└── .env.example                        # All required environment variables
```

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone https://github.com/divyanshrai16/HackTrack.git
cd HackTrack
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run `supabase/migrations/001_init.sql`
3. Go to **Auth → Providers → Google** and enable Google OAuth
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
   - Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI

### 3. Set up Resend (email)

1. Create an account at [resend.com](https://resend.com)
2. Verify your domain OR use `@resend.dev` for testing
3. Create an API key

### 4. Configure environment variables

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep secret!) |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Your verified sending domain |
| `CRON_SECRET` | Any random string you generate |

### 5. Run locally

```bash
npm run dev
# → http://localhost:3000
```

### 6. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Vercel will automatically pick up `vercel.json` and schedule the cron job to run every hour.

**Add environment variables** in Vercel Dashboard → Settings → Environment Variables.

## 🔔 How the Reminder System Works

The cron job at `/api/cron/reminders` runs every hour via Vercel Cron:

1. Queries all **pending** rounds with deadlines in the next 49 hours
2. For each round, checks if we're in the **48h**, **24h**, or **6h** window
3. Sends a beautiful HTML email to every team member
4. Marks the round as reminded (prevents duplicate sends)
5. Creates in-app notifications for logged-in users

To test locally, call the endpoint manually:
```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/reminders
```

## 🛡 Security

- All tables have **Row Level Security (RLS)** — users can only see hackathons they own or are invited to
- Service role key is **server-only**, never exposed to the client
- Cron endpoint is protected by a secret header

## 🧱 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Supabase Auth + Google OAuth |
| Email | Resend |
| Cron | Vercel Cron (hourly) |
| Deployment | Vercel |

## 📝 License

MIT
