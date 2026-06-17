'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Company = { id: string; name: string; slug: string }

interface Props {
  currentOverrideId: string | null
  currentOverrideName: string | null
}

export default function CompanySwitcher({ currentOverrideId, currentOverrideName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadCompanies = async () => {
    if (companies.length > 0) return
    setLoading(true)
    const res = await fetch('/api/admin/companies-list')
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.companies || [])
    }
    setLoading(false)
  }

  const switchTo = async (companyId: string | null) => {
    setSwitching(true)
    setOpen(false)
    if (companyId) {
      await fetch('/api/admin/switch-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })
    } else {
      await fetch('/api/admin/switch-company', { method: 'DELETE' })
    }
    router.refresh()
    setSwitching(false)
  }

  const handleOpen = () => {
    setOpen(true)
    loadCompanies()
  }

  if (switching) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
        <span className="text-gray-400 text-xs">Switching…</span>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-xs"
      >
        <span className="text-gray-400">Viewing:</span>
        <span className="text-white font-medium max-w-[120px] truncate">
          {currentOverrideName || 'Own View'}
        </span>
        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-3 py-2 border-b border-gray-800">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Switch Company View</p>
          </div>

          {/* Own view option */}
          <button
            onClick={() => switchTo(null)}
            className={'w-full text-left px-4 py-2.5 text-sm transition-colors ' +
              (!currentOverrideId ? 'bg-green-900/20 text-green-400' : 'text-gray-300 hover:bg-gray-800')}
          >
            Own View (CAL Marketing)
            {!currentOverrideId && <span className="ml-2 text-xs text-green-500">✓ active</span>}
          </button>

          <div className="border-t border-gray-800" />

          {loading ? (
            <div className="px-4 py-3 text-gray-500 text-xs">Loading companies…</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {companies.map(co => (
                <button
                  key={co.id}
                  onClick={() => switchTo(co.id)}
                  className={'w-full text-left px-4 py-2.5 text-sm transition-colors ' +
                    (currentOverrideId === co.id ? 'bg-green-900/20 text-green-400' : 'text-gray-300 hover:bg-gray-800')}
                >
                  {co.name}
                  {currentOverrideId === co.id && <span className="ml-2 text-xs text-green-500">✓ active</span>}
                  <span className="block text-gray-600 text-xs">/{co.slug}</span>
                </button>
              ))}
              {!loading && companies.length === 0 && (
                <div className="px-4 py-3 text-gray-500 text-xs">No companies found</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
