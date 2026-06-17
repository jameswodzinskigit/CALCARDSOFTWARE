import { Skeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-24" />
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}
