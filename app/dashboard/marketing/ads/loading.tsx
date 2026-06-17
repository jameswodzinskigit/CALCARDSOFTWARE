import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-36" />
      <div className="flex gap-1 border-b border-gray-800 pb-2">
        {[1, 2, 3].map(i => <div key={i} className="h-8 w-24 bg-gray-800 rounded animate-pulse" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <SkeletonTable rows={4} />
      </div>
    </div>
  )
}
