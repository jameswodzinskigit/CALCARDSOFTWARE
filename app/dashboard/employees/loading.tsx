import { SkeletonTable } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse h-6 bg-gray-800 rounded w-28" />
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <SkeletonTable rows={6} />
      </div>
    </div>
  )
}
