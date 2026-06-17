'use client'
import { useState, useEffect } from 'react'

type Review = {
  id: string
  reviewer_name: string | null
  rating: number
  body: string | null
  reviewed_at: string
  employee_name: string | null
}

type LeaderboardEntry = {
  employee_id: string
  first_name: string
  reviews_this_month: number
  five_star_reviews: number
}

type Company = {
  id: string
  name: string
}

interface Props {
  company: Company
  initialReviews: Review[]
  leaderboard: LeaderboardEntry[]
}

const medalEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function ReviewWallClient({ company, initialReviews, leaderboard }: Props) {
  const [activeReview, setActiveReview] = useState(0)
  const [tick, setTick] = useState(0)

  // Auto-cycle through reviews every 8 seconds
  useEffect(() => {
    if (initialReviews.length === 0) return
    const interval = setInterval(() => {
      setActiveReview(prev => (prev + 1) % initialReviews.length)
      setTick(t => t + 1)
    }, 8000)
    return () => clearInterval(interval)
  }, [initialReviews.length])

  const review = initialReviews[activeReview]
  const now = new Date()
  const month = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-bold text-xl">C</div>
          <div>
            <p className="font-bold text-lg leading-tight">{company.name}</p>
            <p className="text-gray-400 text-sm">Live Review Wall</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-sm">{month} Leaderboard</p>
          <p className="text-white font-semibold">{initialReviews.length} recent reviews shown</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: spotlight review */}
        <div className="flex-1 flex flex-col items-center justify-center p-16">
          {review ? (
            <div key={tick} className="max-w-2xl w-full animate-fade-in">
              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-5xl">⭐</span>
                ))}
              </div>

              {/* Review text */}
              {review.body && (
                <blockquote className="text-3xl font-medium text-white text-center leading-relaxed mb-8">
                  &ldquo;{review.body}&rdquo;
                </blockquote>
              )}

              {/* Attribution */}
              <div className="text-center">
                <p className="text-gray-400 text-lg">{review.reviewer_name || 'A happy customer'}</p>
                {review.employee_name && (
                  <p className="text-green-400 font-semibold text-xl mt-1">
                    ✓ Review for <span className="text-white">{review.employee_name}</span>
                  </p>
                )}
                <p className="text-gray-600 text-sm mt-2">
                  {new Date(review.reviewed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Progress dots */}
              {initialReviews.length > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {initialReviews.slice(0, Math.min(initialReviews.length, 10)).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i === activeReview ? 'w-8 bg-green-500' : 'w-1.5 bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p className="text-6xl mb-4">⭐</p>
              <p className="text-xl">Reviews will appear here as they come in</p>
            </div>
          )}
        </div>

        {/* Right: leaderboard sidebar */}
        <div className="w-80 border-l border-gray-800 flex flex-col">
          <div className="p-6 border-b border-gray-800">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">This Month</p>
            <p className="text-white font-bold text-xl">🏆 Top Performers</p>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {leaderboard.map((entry, idx) => {
              const rank = idx + 1
              return (
                <div
                  key={entry.employee_id}
                  className={`flex items-center gap-3 p-4 rounded-xl ${rank === 1 ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900 border border-gray-800'}`}
                >
                  <span className="text-2xl w-8">{medalEmoji[rank] ?? `#${rank}`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                      {entry.first_name[0]?.toUpperCase()}
                    </div>
                    <p className="text-white font-semibold">{entry.first_name}</p>
                    <p className="text-gray-400 text-sm">{entry.reviews_this_month} reviews this month</p>
                    {entry.five_star_reviews > 0 && (
                      <p className="text-yellow-400 text-xs">{entry.five_star_reviews} × ⭐⭐⭐⭐⭐</p>
                    )}
                  </div>
                </div>
              )
            })}
            {leaderboard.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-8">Rankings appear once reviews are received</p>
            )}
          </div>

          {/* Bottom branding */}
          <div className="p-6 border-t border-gray-800 text-center">
            <p className="text-gray-600 text-xs">Powered by CalCard</p>
            <p className="text-green-400 text-xs font-medium mt-0.5">Review Gamification Platform</p>
          </div>
        </div>
      </div>
    </div>
  )
}
