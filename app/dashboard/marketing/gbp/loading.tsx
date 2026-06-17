import { SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="h-48 bg-gray-900 border border-gray-800 rounded-xl animate-pulse" />
    </div>
  )
}
