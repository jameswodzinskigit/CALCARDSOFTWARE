interface LeaderboardEntry {
  rank: number
  name: string
  review_count: number
  employee_id: string
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  period?: string
}

const medalEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Leaderboard({ entries, period = 'monthly' }: LeaderboardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-gray-800">
        <h3 className="text-white font-semibold">Leaderboard</h3>
        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded capitalize">{period}</span>
      </div>
      <div className="divide-y divide-gray-800">
        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">No reviews yet this period</div>
        )}
        {entries.map((entry) => (
          <div key={entry.employee_id} className="flex items-center gap-4 px-5 py-3.5">
            <span className="text-lg w-8">{medalEmoji[entry.rank] || `#${entry.rank}`}</span>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{entry.name}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold">{entry.review_count}</p>
              <p className="text-gray-500 text-xs">reviews</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
