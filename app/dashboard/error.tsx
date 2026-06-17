'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">Something went wrong</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          This page ran into an error. Try refreshing — if the problem persists, contact your CAL team.
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg text-sm transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
