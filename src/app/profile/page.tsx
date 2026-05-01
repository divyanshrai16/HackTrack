"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ThemeToggle } from '@/components/ThemeToggle'

export const dynamic = 'force-dynamic'

export default function ProfilePage({}: {}) {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')
  const [bio, setBio] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const currentUser = supabase.auth.user()

    setUser(currentUser)
    setName(currentUser?.user_metadata?.full_name ?? '')
    setAvatar(currentUser?.user_metadata?.avatar_url ?? '')
    setBio(currentUser?.user_metadata?.bio ?? '')
    setReady(true)
  }, [])

  async function handleSave() {
    if (!user) return toast.error('Not signed in')
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, full_name: name, avatar_url: avatar, bio }, { onConflict: 'id' })
      if (error) throw error
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Profile Settings</h1>
          <p className="text-xs sm:text-sm text-text-secondary">Update your display name, avatar and bio.</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl">
        {!ready ? <p className="mb-4 text-sm text-text-muted">Loading profile...</p> : null}
        <label className="block text-sm text-text-muted mb-1">Full name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="mb-4" />

        <label className="block text-sm text-text-muted mb-1">Avatar URL</label>
        <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder="https://..." className="mb-4" />

        <label className="block text-sm text-text-muted mb-1">Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A short bio" className="mb-4 h-24" />

        <div className="flex flex-wrap gap-2">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          <button onClick={() => { setName(''); setAvatar(''); setBio('') }} className="btn-ghost">Reset</button>
        </div>
      </div>
    </div>
  )
}
