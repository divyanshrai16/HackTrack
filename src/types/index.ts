// ─────────────────────────────────────────────────────────────────────────────
// HackTrack — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type RoundStatus = 'pending' | 'submitted' | 'cleared'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type HackathonStatus = 'upcoming' | 'active' | 'completed' | 'missed'
export type NotificationType = 'deadline' | 'team' | 'system'

export const PLATFORMS = [
  'Devfolio', 'Unstop', 'Devpost', 'MLH',
  'HackerEarth', 'HackInOut', 'Hack2skill', 'Other',
] as const

export const THEMES = [
  'AI/ML', 'Web3 / Blockchain', 'HealthTech', 'EdTech',
  'FinTech', 'GreenTech', 'Social Impact', 'Open Innovation',
  'AR/VR', 'IoT', 'Cybersecurity', 'Gaming',
] as const

export const HACKATHON_COLORS = [
  '#00d4aa', '#0ea5e9', '#8b5cf6', '#f59e0b',
  '#f43f5e', '#10b981', '#ec4899', '#06b6d4',
] as const

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  github_url: string | null
  skills: string[]
  timezone: string
  created_at: string
  updated_at: string
}

export interface Hackathon {
  id: string
  owner_id: string
  name: string
  organizer: string
  platform: string
  platform_url: string | null
  theme: string | null
  status: HackathonStatus
  color: string
  created_at: string
  updated_at: string
}

export interface Round {
  id: string
  hackathon_id: string
  name: string
  deadline: string          // ISO 8601 string
  submission_link: string | null
  notes: string | null
  status: RoundStatus
  sort_order: number
  reminded_48h: boolean
  reminded_24h: boolean
  reminded_6h: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  hackathon_id: string
  user_id: string | null
  email: string
  role: string
  invited_at: string
  joined_at: string | null
  // Joined from profiles
  profile?: Pick<Profile, 'full_name' | 'avatar_url'>
}

export interface Resource {
  id: string
  hackathon_id: string
  github_url: string | null
  figma_url: string | null
  presentation_url: string | null
  api_keys: string | null
  extra_links: ExtraLink[]
  updated_at: string
}

export interface ExtraLink {
  label: string
  url: string
}

export interface Task {
  id: string
  hackathon_id: string
  title: string
  description: string | null
  assignee_email: string | null
  assignee_id: string | null
  status: TaskStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined from profiles
  assignee?: Pick<Profile, 'full_name' | 'avatar_url' | 'email'>
}

export interface Notification {
  id: string
  user_id: string
  hackathon_id: string | null
  round_id: string | null
  message: string
  type: NotificationType
  is_read: boolean
  is_urgent: boolean
  created_at: string
}

// ─── Enriched Types (with joins) ──────────────────────────────────────────────

export interface HackathonFull extends Hackathon {
  rounds: Round[]
  team_members: TeamMember[]
  resources: Resource | null
  tasks: Task[]
  owner: Pick<Profile, 'full_name' | 'avatar_url' | 'email'>
}

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface CreateHackathonPayload {
  name: string
  organizer: string
  platform: string
  platform_url?: string
  theme?: string
  color: string
  rounds: CreateRoundPayload[]
  team_emails: { email: string; role: string }[]
}

export interface CreateRoundPayload {
  name: string
  deadline: string    // ISO string
  submission_link?: string
  notes?: string
  sort_order: number
}

export interface UpdateRoundPayload {
  status?: RoundStatus
  submission_link?: string
  notes?: string
  deadline?: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  assignee_email?: string
  status?: TaskStatus
}

export interface UpdateResourcesPayload {
  github_url?: string
  figma_url?: string
  presentation_url?: string
  api_keys?: string
  extra_links?: ExtraLink[]
}

export interface ApiResponse<T = void> {
  data?: T
  error?: string
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type SidebarFilter = 'all' | 'active' | 'upcoming' | 'completed'
export type DetailTab = 'overview' | 'rounds' | 'team' | 'resources' | 'tasks'
export type AddModalStep = 1 | 2 | 3

export interface CountdownResult {
  label: string
  isUrgent: boolean
  isExpired: boolean
  hoursLeft: number
}
