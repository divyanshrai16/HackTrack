'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginClient() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleGoogleLogin() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#00d4aa 1px, transparent 1px), linear-gradient(90deg, #00d4aa 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}/>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #00d4aa, transparent 70%)' }}/>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 justify-center mb-12">
          <div className="w-10 h-10 bg-accent-green rounded-lg flex items-center justify-center font-black text-black text-lg">H</div>
          <div>
            <div className="text-xl font-black text-accent-green tracking-widest">HACKTRACK</div>
            <div className="text-xs text-text-muted tracking-widest">COMMAND CENTER</div>
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-text-primary mb-3 leading-tight">
            Never miss a<br/>
            <span className="text-accent-green">hackathon deadline</span><br/>
            again.
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
            Centralized command center for hackathons — multi-round tracking,
            team sync, resource vault, and smart reminders.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {['Multi-round tracking', 'Team sync', 'Smart reminders', 'Resource vault', 'Kanban tasks'].map(f => (
            <span key={f} className="tag" style={{ background: '#0a2e1e', color: '#00d4aa' }}>
              {f}
            </span>
          ))}
        </div>

        <div className="card">
          <div className="text-center mb-6">
            <div className="text-xs text-text-muted tracking-widest mb-1">GET STARTED FREE</div>
            <div className="text-text-secondary text-sm">Sign in to your command center</div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold text-sm rounded-lg py-3 px-4 transition-all hover:bg-gray-100 active:scale-98 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin"/>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <p className="text-center text-xs text-text-muted mt-4">
            Invited to a team? Sign in with your invited email to auto-join.
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          No spam. Only hackathon deadline reminders you actually want.
        </p>
      </div>
    </div>
  )
}