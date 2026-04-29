import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CountdownResult } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Countdown calculator ────────────────────────────────────────────────────
export function getCountdown(deadline: string | Date): CountdownResult {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return { label: 'Expired', isUrgent: false, isExpired: true, hoursLeft: 0 }

  const totalHours = Math.floor(diff / 3_600_000)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = Math.floor((diff % 3_600_000) / 60_000)

  let label: string
  if (days === 0 && hours === 0) label = `${minutes}m left`
  else if (days === 0) label = `${hours}h ${minutes}m left`
  else label = `${days}d ${hours}h left`

  return {
    label,
    isUrgent: totalHours < 24,
    isExpired: false,
    hoursLeft: totalHours,
  }
}

// ─── Avatar initials ─────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Status helpers ───────────────────────────────────────────────────────────
export function hackathonStatusLabel(status: string): string {
  const map: Record<string, string> = {
    upcoming: 'UPCOMING', active: 'ACTIVE',
    completed: 'COMPLETED', missed: 'MISSED',
  }
  return map[status] ?? status.toUpperCase()
}

export function roundProgress(rounds: { status: string }[]): number {
  if (!rounds.length) return 0
  return Math.round(
    (rounds.filter(r => r.status !== 'pending').length / rounds.length) * 100,
  )
}

// ─── Format date for display ─────────────────────────────────────────────────
export function formatDeadline(isoStr: string, timezone = 'Asia/Kolkata'): string {
  return new Date(isoStr).toLocaleString('en-IN', {
    timeZone: timezone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' IST'
}

// ─── Avatar color cycling ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#0a2e4a', text: '#60a5fa' },
  { bg: '#2e1b6e20', text: '#8b5cf6' },
  { bg: '#4a2d0020', text: '#f59e0b' },
  { bg: '#064e3b20', text: '#10b981' },
  { bg: '#4c051920', text: '#f43f5e' },
  { bg: '#003d3020', text: '#00d4aa' },
]

export function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

// ─── Round status next transition ────────────────────────────────────────────
export function nextRoundStatus(current: string): string {
  if (current === 'pending') return 'submitted'
  if (current === 'submitted') return 'cleared'
  return 'pending'
}

// ─── Task status next transition ────────────────────────────────────────────
export function nextTaskStatus(current: string): string {
  if (current === 'todo') return 'in-progress'
  if (current === 'in-progress') return 'done'
  return 'todo'
}
