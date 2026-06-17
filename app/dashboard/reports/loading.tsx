import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-36" />
      <div className="h-24 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}
