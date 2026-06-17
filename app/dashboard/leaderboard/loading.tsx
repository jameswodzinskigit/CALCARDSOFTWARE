import { SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-32" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-9 w-24 bg-gray-800 rounded-lg animate-pulse" />)}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-40" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    </div>
  )
}
