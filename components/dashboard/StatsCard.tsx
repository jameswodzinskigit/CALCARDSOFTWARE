interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ title, value, icon, change, changeType = 'neutral' }: StatsCardProps) {
  const changeColor = changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-gray-500'

  return (
    <div className="cal-stats-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-400 text-sm font-medium tracking-wide">{title}</p>
        <span className="text-xl opacity-80">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white mb-1 tracking-tight">{value}</p>
      {change && <p className={`text-xs font-medium ${changeColor}`}>{change}</p>}
    </div>
  )
}
