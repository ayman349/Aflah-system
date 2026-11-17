'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('aflax-theme')
    const useDark = saved === 'dark'
    document.documentElement.classList.toggle('dark', useDark)
    setDark(useDark)
  }, [])

  function toggleTheme() {
    const nextDark = !dark
    document.documentElement.classList.toggle('dark', nextDark)
    window.localStorage.setItem('aflax-theme', nextDark ? 'dark' : 'light')
    setDark(nextDark)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="mx-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl transition hover:bg-white/20"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
    </button>
  )
}
