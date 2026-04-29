"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { formatDeadline, roundProgress } from '@/lib/utils'

export default function AnalyticsPage() {
  const [hackathons, setHackathons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void fetch('/api/hackathons')
      .then(r => r.json())
      .then(json => {
        if (!mounted) return
        setHackathons(Array.isArray(json.data) ? json.data : [])
      })
      .catch(() => setHackathons([]))
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const stats = useMemo(() => {
    const total = hackathons.length
    const totalTasks = hackathons.reduce((s, h) => s + (h.tasks?.length || 0), 0)
    const doneTasks = hackathons.reduce((s, h) => s + (h.tasks?.filter((t:any) => t.status === 'done').length || 0), 0)
    const avgTasks = total === 0 ? 0 : Math.round(totalTasks / total)
    const completion = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100)
    const byStatus = hackathons.reduce((acc: any, h: any) => { acc[h.status] = (acc[h.status] || 0) + 1; return acc }, {})
    const upcoming = hackathons.flatMap(h => (h.rounds || []).filter((r:any) => new Date(r.deadline).getTime() > Date.now())).length
    return { total, avgTasks, completion, byStatus, upcoming }
  }, [hackathons])

  if (loading) return <div className="p-6">Loading analytics…</div>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-text-secondary">Overview of your hackathons and team activity.</p>
        </div>
        <div className="flex items-center gap-3"><ThemeToggle /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-text-muted">Total Hackathons</div>
          <div className="text-3xl font-black mt-2">{stats.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted">Average Tasks / Hackathon</div>
          <div className="text-3xl font-black mt-2">{stats.avgTasks}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-text-muted">Overall Completion</div>
          <div className="text-3xl font-black mt-2">{stats.completion}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="text-xs text-text-muted mb-3">Hackathons by Status</div>
          <div className="flex gap-3 items-end h-40">
            {['active','upcoming','completed'].map((k:any) => {
              const value = stats.byStatus[k] || 0
              const height = Math.max(6, Math.min(100, (value / (stats.total || 1)) * 100))
              return (
                <div key={k} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-border-dim rounded" style={{ height: `${height}%` }} />
                  <div className="text-xs mt-2 uppercase text-text-muted">{k}</div>
                  <div className="text-sm font-bold">{value}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-4">
          <div className="text-xs text-text-muted mb-3">Upcoming Rounds</div>
          <div className="space-y-3 max-h-60 overflow-auto">
            {hackathons.flatMap(h => (h.rounds || []).map((r:any) => ({ hackathon: h, round: r }))).slice(0, 20).map((x:any, i:number) => (
              <div key={i} className="rounded-lg border border-border-dim p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{x.hackathon.name}</div>
                  <div className="text-xs text-text-muted">{x.round.name} • {formatDeadline(x.round.deadline)}</div>
                </div>
                <div className="text-sm text-text-secondary">{new Date(x.round.deadline).toLocaleString()}</div>
              </div>
            ))}
            {hackathons.length === 0 && <div className="text-sm text-text-muted">No upcoming rounds</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
