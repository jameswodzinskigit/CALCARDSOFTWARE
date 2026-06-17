interface Tip {
  icon: string
  title: string
  body: string
  urgent?: boolean
}

interface Props {
  tips: Tip[]
}

export default function QuickWinsPanel({ tips }: Props) {
  if (tips.length === 0) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
        <span className="text-sm">💡</span>
        <h2 className="text-white font-semibold text-sm">Quick Wins</h2>
        <span className="text-gray-500 text-xs ml-1">— actions to take today</span>
      </div>
      <div className="divide-y divide-gray-800">
        {tips.map((tip, i) => (
          <div key={i} className={'flex items-start gap-3 px-5 py-3.5 ' + (tip.urgent ? 'bg-red-500/5' : '')}>
            <span className="text-xl flex-shrink-0 mt-0.5">{tip.icon}</span>
            <div>
              <p className={'text-sm font-semibold ' + (tip.urgent ? 'text-red-400' : 'text-white')}>{tip.title}</p>
              <p className="text-gray-400 text-xs mt-0.5">{tip.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
