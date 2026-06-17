'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'review' | 'employee' | 'page'
  title: string
  subtitle?: string
  href: string
}

const PAGE_RESULTS: SearchResult[] = [
  { id: 'p-overview', type: 'page', title: 'Overview', subtitle: 'Dashboard home', href: '/dashboard' },
  { id: 'p-reviews', type: 'page', title: 'Reviews', subtitle: 'Your Google reviews', href: '/dashboard/reviews' },
  { id: 'p-employees', type: 'page', title: 'Employees', subtitle: 'Team management', href: '/dashboard/employees' },
  { id: 'p-leaderboard', type: 'page', title: 'Leaderboard', subtitle: 'Review rankings', href: '/dashboard/leaderboard' },
  { id: 'p-goals', type: 'page', title: 'Goals', subtitle: 'Monthly targets', href: '/dashboard/goals' },
  { id: 'p-reports', type: 'page', title: 'Reports', subtitle: 'Monthly reports', href: '/dashboard/reports' },
  { id: 'p-settings', type: 'page', title: 'Settings', subtitle: 'Account settings', href: '/dashboard/settings' },
  { id: 'p-activity', type: 'page', title: 'Field Activity', subtitle: 'NFC tap feed', href: '/dashboard/activity' },
]

const TYPE_ICON: Record<string, string> = {
  review: '⭐',
  employee: '👤',
  page: '📄',
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ reviews: SearchResult[]; employees: SearchResult[]; pages: SearchResult[] }>({ reviews: [], employees: [], pages: [] })
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const allResults = [...results.pages, ...results.employees, ...results.reviews]

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setResults({ reviews: [], employees: [], pages: [] })
    setActiveIdx(0)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement === document.body) {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults({ reviews: [], employees: [], pages: PAGE_RESULTS.slice(0, 4).map(p => ({ ...p })) })
      return
    }

    const q = query.toLowerCase()
    const pages = PAGE_RESULTS.filter(p => p.title.toLowerCase().includes(q) || (p.subtitle || '').toLowerCase().includes(q)).slice(0, 3)
    setResults(prev => ({ ...prev, pages }))

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults({ pages, reviews: (data.reviews || []).slice(0, 3), employees: (data.employees || []).slice(0, 3) })
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => { setActiveIdx(0) }, [results])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allResults[activeIdx]) {
      router.push(allResults[activeIdx].href)
      close()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    )
  }

  const globalIdx = [...results.pages, ...results.employees, ...results.reviews]

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search reviews, employees, pages..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none"
          />
          {loading && <div className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
          <button onClick={close} className="text-gray-500 hover:text-white text-xs transition-colors flex-shrink-0">Esc</button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {allResults.length === 0 && query.trim() && !loading && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">No results for &quot;{query}&quot;</div>
          )}

          {[
            { label: 'Pages', items: results.pages },
            { label: 'Employees', items: results.employees },
            { label: 'Reviews', items: results.reviews },
          ].map(({ label, items }) => {
            if (items.length === 0) return null
            return (
              <div key={label}>
                <div className="px-4 py-2 text-gray-600 text-xs font-semibold uppercase tracking-wider bg-gray-900/80 sticky top-0">
                  {label}
                </div>
                {items.map((item) => {
                  const gi = globalIdx.findIndex(r => r.id === item.id)
                  const isActive = gi === activeIdx
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.href); close() }}
                      onMouseEnter={() => setActiveIdx(gi)}
                      className={'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ' + (isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50')}
                    >
                      <span className="text-base flex-shrink-0">{TYPE_ICON[item.type]}</span>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.title}</p>
                        {item.subtitle && <p className="text-gray-500 text-xs truncate">{item.subtitle}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        <div className="px-4 py-2 border-t border-gray-800 flex items-center gap-4 text-gray-600 text-xs">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
