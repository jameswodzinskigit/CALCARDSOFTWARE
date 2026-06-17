interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ title, value, icon, change, changeType = 'neutral' }: StatsCardProps) {
  const changeColor = changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      {change && <p className={`text-xs ${changeColor}`}>{change}</p>}
    </div>
  )
}
