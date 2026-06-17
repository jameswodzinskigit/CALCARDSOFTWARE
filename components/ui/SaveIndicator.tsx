'use client'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
}

export default function SaveIndicator({ status }: Props) {
  if (status === 'idle') return null

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-400 text-xs">
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Saving...
      </span>
    )
  }

  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-400 text-xs">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-red-400 text-xs">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Failed to save
    </span>
  )
}
