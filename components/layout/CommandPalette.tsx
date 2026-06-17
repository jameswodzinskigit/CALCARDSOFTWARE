'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const COMMANDS = [
  { label: 'Dashboard', icon: '🏠', href: '/dashboard' },
  { label: 'Reviews', icon: '⭐', href: '/dashboard/reviews' },
  { label: 'Employees', icon: '👥', href: '/dashboard/employees' },
  { label: 'Field Activity', icon: '📲', href: '/dashboard/activity' },
  { label: 'Leaderboard', icon: '🏆', href: '/dashboard/leaderboard' },
  { label: 'Goals', icon: '🎯', href: '/dashboard/goals' },
  { label: 'Reports', icon: '📄', href: '/dashboard/reports' },
  { label: 'Settings', icon: '⚙️', href: '/dashboard/settings' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActiveIdx(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = COMMANDS.filter(c =>
    !query.trim() || c.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => { setActiveIdx(0) }, [query])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && filtered[activeIdx]) {
      router.push(filtered[activeIdx].href)
      close()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Go to..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-500 text-xs font-mono">Esc</kbd>
        </div>

        <div className="py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">No commands found</div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.href}
                onClick={() => { router.push(cmd.href); close() }}
                onMouseEnter={() => setActiveIdx(i)}
                className={'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ' + (i === activeIdx ? 'bg-gray-800' : 'hover:bg-gray-800/50')}
              >
                <span className="text-base w-6 text-center flex-shrink-0">{cmd.icon}</span>
                <span className={'text-sm font-medium ' + (i === activeIdx ? 'text-white' : 'text-gray-300')}>{cmd.label}</span>
                {i === activeIdx && (
                  <kbd className="ml-auto text-xs text-gray-600 font-mono">↵</kbd>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-800 text-gray-600 text-xs flex gap-4">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span className="ml-auto">⌘K to toggle</span>
        </div>
      </div>
    </div>
  )
}
