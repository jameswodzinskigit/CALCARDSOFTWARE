'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
  warning: (msg: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const COLORS: Record<ToastType, string> = {
  success: 'bg-green-500/10 border-green-500/30 text-green-400',
  error: 'bg-red-500/10 border-red-500/30 text-red-400',
  info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  return (
    <div className={'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg shadow-black/30 backdrop-blur-sm animate-slide-up ' + COLORS[toast.type]}>
      <span className="font-bold text-sm flex-shrink-0">{ICONS[toast.type]}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-current opacity-60 hover:opacity-100 transition-opacity text-xs ml-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-2), { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const ctx: ToastContextValue = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    info: (msg) => add('info', msg),
    warning: (msg) => add('warning', msg),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 z-[9999] space-y-2 max-w-xs w-full pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onDismiss={dismiss} />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}
