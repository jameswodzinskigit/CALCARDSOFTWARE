import { SkeletonCard } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-20" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
