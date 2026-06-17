'use client'
import { useEffect } from 'react'

interface Props { cardId: string; employeeId: string; companyId: string }

export default function TapTracker({ cardId, employeeId, companyId }: Props) {
  useEffect(() => {
    fetch('/api/track-tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, employeeId, companyId }),
    }).catch(() => {})
  }, [cardId, employeeId, companyId])
  return null
}
