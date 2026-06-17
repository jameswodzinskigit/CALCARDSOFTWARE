'use client'

import { useState } from 'react'

export interface DateRange {
  from: string
  to: string
  label: string
}

interface Props {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

const now = () => new Date()

const PRESETS = [
  {
    label: 'Today',
    compute: (): DateRange => {
      const d = isoDate(now())
      return { from: d, to: d, label: 'Today' }
    },
  },
  {
    label: 'Last 7 Days',
    compute: (): DateRange => ({
      from: isoDate(new Date(Date.now() - 7 * 86400000)),
      to: isoDate(now()),
      label: 'Last 7 Days',
    }),
  },
  {
    label: 'Last 30 Days',
    compute: (): DateRange => ({
      from: isoDate(new Date(Date.now() - 30 * 86400000)),
      to: isoDate(now()),
      label: 'Last 30 Days',
    }),
  },
  {
    label: 'Last 90 Days',
    compute: (): DateRange => ({
      from: isoDate(new Date(Date.now() - 90 * 86400000)),
      to: isoDate(now()),
      label: 'Last 90 Days',
    }),
  },
  {
    label: 'This Month',
    compute: (): DateRange => {
      const n = now()
      return {
        from: isoDate(new Date(n.getFullYear(), n.getMonth(), 1)),
        to: isoDate(n),
        label: 'This Month',
      }
    },
  },
  {
    label: 'Last Month',
    compute: (): DateRange => {
      const n = now()
      const first = new Date(n.getFullYear(), n.getMonth() - 1, 1)
      const last = new Date(n.getFullYear(), n.getMonth(), 0)
      return { from: isoDate(first), to: isoDate(last), label: 'Last Month' }
    },
  },
]

export default function DateRangePicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
      >
        <span>📅</span>
        <span>{value.label || label || 'Date Range'}</span>
        <svg className={'w-3.5 h-3.5 transition-transform ' + (open ? 'rotate-180' : '')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-20 overflow-hidden">
            {PRESETS.map(preset => {
              const active = value.label === preset.label
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    onChange(preset.compute())
                    setOpen(false)
                  }}
                  className={'w-full text-left px-4 py-2.5 text-sm transition-colors ' +
                    (active ? 'text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-gray-800')}
                  style={active ? { color: 'var(--brand-primary)' } : {}}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
