'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme-mode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = stored ? stored === 'dark' : prefersDark
    setIsDark(shouldBeDark)
    // Apply the theme immediately
    const html = document.documentElement
    if (shouldBeDark) {
      html.classList.remove('light')
      html.classList.add('dark')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
  }, [])

  function applyTheme(dark: boolean) {
    const html = document.documentElement
    if (dark) {
      html.classList.remove('light')
      html.classList.add('dark')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
    localStorage.setItem('theme-mode', dark ? 'dark' : 'light')
  }

  function toggleTheme() {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    applyTheme(newIsDark)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-border-mid border-2 border-border-mid transition-all duration-300 flex items-center px-0.5 hover:border-accent-green hover:shadow-lg hover:shadow-accent-green/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current theme: ${isDark ? 'Dark' : 'Light'}`}
    >
      {/* Sun icon (light theme) */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* Moon icon (dark theme) */}
      <svg
        className={`absolute w-5 h-5 transition-all duration-300 ${
          isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
        }`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>

      {/* Slider knob */}
      <div
        className={`absolute top-0.5 w-6 h-6 bg-accent-green rounded-full transition-all duration-300 ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
