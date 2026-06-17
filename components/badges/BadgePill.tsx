export type BadgeType =
  | 'reviews_1'
  | 'reviews_5'
  | 'reviews_10'
  | 'reviews_25'
  | 'reviews_50'
  | 'reviews_100'

interface BadgeDef {
  emoji: string
  label: string
  description: string
  color: string
}

export const BADGE_MAP: Record<BadgeType, BadgeDef> = {
  reviews_1:   { emoji: '🌱', label: 'First Review',    description: 'Earned first review',       color: 'bg-green-900/40 text-green-400 border-green-700/50' },
  reviews_5:   { emoji: '🔥', label: 'On Fire',         description: '5 reviews earned',           color: 'bg-orange-900/40 text-orange-400 border-orange-700/50' },
  reviews_10:  { emoji: '⭐', label: '10 Reviews',      description: 'Reached 10 reviews',         color: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50' },
  reviews_25:  { emoji: '🏅', label: 'Rising Star',     description: '25 reviews — impressive',    color: 'bg-blue-900/40 text-blue-400 border-blue-700/50' },
  reviews_50:  { emoji: '💎', label: 'Diamond',         description: '50 reviews — elite level',   color: 'bg-purple-900/40 text-purple-400 border-purple-700/50' },
  reviews_100: { emoji: '👑', label: 'Legend',          description: '100 reviews — a true legend', color: 'bg-pink-900/40 text-pink-400 border-pink-700/50' },
}

export function BadgePill({ type }: { type: string }) {
  const def = BADGE_MAP[type as BadgeType]
  if (!def) return null
  return (
    <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border " + def.color}>
      {def.emoji} {def.label}
    </span>
  )
}
