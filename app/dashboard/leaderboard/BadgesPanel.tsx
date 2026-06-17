'use client'

const BADGE_DEFS = [
  { key: 'first_review', icon: '⭐', label: 'First Review', desc: 'Receive your first Google review' },
  { key: 'ten_reviews', icon: '🏅', label: '10 Reviews', desc: 'Reach 10 total reviews' },
  { key: 'fifty_reviews', icon: '🥈', label: '50 Reviews', desc: 'Reach 50 total reviews' },
  { key: 'hundred_reviews', icon: '🥇', label: '100 Reviews', desc: 'Reach 100 total reviews' },
  { key: 'five_star_champion', icon: '👑', label: '5-Star Champion', desc: 'Maintain a 4.8+ rating for 30 days' },
  { key: 'review_king', icon: '🏆', label: 'Review King', desc: 'Reach #1 in your market' },
  { key: 'tap_master', icon: '📲', label: 'Tap Master', desc: '50+ NFC taps in a month' },
  { key: 'speed_demon', icon: '⚡', label: 'Speed Demon', desc: 'Get a review within 1 hour of a tap' },
]

export default function BadgesPanel({ earnedKeys }: { earnedKeys: string[] }) {
  const earnedSet = new Set(earnedKeys)

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">Achievement Badges</h2>
        <span className="text-gray-500 text-xs">{earnedKeys.length}/{BADGE_DEFS.length} earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BADGE_DEFS.map(badge => {
          const earned = earnedSet.has(badge.key)
          return (
            <div
              key={badge.key}
              className={'relative rounded-xl p-4 text-center border transition-all ' + (
                earned
                  ? 'bg-gray-800 border-gray-700'
                  : 'border-gray-800/40 opacity-60'
              )}
              title={badge.desc}
            >
              <div className={'text-3xl mb-2 ' + (earned ? '' : 'grayscale')}>
                {badge.icon}
              </div>
              <p className={'text-xs font-semibold ' + (earned ? 'text-white' : 'text-gray-600')}>{badge.label}</p>
              <p className={'text-xs mt-0.5 ' + (earned ? 'text-gray-400' : 'text-gray-700')} style={{ fontSize: '10px' }}>{badge.desc}</p>
              {!earned && (
                <div className="absolute top-2 right-2 text-gray-700 text-xs">🔒</div>
              )}
              {earned && (
                <div className="absolute top-2 right-2 text-green-400 text-xs">✓</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
