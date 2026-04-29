"use client"

import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border border-border-mid bg-bg-tertiary p-8 shadow-2xl">
        <div className="text-xs tracking-[0.35em] text-accent-red font-bold">DASHBOARD ERROR</div>
        <h1 className="mt-3 text-3xl font-black">Dashboard failed to load</h1>
        <p className="mt-3 text-sm text-text-secondary">
          The dashboard hit a problem while rendering data. Refresh to retry or return home.
        </p>
        {error.digest && <p className="mt-3 text-[11px] text-text-muted">Error ID: {error.digest}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={reset} className="btn-primary">Retry dashboard</button>
          <Link href="/" className="btn-ghost">Go home</Link>
        </div>
      </div>
    </div>
  )
}
