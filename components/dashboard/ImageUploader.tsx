'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  currentUrl?: string | null
  type: 'avatar' | 'logo'
  id: string
  shape?: 'circle' | 'square'
  size?: 'sm' | 'md' | 'lg'
  fallbackLabel?: string
}

export default function ImageUploader({
  currentUrl,
  type,
  id,
  shape = 'circle',
  size = 'md',
  fallbackLabel = '?',
}: Props) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sizeMap = {
    sm: { box: 'w-8 h-8', text: 'text-sm', icon: 'text-xs' },
    md: { box: 'w-12 h-12', text: 'text-base', icon: 'text-xs' },
    lg: { box: 'w-20 h-20', text: 'text-2xl', icon: 'text-sm' },
  }
  const radiusClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  const sz = sizeMap[size]

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    fd.append('id', id)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setPreview(data.url)
        router.refresh()
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative inline-block group cursor-pointer"
      onClick={() => !uploading && inputRef.current?.click()}
      title="Click to upload image">

      {preview ? (
        <img
          src={preview}
          alt="profile"
          className={sz.box + ' ' + radiusClass + ' object-cover border-2 border-gray-700 group-hover:border-green-500 transition-colors'}
        />
      ) : (
        <div className={sz.box + ' ' + radiusClass + ' bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold border-2 border-transparent group-hover:border-green-400 transition-colors ' + sz.text}>
          {fallbackLabel}
        </div>
      )}

      {/* Hover overlay */}
      <div className={'absolute inset-0 ' + radiusClass + ' bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'}>
        {uploading ? (
          <div className={'border-2 border-white border-t-transparent rounded-full animate-spin ' + (size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4')} />
        ) : (
          <span className={'text-white ' + sz.icon}>&#128247;</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-400 whitespace-nowrap z-10">
          {error}
        </div>
      )}
    </div>
  )
}
