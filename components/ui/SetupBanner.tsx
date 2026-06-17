interface SetupBannerProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  variant?: 'info' | 'warning'
}

export default function SetupBanner({ icon = '⚙️', title, description, action, variant = 'info' }: SetupBannerProps) {
  const colors = variant === 'warning'
    ? 'bg-yellow-900/20 border-yellow-700/40 text-yellow-300'
    : 'bg-blue-900/20 border-blue-700/40 text-blue-300'

  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 ${colors}`}>
      <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs mt-1 opacity-80">{description}</p>
        {action && (
          <a
            href={action.href}
            className="inline-block mt-3 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {action.label} →
          </a>
        )}
      </div>
    </div>
  )
}
