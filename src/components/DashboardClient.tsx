'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { CreateHackathonPayload, HackathonFull, Notification, Profile, RoundStatus, SidebarFilter, TaskStatus } from '@/types'
import { cn, formatDeadline, getCountdown, getInitials, roundProgress, avatarColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase'

type Props = {
  user: User
  profile: Profile | null
  initialHackathons: HackathonFull[]
  initialNotifications: Notification[]
  initialAccessToken?: string | null
}

function Avatar({ name, url, size = 32, index = 0 }: { name: string; url?: string | null; size?: number; index?: number }) {
  if (url) {
    return <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover flex-shrink-0 ring-2 ring-bg-tertiary" />
  }
  const color = avatarColor(index)
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-bg-tertiary text-xs font-bold"
      style={{ width: size, height: size, background: color.bg, color: color.text }}>
      {getInitials(name)}
    </div>
  )
}

function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'green' | 'amber' | 'red' }) {
  const toneClass = tone === 'green' ? 'bg-emerald-950/60 text-accent-green border-emerald-800/30'
    : tone === 'amber' ? 'bg-amber-950/60 text-amber-400 border-amber-800/30'
    : tone === 'red' ? 'bg-red-950/60 text-accent-red border-red-800/30'
    : 'bg-bg-secondary text-text-secondary border-border-dim'
  return <span className={cn('tag text-[10px] border', toneClass)}>{children}</span>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={cn('card', className)}>{children}</div>
}

function ProgressBar({ value, color = '#00d4aa' }: { value: number; color?: string }) {
  return <div className="h-1.5 rounded-full bg-border-dim overflow-hidden"><div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} /></div>
}

