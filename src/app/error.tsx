"use client"

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => {
    // Keep the runtime log useful while still showing a friendly UI.
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-2xl border border-border-mid bg-bg-tertiary p-8 shadow-2xl">
          <div className="text-xs tracking-[0.35em] text-accent-red font-bold">APPLICATION ERROR</div>
          <h1 className="mt-3 text-3xl font-black">Something broke</h1>
          <p className="mt-3 text-sm text-text-secondary">
            HackTrack hit an unexpected error. You can try again or go back to the dashboard.
          </p>
          {error.digest && <p className="mt-3 text-[11px] text-text-muted">Error ID: {error.digest}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={reset} className="btn-primary">Try again</button>
            <Link href="/dashboard" className="btn-ghost">Open dashboard</Link>
          </div>
        </div>
      </body>
    </html>
  )
}
