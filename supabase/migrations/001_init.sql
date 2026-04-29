-- ─────────────────────────────────────────────────────────────────────────────
-- HackTrack — Complete Database Schema
-- Run: supabase db push  OR paste directly into Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
-- Extends Supabase auth.users with extra profile info
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  full_name    text,
  avatar_url   text,
  github_url   text,
  skills       text[],                  -- e.g. ARRAY['React','Python','ML']
  timezone     text default 'Asia/Kolkata',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── HACKATHONS ───────────────────────────────────────────────────────────────
create table if not exists public.hackathons (
  id           uuid primary key default uuid_generate_v4(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  organizer    text not null,
  platform     text not null,           -- 'Devfolio' | 'Unstop' | 'Devpost' etc.
  platform_url text,
  theme        text,                    -- 'AI/ML' | 'Web3' etc.
  status       text not null default 'upcoming'
                check (status in ('upcoming', 'active', 'completed', 'missed')),
  color        text not null default '#00d4aa',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── ROUNDS ───────────────────────────────────────────────────────────────────
create table if not exists public.rounds (
  id               uuid primary key default uuid_generate_v4(),
  hackathon_id     uuid not null references public.hackathons(id) on delete cascade,
  name             text not null,
  deadline         timestamptz not null,
  submission_link  text,
  notes            text,
  status           text not null default 'pending'
                   check (status in ('pending', 'submitted', 'cleared')),
  sort_order       integer not null default 0,
  -- Track which users have been reminded (prevents duplicate emails)
  reminded_48h     boolean default false,
  reminded_24h     boolean default false,
  reminded_6h      boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── TEAM MEMBERS ─────────────────────────────────────────────────────────────
create table if not exists public.team_members (
  id           uuid primary key default uuid_generate_v4(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade,
  user_id      uuid references public.profiles(id) on delete set null,
  email        text not null,
  role         text not null default 'Member',
  invited_at   timestamptz default now(),
  joined_at    timestamptz,             -- null until they log in with this email
  unique (hackathon_id, email)
);

-- ─── RESOURCES ────────────────────────────────────────────────────────────────
create table if not exists public.resources (
  id           uuid primary key default uuid_generate_v4(),
  hackathon_id uuid not null references public.hackathons(id) on delete cascade unique,
  github_url   text,
  figma_url    text,
  presentation_url text,
  api_keys     text,                    -- Stored as plaintext (warn users: team can see this)
  extra_links  jsonb default '[]',      -- [{label, url}]
  updated_at   timestamptz default now()
);

-- Auto-create resources row when hackathon is created
create or replace function public.handle_new_hackathon()
returns trigger language plpgsql security definer as $$
begin
  insert into public.resources (hackathon_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_hackathon_created on public.hackathons;
create trigger on_hackathon_created
  after insert on public.hackathons
  for each row execute procedure public.handle_new_hackathon();

-- ─── TASKS (Kanban) ───────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id             uuid primary key default uuid_generate_v4(),
  hackathon_id   uuid not null references public.hackathons(id) on delete cascade,
  title          text not null,
  description    text,
  assignee_email text,
  assignee_id    uuid references public.profiles(id) on delete set null,
  status         text not null default 'todo'
                 check (status in ('todo', 'in-progress', 'done')),
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  hackathon_id uuid references public.hackathons(id) on delete cascade,
  round_id     uuid references public.rounds(id) on delete cascade,
  message      text not null,
  type         text default 'deadline'  -- 'deadline' | 'team' | 'system'
               check (type in ('deadline', 'team', 'system')),
  is_read      boolean default false,
  is_urgent    boolean default false,
  created_at   timestamptz default now()
);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger hackathons_updated_at before update on public.hackathons
  for each row execute procedure public.set_updated_at();
create trigger rounds_updated_at before update on public.rounds
  for each row execute procedure public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks
  for each row execute procedure public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.hackathons   enable row level security;
alter table public.rounds       enable row level security;
alter table public.team_members enable row level security;
alter table public.resources    enable row level security;
alter table public.tasks        enable row level security;
alter table public.notifications enable row level security;

-- Helper: is the current user a member of this hackathon?
create or replace function public.is_team_member(hackathon_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.team_members tm
    join public.profiles p on p.email = tm.email
    where tm.hackathon_id = $1
    and p.id = auth.uid()
  )
  or exists (
    select 1 from public.hackathons h
    where h.id = $1 and h.owner_id = auth.uid()
  );
$$;

-- Profiles: users can only read/update their own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Hackathons: owner or team member can read; only owner can write
create policy "hackathons_select" on public.hackathons for select
  using (public.is_team_member(id));
create policy "hackathons_insert" on public.hackathons for insert
  with check (auth.uid() = owner_id);
create policy "hackathons_update" on public.hackathons for update
  using (auth.uid() = owner_id);
create policy "hackathons_delete" on public.hackathons for delete
  using (auth.uid() = owner_id);

-- Rounds: team members can read & update status
create policy "rounds_select" on public.rounds for select
  using (public.is_team_member(hackathon_id));
create policy "rounds_insert" on public.rounds for insert
  with check (exists (
    select 1 from public.hackathons h where h.id = hackathon_id and h.owner_id = auth.uid()
  ));
create policy "rounds_update" on public.rounds for update
  using (public.is_team_member(hackathon_id));
create policy "rounds_delete" on public.rounds for delete
  using (exists (
    select 1 from public.hackathons h where h.id = hackathon_id and h.owner_id = auth.uid()
  ));

-- Team members: team members can read; owner can manage
create policy "team_select" on public.team_members for select
  using (public.is_team_member(hackathon_id));
create policy "team_insert" on public.team_members for insert
  with check (exists (
    select 1 from public.hackathons h where h.id = hackathon_id and h.owner_id = auth.uid()
  ));
create policy "team_delete" on public.team_members for delete
  using (exists (
    select 1 from public.hackathons h where h.id = hackathon_id and h.owner_id = auth.uid()
  ));

-- Resources: team members can read & update
create policy "resources_select" on public.resources for select
  using (public.is_team_member(hackathon_id));
create policy "resources_update" on public.resources for update
  using (public.is_team_member(hackathon_id));

-- Tasks: team members full access
create policy "tasks_select" on public.tasks for select
  using (public.is_team_member(hackathon_id));
create policy "tasks_insert" on public.tasks for insert
  with check (public.is_team_member(hackathon_id));
create policy "tasks_update" on public.tasks for update
  using (public.is_team_member(hackathon_id));
create policy "tasks_delete" on public.tasks for delete
  using (public.is_team_member(hackathon_id));

-- Notifications: users only see their own
create policy "notif_select" on public.notifications for select
  using (auth.uid() = user_id);
create policy "notif_update" on public.notifications for update
  using (auth.uid() = user_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
create index if not exists idx_hackathons_owner       on public.hackathons(owner_id);
create index if not exists idx_rounds_hackathon       on public.rounds(hackathon_id);
create index if not exists idx_rounds_deadline        on public.rounds(deadline) where status = 'pending';
create index if not exists idx_team_hackathon         on public.team_members(hackathon_id);
create index if not exists idx_team_email             on public.team_members(email);
create index if not exists idx_tasks_hackathon        on public.tasks(hackathon_id);
create index if not exists idx_notif_user             on public.notifications(user_id, is_read);
