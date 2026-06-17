'use client'

import { useState } from 'react'
import type { HealthScore } from '@/lib/healthScore'

interface Props {
  score: HealthScore
}

export default function HealthScoreCard({ score }: Props) {
  const [expanded, setExpanded] = useState(false)
  const deg = Math.round((score.score / 100) * 360)

  const ringColor =
    score.score >= 90 ? '#22c55e' :
    score.score >= 75 ? '#3b82f6' :
    score.score >= 60 ? '#eab308' : '#ef4444'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">Client Health Score</h2>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          {expanded ? 'Less ▲' : 'Details ▼'}
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* Conic-gradient ring */}
        <div
          className="relative flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${ringColor} ${deg}deg, #1f2937 ${deg}deg)`,
          }}
        >
          <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{score.score}</span>
          </div>
        </div>

        <div>
          <p className={'text-xl font-bold ' + score.gradeColor}>{score.grade}</p>
          <p className="text-gray-500 text-xs mt-0.5">out of 100 points</p>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 pt-4 border-t border-gray-800">
          {score.breakdown.map(item => {
            const pct = Math.round((item.points / item.max) * 100)
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs">{item.label}</span>
                  <span className="text-white text-xs font-semibold">{item.points}/{item.max}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: ringColor }}
                  />
                </div>
                <p className="text-gray-600 text-xs mt-0.5">{item.note}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
