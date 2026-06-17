'use client'

import { useState, useEffect } from 'react'
import { timeAgo } from '@/lib/timeAgo'

interface ActivityItem {
  id: string
  type: string
  title: string
  body?: string
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  goal: '🎯',
  milestone: '🏆',
  warning: '⚠️',
  report: '📄',
  tip: '💡',
  review: '⭐',
  tap: '📲',
  default: '🔔',
}

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (itemDay.getTime() === today.getTime()) return 'Today'
  if (itemDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  async function load(p: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/activity?page=${p}`)
      if (res.ok) {
        const data = await res.json()
        setItems(prev => p === 1 ? data.items : [...prev, ...data.items])
        setHasMore(data.hasMore || false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  function loadMore() {
    const next = page + 1
    setPage(next)
    load(next)
  }

  // Group by day
  const grouped: { day: string; items: ActivityItem[] }[] = []
  for (const item of items) {
    const day = dayLabel(item.created_at)
    const existing = grouped.find(g => g.day === day)
    if (existing) existing.items.push(item)
    else grouped.push({ day, items: [item] })
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <h2 className="text-white font-semibold text-sm">Recent Activity</h2>
      </div>

      {loading && items.length === 0 ? (
        <div className="divide-y divide-gray-800">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
              <div className="w-8 h-8 bg-gray-800 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-48" />
                <div className="h-2.5 bg-gray-800 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">🔔</p>
          <p className="text-white font-semibold text-sm">No activity yet</p>
          <p className="text-gray-500 text-xs mt-1">Tap your first NFC card to get started</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {grouped.map(({ day, items: dayItems }) => (
            <div key={day}>
              <div className="px-5 py-2 text-gray-600 text-xs font-semibold uppercase tracking-wider bg-gray-900/90 sticky top-0">
                {day}
              </div>
              <div className="divide-y divide-gray-800">
                {dayItems.map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-base flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] || TYPE_ICON.default}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.title}</p>
                      {item.body && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{item.body}</p>}
                    </div>
                    <span className="text-gray-600 text-xs flex-shrink-0 mt-0.5">{timeAgo(item.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="px-5 py-3 border-t border-gray-800">
              <button
                onClick={loadMore}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more →'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
