'use client'

import { useState } from 'react'

interface ChecklistItem {
  key: string
  label: string
  description: string
  done: boolean
  link?: string
  linkLabel?: string
}

interface OnboardingChecklistProps {
  items: ChecklistItem[]
  companyId: string
}

export default function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const done = items.filter(i => i.done).length
  const total = items.length
  const pct = Math.round((done / total) * 100)

  if (dismissed || done === total) return null

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-lg">🚀</span>
          <div>
            <h2 className="text-white font-semibold text-sm">Get Started Checklist</h2>
            <p className="text-gray-500 text-xs">{done} of {total} complete</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800">
        <div
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-5 space-y-3">
        {items.map(item => (
          <div
            key={item.key}
            className={'flex items-start gap-3 p-3 rounded-lg transition-colors ' + (item.done ? 'opacity-50' : 'bg-gray-800/40')}
          >
            <div className={'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ' + (item.done ? 'bg-green-500 border-green-500' : 'border-gray-600')}>
              {item.done && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={'text-sm font-medium ' + (item.done ? 'line-through text-gray-500' : 'text-white')}>{item.label}</p>
              {!item.done && <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>}
              {!item.done && item.link && (
                <a href={item.link} className="text-green-400 text-xs hover:underline mt-1 inline-block">
                  {item.linkLabel || 'Go →'}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
