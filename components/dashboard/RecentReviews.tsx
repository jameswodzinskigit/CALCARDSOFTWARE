interface Review {
  id: string
  reviewer_name: string
  rating: number
  body: string | null
  created_at: string
  profiles?: { first_name: string; last_name: string } | null
}

interface RecentReviewsProps {
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400">
      {'★'.repeat(Math.min(5, rating))}{'☆'.repeat(Math.max(0, 5 - rating))}
    </span>
  )
}

export default function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-gray-800">
        <h3 className="text-white font-semibold">Recent Reviews</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {reviews.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">No reviews yet</div>
        )}
        {reviews.map((review) => (
          <div key={review.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white text-sm font-medium">{review.reviewer_name || 'Anonymous'}</p>
                {review.profiles && (
                  <p className="text-gray-400 text-xs">
                    for {review.profiles.first_name} {review.profiles.last_name}
                  </p>
                )}
              </div>
              <StarRating rating={review.rating} />
            </div>
            {review.body && <p className="text-gray-300 text-sm leading-relaxed">{review.body}</p>}
            <p className="text-gray-600 text-xs mt-2">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