export default function DashboardClient({ user, profile, initialHackathons, initialNotifications, initialAccessToken }: Props) {
  const router = useRouter()
  const [hackathons, setHackathons] = useState(initialHackathons)
  const [selectedId, setSelectedId] = useState<string | null>(initialHackathons[0]?.id ?? null)
  const [filter, setFilter] = useState<SidebarFilter>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'created' | 'deadline' | 'completion' | 'team'>('created')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [themeFilter, setThemeFilter] = useState<string>('all')
  const [showNotifications, setShowNotifications] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Member')
  const [inviting, setInviting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkInput, setBulkInput] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [editData, setEditData] = useState<{ name: string; organizer: string; platform: string; platform_url: string; theme: string; color: string }>({
    name: '',
    organizer: '',
    platform: 'Devfolio',
    platform_url: '',
    theme: 'AI/ML',
    color: '#00d4aa',
  })
  const [newHackathon, setNewHackathon] = useState({
    name: '',
    organizer: '',
    platform: 'Devfolio',
    platform_url: '',
    theme: 'AI/ML',
    color: '#00d4aa',
    teamEmails: '',
  })
  const [newRounds, setNewRounds] = useState([
    { name: 'Round 1', deadline: '', submission_link: '', notes: '' },
  ])
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function authRequestInit(init: RequestInit = {}): Promise<RequestInit> {
    const headers = new Headers(init.headers)
    const token = initialAccessToken ?? (await createClient().auth.getSession()).data.session?.access_token ?? null
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return {
      ...init,
      credentials: 'include',
      headers,
    }
  }

  const userName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Dev'
  const selected = hackathons.find(h => h.id === selectedId) ?? null
  const notifications = initialNotifications

  const stats = useMemo(() => ({
    total: hackathons.length,
    active: hackathons.filter(h => h.status === 'active').length,
    upcoming: hackathons.filter(h => h.status === 'upcoming').length,
    completed: hackathons.filter(h => h.status === 'completed').length,
  }), [hackathons])

  const filteredHackathons = useMemo(() => hackathons.filter(h => {
    if (search && !`${h.name} ${h.organizer} ${h.platform}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'active') return h.status === 'active'
    if (filter === 'upcoming') return h.status === 'upcoming'
    if (filter === 'completed') return h.status === 'completed'
    return true
  }), [hackathons, filter, search])

  const platforms = useMemo(() => Array.from(new Set(hackathons.map(h => h.platform).filter(Boolean))), [hackathons])
  const themes = useMemo(() => Array.from(new Set(hackathons.map(h => h.theme).filter(Boolean))), [hackathons])

  const advancedFiltered = useMemo(() => {
    let list = hackathons.filter(h => {
      if (search && !`${h.name} ${h.organizer} ${h.platform}`.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'active') return h.status === 'active'
      if (filter === 'upcoming') return h.status === 'upcoming'
      if (filter === 'completed') return h.status === 'completed'
      return true
    })

    if (platformFilter !== 'all') {
      list = list.filter(h => h.platform === platformFilter)
    }
    if (themeFilter !== 'all') {
      list = list.filter(h => h.theme === themeFilter)
    }

    const sorted = [...list]
    if (sortBy === 'deadline') {
      sorted.sort((a, b) => {
        const aMin = a.rounds?.length ? Math.min(...a.rounds.map(r => new Date(r.deadline).getTime())) : Infinity
        const bMin = b.rounds?.length ? Math.min(...b.rounds.map(r => new Date(r.deadline).getTime())) : Infinity
        return aMin - bMin
      })
    } else if (sortBy === 'completion') {
      const completion = (h: any) => {
        const total = h.tasks?.length || 0
        const done = h.tasks?.filter((t: any) => t.status === 'done').length || 0
        return total === 0 ? 0 : done / total
      }
      sorted.sort((a, b) => completion(b) - completion(a))
    } else if (sortBy === 'team') {
      sorted.sort((a, b) => (b.team_members?.length || 0) - (a.team_members?.length || 0))
    } else {
      // created (default)
      sorted.sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0))
    }

    return sorted
  }, [hackathons, filter, search, platformFilter, themeFilter, sortBy])

  const urgentRounds = useMemo(() => hackathons
    .flatMap(h => h.rounds.filter(r => r.status === 'pending').map(r => ({ hackathon: h, round: r })))
    .filter(({ round }) => getCountdown(round.deadline).hoursLeft < 48 && !getCountdown(round.deadline).isExpired)
    .sort((a, b) => new Date(a.round.deadline).getTime() - new Date(b.round.deadline).getTime())
    .slice(0, 3), [hackathons])

  const memberCount = selected?.team_members.length ?? 0
  const doneTasks = selected?.tasks.filter(t => t.status === 'done').length ?? 0
  const isOwner = selected?.owner_id === user.id

  useEffect(() => {
    const supabase = createClient()

    const scheduleRefresh = () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 300)
    }

    const channel = supabase
      .channel(`dashboard-live-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hackathons' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, scheduleRefresh)
      .subscribe()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      supabase.removeChannel(channel)
    }
  }, [router, user.id])

  async function handleDeleteHackathon(id: string) {
    try {
      if (!window.confirm('Delete this hackathon? This cannot be undone.')) return
      const response = await fetch(`/api/hackathons/${id}`, await authRequestInit({ method: 'DELETE' }))
      if (!response.ok) {
        toast.error('Failed to delete hackathon')
        return
      }
      setHackathons(current => current.filter(h => h.id !== id))
      setSelectedId(null)
      toast.success('Hackathon deleted')
    } catch {
      toast.error('Failed to delete hackathon')
    }
  }

  async function handleEditHackathon() {
    if (!selected) return
    if (!editData.name.trim()) {
      toast.error('Hackathon name is required')
      return
    }
    if (!isValidName(editData.name)) {
      toast.error('Hackathon name must be 1-100 characters')
      return
    }
    if (editData.platform_url && !isValidUrl(editData.platform_url)) {
      toast.error('Invalid platform URL')
      return
    }
    if (!isValidColor(editData.color)) {
      toast.error('Invalid color format (use #RRGGBB)')
      return
    }

    setEditing(true)
    try {
      const response = await fetch(`/api/hackathons/${selected.id}`, await authRequestInit({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      }))
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Failed to update hackathon')

      setHackathons(current =>
        current.map(h => (h.id === selected.id ? { ...h, ...result.data } : h))
      )
      setSelectedId(result.data.id)
      setShowEdit(false)
      toast.success('Hackathon updated')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update hackathon')
    } finally {
      setEditing(false)
    }
  }

  function openEditModal() {
    if (!selected) return
    setEditData({
      name: selected.name,
      organizer: selected.organizer,
      platform: selected.platform,
      platform_url: selected.platform_url || '',
      theme: selected.theme || 'AI/ML',
      color: selected.color,
    })
    setShowEdit(true)
  }

  async function handleCloneHackathon(id: string) {
    try {
      const response = await fetch(`/api/hackathons/${id}/clone`, await authRequestInit({ method: 'POST' }))
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Failed to clone hackathon')

      setHackathons(current => [result.data, ...current])
      setSelectedId(result.data.id)
      toast.success('Hackathon cloned! ✨')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clone hackathon')
    }
  }

  async function handleUpdateRoundStatus(roundId: string, status: RoundStatus) {
    if (!selected) return
    try {
      const response = await fetch(`/api/rounds/${roundId}`, await authRequestInit({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }))
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Failed to update round')

      setHackathons(current => current.map(h => {
        if (h.id !== selected.id) return h
        return {
          ...h,
          rounds: h.rounds.map(r => (r.id === roundId ? { ...r, status } : r)),
        }
      }))

      toast.success(`Round marked as ${status}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update round')
    }
  }

  async function handleUpdateTaskStatus(taskId: string, status: TaskStatus) {
    if (!selected) return

    try {
      const response = await fetch('/api/tasks', await authRequestInit({
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status }),
      }))
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Failed to update task')

      setHackathons(current => current.map(h => {
        if (h.id !== selected.id) return h
        return {
          ...h,
          tasks: h.tasks.map(task => (task.id === taskId ? { ...task, status } : task)),
        }
      }))

      toast.success(`Task moved to ${status}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  function handleTaskDragStart(taskId: string) {
    setDraggingTaskId(taskId)
  }

  function handleTaskDragEnd() {
    setDraggingTaskId(null)
    setDragOverStatus(null)
  }

  function handleTaskDrop(status: TaskStatus) {
    if (!draggingTaskId) return
    if (selected?.tasks.some(task => task.id === draggingTaskId && task.status !== status)) {
      void handleUpdateTaskStatus(draggingTaskId, status)
    }
    setDraggingTaskId(null)
    setDragOverStatus(null)
  }

  function addRoundField() {
    setNewRounds(current => [...current, { name: `Round ${current.length + 1}`, deadline: '', submission_link: '', notes: '' }])
  }

  function removeRoundField(index: number) {
    setNewRounds(current => (current.length === 1 ? current : current.filter((_, i) => i !== index)))
  }

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidUrl = (url: string) => {
    if (!url) return true // optional field
    try { new URL(url); return true } catch { return false }
  }
  const isValidColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color)
  const isValidName = (name: string) => name.trim().length > 0 && name.trim().length <= 100

  async function handleCreateHackathon() {
    if (!newHackathon.name.trim()) {
      toast.error('Hackathon name is required')
      return
    }
    if (!isValidName(newHackathon.name)) {
      toast.error('Hackathon name must be 1-100 characters')
      return
    }
    if (newRounds.some(r => !r.deadline)) {
      toast.error('Every round needs a deadline')
      return
    }
    if (newRounds.some(r => new Date(r.deadline).getTime() < Date.now())) {
      toast.error('Round deadlines must be in the future')
      return
    }
    if (newHackathon.platform_url && !isValidUrl(newHackathon.platform_url)) {
      toast.error('Invalid platform URL')
      return
    }
    if (!isValidColor(newHackathon.color)) {
      toast.error('Invalid color format (use #RRGGBB)')
      return
    }

    const teamEmails = newHackathon.teamEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
      .map(email => ({ email, role: 'Member' }))

    const invalidEmails = teamEmails.filter(m => !isValidEmail(m.email))
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email(s): ${invalidEmails.map(m => m.email).join(', ')}`)
      return
    }

    const payload: CreateHackathonPayload = {
      name: newHackathon.name.trim(),
      organizer: newHackathon.organizer.trim() || 'Unknown Organizer',
      platform: newHackathon.platform,
      platform_url: newHackathon.platform_url.trim() || undefined,
      theme: newHackathon.theme || undefined,
      color: newHackathon.color,
      rounds: newRounds.map((round, index) => ({
        name: round.name.trim() || `Round ${index + 1}`,
        deadline: new Date(round.deadline).toISOString(),
        submission_link: round.submission_link.trim() || undefined,
        notes: round.notes.trim() || undefined,
        sort_order: index,
      })),
      team_emails: teamEmails,
    }

    setCreating(true)
    try {
      const response = await fetch('/api/hackathons', await authRequestInit({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }))
      const result = await response.json()
      if (!response.ok) {
        const extra = [result.details, result.hint, result.code].filter(Boolean).join(' | ')
        throw new Error(extra ? `${result.error ?? 'Failed to create hackathon'} (${extra})` : (result.error ?? 'Failed to create hackathon'))
      }

      setHackathons(current => [result.data, ...current])
      setSelectedId(result.data.id)
      setShowCreate(false)
      setNewHackathon({
        name: '',
        organizer: '',
        platform: 'Devfolio',
        platform_url: '',
        theme: 'AI/ML',
        color: '#00d4aa',
        teamEmails: '',
      })
      setNewRounds([{ name: 'Round 1', deadline: '', submission_link: '', notes: '' }])
      toast.success('Hackathon created')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create hackathon')
    } finally {
      setCreating(false)
    }
  }

  async function handleInviteTeammate() {
    if (!selected) return
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid teammate email')
      return
    }
    if (!isValidEmail(email)) {
      toast.error('Invalid email format')
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/hackathons/${selected.id}/team`, await authRequestInit({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: inviteRole }),
      }))

      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Failed to invite teammate')

      setHackathons(current => current.map(h => {
        if (h.id !== selected.id) return h
        const existingIndex = h.team_members.findIndex(member => member.email.toLowerCase() === email)
        const updatedMembers = existingIndex >= 0
          ? h.team_members.map(member => member.email.toLowerCase() === email ? { ...member, role: inviteRole } : member)
          : [...h.team_members, payload.data]
        return { ...h, team_members: updatedMembers }
      }))

      setInviteEmail('')
      setInviteRole('Member')
      toast.success('Teammate invited')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to invite teammate')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveTeammate(email: string) {
    if (!selected) return
    if (!window.confirm(`Remove ${email} from this hackathon?`)) return

    try {
      const response = await fetch(`/api/hackathons/${selected.id}/team?email=${encodeURIComponent(email)}`, await authRequestInit({
        method: 'DELETE',
      }))
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Failed to remove teammate')

      setHackathons(current => current.map(h => {
        if (h.id !== selected.id) return h
        return { ...h, team_members: h.team_members.filter(member => member.email.toLowerCase() !== email.toLowerCase()) }
      }))

      toast.success('Teammate removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove teammate')
    }
  }

  async function handleBulkImport() {
    if (!bulkInput.trim()) {
      toast.error('Paste some links or entries to import')
      return
    }
    setBulkImporting(true)
    try {
      const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean)
      const created: any[] = []
      await Promise.all(lines.map(async (line) => {
        // Format: name|organizer|platform|theme|color (color optional)
        const parts = line.split('|').map(p => p.trim())
        const [name, organizer = 'Unknown Organizer', platform = 'Devfolio', theme = 'AI/ML', color = '#00d4aa'] = parts
        const payload = {
          name: name || `Imported Hackathon ${Date.now()}`,
          organizer,
          platform,
          platform_url: undefined,
          theme,
          color,
          rounds: [
            { name: 'Round 1', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), submission_link: '', notes: '', sort_order: 0 }
          ],
          team_emails: [],
        }

        const res = await fetch('/api/hackathons', await authRequestInit({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to import')
        created.push(json.data)
      }))

      if (created.length) {
        setHackathons(current => [...created, ...current])
        setBulkInput('')
        setShowBulkImport(false)
        toast.success(`Imported ${created.length} hackathon${created.length > 1 ? 's' : ''}`)
      } else {
        toast('No items imported')
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Bulk import failed')
    } finally {
      setBulkImporting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        sidebarOpen ? 'fixed left-0 top-0 z-40 h-full w-64' : 'hidden sm:flex',
        'border-r border-border-dim bg-bg-tertiary flex flex-col'
      )}>
        <div className="p-4 border-b border-border-dim">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-green text-black flex items-center justify-center font-black">H</div>
            <div>
              <div className="text-sm font-black tracking-widest text-accent-green">HACKTRACK</div>
              <div className="text-[10px] tracking-[0.3em] text-text-muted">COMMAND CENTER</div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-1 border-b border-border-dim">
          {([
            { id: 'all', label: 'All Hackathons', count: stats.total },
            { id: 'active', label: 'Active', count: stats.active },
            { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
            { id: 'completed', label: 'Completed', count: stats.completed },
          ] as { id: SidebarFilter; label: string; count: number }[]).map(item => (
            <button key={item.id} onClick={() => { setFilter(item.id); setSelectedId(null) }}
              className={cn('sidebar-item w-full justify-between', filter === item.id && !selectedId && 'active')}>
              <span>{item.label}</span>
              <span className="text-[10px] bg-bg-primary px-1.5 py-0.5 rounded-full text-text-muted">{item.count}</span>
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 border-b border-border-dim">
          <div className="flex items-center gap-2">
            <Avatar name={userName} url={profile?.avatar_url} size={36} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{userName}</div>
              <div className="text-[10px] text-text-muted truncate">{user.email}</div>
            </div>
          </div>
          <Link href="/auth/signout" className="sidebar-item w-full text-text-muted hover:text-accent-red">Sign out</Link>
        </div>

        <div className="p-4">
          <div className="text-[10px] tracking-[0.3em] text-text-muted mb-2">URGENT DEADLINES</div>
          <div className="space-y-2">
            {urgentRounds.length === 0 ? (
              <div className="text-xs text-text-muted">All clear.</div>
            ) : urgentRounds.map(({ hackathon, round }) => (
              <div key={round.id} className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-2">
                <div className="text-[10px] text-text-secondary truncate">{hackathon.name}</div>
                <div className="text-[11px] text-amber-300 truncate">{round.name}</div>
                <div className="mt-1"><Pill tone="amber">{getCountdown(round.deadline).label}</Pill></div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 border-b border-border-mid bg-gradient-to-r from-bg-primary via-bg-secondary to-bg-primary/80 backdrop-blur px-6 py-4 flex items-center gap-3 justify-between">
          <button className="sm:hidden p-2 text-xl" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">☰</button>
          <div>
            <div className="text-xs tracking-[0.35em] text-accent-green font-bold">SIGNED IN</div>
            <h1 className="text-2xl font-black mt-1 bg-gradient-to-r from-accent-green via-accent-blue to-accent-purple bg-clip-text text-transparent">HackTrack Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Welcome back, <span className="text-accent-green font-semibold">{user.email}</span>.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 max-w-[40vw]">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hackathons..." className="pl-8 border-accent-green/30 focus:border-accent-green" />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </div>
            <div className="flex items-center gap-2">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-sm px-2 py-1 border border-border-dim bg-bg-secondary rounded">
                <option value="created">Sort: Newest</option>
                <option value="deadline">Sort: Next Deadline</option>
                <option value="completion">Sort: Completion %</option>
                <option value="team">Sort: Team Size</option>
              </select>
              <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="text-sm px-2 py-1 border border-border-dim bg-bg-secondary rounded">
                <option value="all">All Platforms</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={themeFilter} onChange={e => setThemeFilter(e.target.value)} className="text-sm px-2 py-1 border border-border-dim bg-bg-secondary rounded">
                <option value="all">All Themes</option>
                {themes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <ThemeToggle />
            <button onClick={() => setShowNotifications(v => !v)} className="btn-ghost relative p-2 hover:text-accent-green">
              🔔
              {notifications.some(n => !n.is_read) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-green animate-pulse" />}
            </button>
            <button onClick={() => setShowCreate(v => !v)} className={cn('btn-primary', showCreate ? 'bg-accent-red hover:brightness-125' : '')}>{showCreate ? 'Close' : '+ Add Hackathon'}</button>
            <button onClick={() => setShowBulkImport(v => !v)} className={cn('btn-ghost', showBulkImport ? 'text-accent-red' : '')}>Bulk Import</button>
            <button onClick={async () => {
              if (!window.confirm('Send email reminders to team members for rounds due in next 24 hours?')) return
              try {
                setSendingReminders(true)
                const res = await fetch('/api/reminders/send', await authRequestInit({ method: 'POST' }))
                const json = await res.json()
                if (!res.ok) throw new Error(json.error || 'Failed to send reminders')
                toast.success(`Sent ${json.data?.sent ?? 0} emails`)
              } catch (err: any) {
                toast.error(err?.message ?? 'Failed to send reminders')
              } finally {
                setSendingReminders(false)
              }
            }} className={cn('btn-ghost', sendingReminders ? 'text-accent-green' : '')}>{sendingReminders ? 'Sending…' : 'Send Reminders'}</button>
            <Link href="/" className="btn-ghost hover:text-accent-blue">Home</Link>
          </div>
        </header>

        {showNotifications && (
          <div className="absolute right-6 top-20 z-20 w-80 max-w-[calc(100vw-3rem)]">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs tracking-[0.3em] text-text-muted">NOTIFICATIONS</div>
                <button className="text-text-muted hover:text-text-primary" onClick={() => setShowNotifications(false)}>×</button>
              </div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {notifications.map(n => (
                  <div key={n.id} className={cn('rounded-lg border px-3 py-2 text-sm', n.is_read ? 'border-border-dim bg-bg-tertiary' : 'border-emerald-900/40 bg-emerald-950/20')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{n.message}</span>
                      <span className={cn('text-[9px] uppercase', n.is_urgent ? 'text-amber-400' : 'text-text-muted')}>{n.type}</span>
                    </div>
                    <div className="text-[10px] text-text-muted mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        <div className="px-6 py-6 space-y-6">
          {showCreate && (
            <Card>
              <div className="text-xs tracking-[0.3em] text-accent-green">CREATE HACKATHON</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={newHackathon.name} onChange={e => setNewHackathon(v => ({ ...v, name: e.target.value }))} placeholder="Hackathon name" />
                <input value={newHackathon.organizer} onChange={e => setNewHackathon(v => ({ ...v, organizer: e.target.value }))} placeholder="Organizer" />
                <input value={newHackathon.platform} onChange={e => setNewHackathon(v => ({ ...v, platform: e.target.value }))} placeholder="Platform (Devfolio/Unstop)" />
                <input value={newHackathon.platform_url} onChange={e => setNewHackathon(v => ({ ...v, platform_url: e.target.value }))} placeholder="Platform URL" />
                <input value={newHackathon.theme} onChange={e => setNewHackathon(v => ({ ...v, theme: e.target.value }))} placeholder="Theme" />
                <input value={newHackathon.color} onChange={e => setNewHackathon(v => ({ ...v, color: e.target.value }))} placeholder="Color (e.g. #00d4aa)" />
              </div>

              <div className="mt-4">
                <div className="text-xs tracking-[0.3em] text-text-muted mb-2">TEAM EMAILS (comma separated)</div>
                <input value={newHackathon.teamEmails} onChange={e => setNewHackathon(v => ({ ...v, teamEmails: e.target.value }))} placeholder="bhumika@gmail.com, abhinav@gmail.com" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-[0.3em] text-text-muted">ROUNDS</div>
                  <button onClick={addRoundField} className="btn-ghost text-xs">+ Add Round</button>
                </div>
                {newRounds.map((round, index) => (
                  <div key={index} className="rounded-xl border border-border-dim bg-bg-tertiary p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-secondary">Round {index + 1}</div>
                      <button onClick={() => removeRoundField(index)} className="text-text-muted hover:text-accent-red" disabled={newRounds.length === 1}>×</button>
                    </div>
                    <input value={round.name} onChange={e => setNewRounds(current => current.map((r, i) => i === index ? { ...r, name: e.target.value } : r))} placeholder="Round name" />
                    <input type="datetime-local" value={round.deadline} onChange={e => setNewRounds(current => current.map((r, i) => i === index ? { ...r, deadline: e.target.value } : r))} />
                    <input value={round.submission_link} onChange={e => setNewRounds(current => current.map((r, i) => i === index ? { ...r, submission_link: e.target.value } : r))} placeholder="Submission link" />
                    <input value={round.notes} onChange={e => setNewRounds(current => current.map((r, i) => i === index ? { ...r, notes: e.target.value } : r))} placeholder="Notes" />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={handleCreateHackathon} disabled={creating} className="btn-primary">
                  {creating ? 'Creating...' : 'Create Hackathon'}
                </button>
              </div>
            </Card>
          )}

          {showBulkImport && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs tracking-[0.3em] text-accent-green">BULK IMPORT</div>
                <div className="text-xs text-text-muted">Paste one entry per line — format: <em>name|organizer|platform|theme|color</em></div>
              </div>
              <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder={`Hackathon A|Org A|Devfolio|AI/ML|#00d4aa\nHackathon B|Org B|Unstop|Web3|#8b5cf6`} className="w-full h-40 p-3 bg-bg-secondary border-border-dim" />
              <div className="mt-3 flex justify-end gap-2">
                <button onClick={() => { setShowBulkImport(false); setBulkInput('') }} className="btn-ghost">Cancel</button>
                <button onClick={handleBulkImport} disabled={bulkImporting} className="btn-primary">{bulkImporting ? 'Importing...' : 'Import'}</button>
              </div>
            </Card>
          )}

          {showEdit && selected && (
            <Card className="border-2 border-accent-blue/50">
              <div className="text-xs tracking-[0.3em] text-accent-blue font-bold">EDIT HACKATHON</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                  value={editData.name} 
                  onChange={e => setEditData(v => ({ ...v, name: e.target.value }))} 
                  placeholder="Hackathon name" 
                />
                <input 
                  value={editData.organizer} 
                  onChange={e => setEditData(v => ({ ...v, organizer: e.target.value }))} 
                  placeholder="Organizer" 
                />
                <input 
                  value={editData.platform} 
                  onChange={e => setEditData(v => ({ ...v, platform: e.target.value }))} 
                  placeholder="Platform (Devfolio/Unstop)" 
                />
                <input 
                  value={editData.platform_url} 
                  onChange={e => setEditData(v => ({ ...v, platform_url: e.target.value }))} 
                  placeholder="Platform URL" 
                />
                <input 
                  value={editData.theme} 
                  onChange={e => setEditData(v => ({ ...v, theme: e.target.value }))} 
                  placeholder="Theme" 
                />
                <input 
                  value={editData.color} 
                  onChange={e => setEditData(v => ({ ...v, color: e.target.value }))} 
                  placeholder="Color (e.g. #00d4aa)" 
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowEdit(false)} className="btn-ghost" disabled={editing}>
                  Cancel
                </button>
                <button onClick={handleEditHackathon} disabled={editing} className="btn-primary">
                  {editing ? 'Saving...' : '✓ Save Changes'}
                </button>
              </div>
            </Card>
          )}

          {!selected ? (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Active hackathons', value: stats.active, detail: `${stats.upcoming} upcoming`, color: 'from-emerald-500/20 to-cyan-500/20', textColor: 'text-emerald-400' },
                  { label: 'Upcoming deadlines', value: urgentRounds.length, detail: 'next 48 hours', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400' },
                  { label: 'Team members', value: memberCount || 12, detail: 'across selected hackathons', color: 'from-blue-500/20 to-purple-500/20', textColor: 'text-blue-400' },
                  { label: 'Tasks completed', value: `${doneTasks}/${selected?.tasks.length ?? 3}`, detail: 'today', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-400' },
                ].map((item, i) => (
                  <Card key={item.label} className={`bg-gradient-to-br ${item.color} border-border-mid hover:border-accent-green/50`}>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-text-muted">{item.label}</div>
                    <div className={cn('mt-3 text-4xl font-black', item.textColor)}>{item.value}</div>
                    <div className="mt-2 text-sm text-text-secondary">{item.detail}</div>
                  </Card>
                ))}
              </section>

              <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs tracking-[0.3em] text-accent-green">HACKATHONS</div>
                      <div className="text-xl font-bold mt-1">Your command center</div>
                    </div>
                    <Pill tone="green">IST aware</Pill>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {advancedFiltered.length > 0 ? advancedFiltered.map(h => {
                      const progress = roundProgress(h.rounds)
                      const nextRound = h.rounds.find(r => r.status === 'pending')
                      return (
                        <button key={h.id} onClick={() => setSelectedId(h.id)} className="text-left rounded-xl border-2 bg-gradient-to-br from-bg-secondary to-bg-tertiary p-4 transition-all hover:border-accent-green hover:shadow-lg hover:shadow-accent-green/20" style={{ borderColor: h.color || '#1a2740' }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-lg">{h.name}</div>
                              <div className="text-xs text-text-muted mt-1">{h.organizer}</div>
                            </div>
                            <Pill tone={h.status === 'active' ? 'green' : 'default'}>{h.status.toUpperCase()}</Pill>
                          </div>
                          <div className="mt-3"><ProgressBar value={progress} color={h.color} /></div>
                          {nextRound && <div className="mt-3 text-xs text-text-secondary">Next: <span className="text-accent-blue">{nextRound.name}</span> • {formatDeadline(nextRound.deadline)}</div>}
                        </button>
                      )
                    }) : (
                      <div className="md:col-span-2 rounded-2xl border-2 border-dashed border-border-mid bg-gradient-to-br from-bg-secondary/30 to-bg-tertiary/30 p-12 text-center flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">No Hackathons Yet</h3>
                        <p className="text-sm text-text-secondary mb-6">Start tracking your hackathons! Create your first one to get started.</p>
                        <button onClick={() => setShowCreate(true)} className="btn-primary">
                          ✨ Create Your First Hackathon
                        </button>
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div className="text-xs tracking-[0.3em] text-accent-green">QUICK LINKS</div>
                  <div className="mt-3 space-y-3 text-sm">
                    <div className="rounded-lg border border-border-dim bg-bg-tertiary px-3 py-2">GitHub repo</div>
                    <div className="rounded-lg border border-border-dim bg-bg-tertiary px-3 py-2">Figma design</div>
                    <div className="rounded-lg border border-border-dim bg-bg-tertiary px-3 py-2">Pitch deck</div>
                    <div className="rounded-lg border border-border-dim bg-bg-tertiary px-3 py-2">API keys</div>
                  </div>
                </Card>
              </section>
            </>
          ) : (
            <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
              <Card>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="text-xs tracking-[0.3em] text-accent-green font-bold">SIGNED IN</div>
                    <h2 className="text-2xl font-black mt-1 bg-gradient-to-r from-accent-green to-accent-blue bg-clip-text text-transparent">{selected.name}</h2>
                    <div className="text-sm text-text-secondary mt-1">{selected.organizer} • <span className="text-accent-purple">{selected.platform}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost hover:text-accent-blue" onClick={() => setSelectedId(null)}>← Back</button>
                    {isOwner && (
                      <>
                        <button
                          className="px-4 py-2 rounded-md text-sm font-bold transition-all bg-accent-blue text-white hover:brightness-110 border border-accent-blue"
                          onClick={openEditModal}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="px-4 py-2 rounded-md text-sm font-bold transition-all bg-accent-purple text-white hover:brightness-110 border border-accent-purple"
                          onClick={() => handleCloneHackathon(selected.id)}
                        >
                          📋 Clone
                        </button>
                      </>
                    )}
                    <button 
                      className={cn(
                        'px-4 py-2 rounded-md text-sm font-bold transition-all',
                        isOwner 
                          ? 'bg-accent-red text-white hover:brightness-110 border border-accent-red' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50 border border-gray-700'
                      )}
                      onClick={() => isOwner && handleDeleteHackathon(selected.id)}
                      disabled={!isOwner}
                      title={isOwner ? 'Delete this hackathon' : 'Only owner can delete'}
                    >
                      🗑 Delete Hackathon
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Rounds', value: selected.rounds.length, icon: '📍' },
                    { label: 'Team', value: selected.team_members.length, icon: '👥' },
                    { label: 'Tasks', value: selected.tasks.length, icon: '✓' },
                    { label: 'Done', value: selected.tasks.filter(t => t.status === 'done').length, icon: '🎉' },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border-2 border-border-mid bg-gradient-to-br from-bg-secondary to-bg-tertiary p-3 hover:border-accent-green/50 transition-colors">
                      <div className="text-[10px] tracking-[0.3em] text-text-muted">{item.label}</div>
                      <div className="text-3xl font-black text-accent-green mt-2">{item.value}</div>
                      <div className="text-lg mt-1">{item.icon}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="text-xs tracking-[0.3em] text-text-muted font-bold">⏱ ROUND TIMELINE</div>
                  {selected.rounds.map((r, idx) => (
                    <div key={r.id} className="rounded-xl border-2 border-border-mid bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary p-4 hover:border-accent-green/50 transition-colors" style={{ borderLeftColor: idx % 2 === 0 ? '#00d4aa' : '#8b5cf6' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-lg flex items-center gap-2">
                            <span style={{ color: ['#00d4aa', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f87171'][idx % 5] }}>●</span>
                            {r.name}
                          </div>
                          <div className="text-xs text-text-secondary mt-1 font-mono">{formatDeadline(r.deadline)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Pill tone={r.status === 'submitted' ? 'green' : r.status === 'cleared' ? 'amber' : 'default'}>{r.status}</Pill>
                          <div className="flex gap-1">
                            <button className="btn-ghost text-[10px] px-2 py-1 hover:text-accent-blue" onClick={() => handleUpdateRoundStatus(r.id, 'pending')}>Pending</button>
                            <button className="btn-ghost text-[10px] px-2 py-1 hover:text-accent-green" onClick={() => handleUpdateRoundStatus(r.id, 'submitted')}>Submitted</button>
                            <button className="btn-ghost text-[10px] px-2 py-1 hover:text-accent-amber" onClick={() => handleUpdateRoundStatus(r.id, 'cleared')}>Cleared</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="border-2 border-emerald-900/40 bg-gradient-to-br from-emerald-950/30 to-bg-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs tracking-[0.3em] text-accent-green font-bold">👥 TEAM</div>
                    {isOwner && <Pill tone="green">⚙️ OWNER</Pill>}
                  </div>

                  {isOwner && (
                    <div className="mt-4 space-y-2 rounded-xl border-2 border-accent-green/30 bg-emerald-950/20 p-3">
                      <div className="text-[10px] tracking-[0.3em] text-accent-green">INVITE BY EMAIL</div>
                      <div className="flex gap-2">
                        <input
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="teammate@gmail.com"
                          className="flex-1 border-accent-green/50"
                        />
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-32 border-accent-green/50">
                          <option>Member</option>
                          <option>Frontend</option>
                          <option>Backend</option>
                          <option>Design</option>
                          <option>ML</option>
                          <option>Pitch</option>
                        </select>
                      </div>
                      <button onClick={handleInviteTeammate} disabled={inviting} className="btn-primary w-full text-xs">
                        {inviting ? 'Inviting...' : '✨ Invite teammate'}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 space-y-3">
                    {selected.team_members.length > 0 ? (
                      selected.team_members.map((m, i) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border-mid bg-bg-tertiary/50 p-2 hover:border-accent-green/50 transition-colors">
                          <Avatar name={m.profile?.full_name ?? m.email} url={m.profile?.avatar_url} index={i} size={32} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate">{m.profile?.full_name ?? m.email}</div>
                            <div className="text-xs text-accent-blue">{m.role}</div>
                          </div>
                          {isOwner && m.email.toLowerCase() !== (user.email ?? '').toLowerCase() && (
                            <button onClick={() => handleRemoveTeammate(m.email)} className="text-accent-red hover:text-accent-red hover:scale-125 transition-all" title="Remove teammate">
                              ✕
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border-2 border-dashed border-border-mid bg-bg-tertiary/50 p-6 text-center">
                        <div className="text-3xl mb-2">👥</div>
                        <p className="text-xs text-text-muted">No team members yet. Invite someone to get started!</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="border-2 border-blue-900/40 bg-gradient-to-br from-blue-950/30 to-bg-secondary">
                  <div className="text-xs tracking-[0.3em] text-accent-blue font-bold">🔗 RESOURCES</div>
                  <div className="mt-3 space-y-2 text-sm text-text-secondary">
                    <div className="flex items-center gap-2"><span className="text-accent-green">•</span> GitHub: <span className="text-accent-blue">{selected.resources?.github_url ?? 'not set'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-accent-purple">•</span> Figma: <span className="text-accent-purple">{selected.resources?.figma_url ?? 'not set'}</span></div>
                    <div className="flex items-center gap-2"><span className="text-accent-amber">•</span> Slides: <span className="text-accent-amber">{selected.resources?.presentation_url ?? 'not set'}</span></div>
                  </div>
                </Card>

                <Card className="border-2 border-violet-900/30 bg-gradient-to-br from-violet-950/20 to-bg-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.3em] text-accent-purple font-bold">📌 TASK KANBAN</div>
                      <div className="text-sm text-text-secondary mt-1">Drag cards between columns to update status</div>
                    </div>
                    <Pill tone="amber">Drag & drop</Pill>
                  </div>

                  {selected.tasks.length > 0 ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {([
                        { id: 'todo', label: 'Todo', tone: 'default', accent: '#0ea5e9', emoji: '📝' },
                        { id: 'in-progress', label: 'In Progress', tone: 'amber', accent: '#f59e0b', emoji: '⚙️' },
                        { id: 'done', label: 'Done', tone: 'green', accent: '#00d4aa', emoji: '✅' },
                      ] as const).map(column => {
                        const columnTasks = selected.tasks.filter(task => task.status === column.id)
                        const isActiveDrop = dragOverStatus === column.id

                        return (
                          <div
                            key={column.id}
                            onDragOver={event => {
                              event.preventDefault()
                              setDragOverStatus(column.id)
                            }}
                            onDragLeave={() => {
                              if (dragOverStatus === column.id) setDragOverStatus(null)
                            }}
                            onDrop={event => {
                              event.preventDefault()
                              handleTaskDrop(column.id)
                            }}
                            className={cn(
                              'rounded-2xl border-2 p-3 min-h-[220px] transition-all',
                              isActiveDrop ? 'border-accent-green bg-accent-green/10 shadow-lg shadow-accent-green/10' : 'border-border-dim bg-bg-tertiary/60'
                            )}
                            style={{ boxShadow: isActiveDrop ? `0 0 0 1px ${column.accent}40` : undefined }}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{column.emoji}</span>
                                <div>
                                  <div className="text-xs tracking-[0.3em] text-text-muted font-bold">{column.label}</div>
                                  <div className="text-[10px] text-text-muted">{columnTasks.length} task{columnTasks.length === 1 ? '' : 's'}</div>
                                </div>
                              </div>
                              <Pill tone={column.tone}>{column.id}</Pill>
                            </div>

                            <div className="space-y-2">
                              {columnTasks.length > 0 ? (
                                columnTasks.map(task => (
                                  <div
                                    key={task.id}
                                    draggable
                                    onDragStart={() => handleTaskDragStart(task.id)}
                                    onDragEnd={handleTaskDragEnd}
                                    className={cn(
                                      'rounded-xl border border-border-mid bg-bg-secondary p-3 cursor-grab active:cursor-grabbing transition-all',
                                      draggingTaskId === task.id ? 'opacity-60 scale-[0.98] border-accent-green' : 'hover:border-accent-green/50 hover:-translate-y-px'
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold leading-snug">{task.title}</div>
                                        <div className="text-[11px] text-text-muted mt-1 line-clamp-2">{task.description ?? 'No description'}</div>
                                      </div>
                                      <Pill tone={task.status === 'done' ? 'green' : task.status === 'in-progress' ? 'amber' : 'default'}>
                                        {task.status}
                                      </Pill>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-text-secondary">
                                      <span>{task.assignee_email ?? 'Unassigned'}</span>
                                      <span className="text-text-muted">#{task.id.slice(0, 6)}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="rounded-xl border border-dashed border-border-mid bg-bg-secondary/50 p-5 text-center text-xs text-text-muted">
                                  Drop tasks here
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border-2 border-dashed border-border-mid bg-bg-tertiary/50 p-6 text-center">
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-xs text-text-muted">No tasks yet. Get started by creating one!</p>
                    </div>
                  )}
                </Card>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}