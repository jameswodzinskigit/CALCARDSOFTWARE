export interface HealthInput {
  reviewsThisMonth: number
  reviewsLastMonth: number
  avgRating: number
  goalTarget: number
  leadsThisMonth: number
  leadsLastMonth: number
  tapsThisMonth: number
}

export interface HealthBreakdown {
  label: string
  points: number
  max: number
  note: string
}

export interface HealthScore {
  score: number
  grade: 'Excellent' | 'Good' | 'Needs Attention' | 'At Risk'
  gradeColor: string
  breakdown: HealthBreakdown[]
}

export function computeHealthScore(input: HealthInput): HealthScore {
  let score = 0
  const breakdown: HealthBreakdown[] = []

  // Review volume (25 pts)
  const reviewPts =
    input.reviewsThisMonth >= 10 ? 25 :
    input.reviewsThisMonth >= 5  ? 15 :
    input.reviewsThisMonth >= 1  ? 8  : 0
  score += reviewPts
  breakdown.push({ label: 'Review Volume', points: reviewPts, max: 25, note: input.reviewsThisMonth + ' reviews this month' })

  // Star rating (25 pts)
  const ratingPts =
    input.avgRating >= 4.8 ? 25 :
    input.avgRating >= 4.5 ? 20 :
    input.avgRating >= 4.0 ? 12 :
    input.avgRating >= 3.5 ? 6  : 0
  score += ratingPts
  breakdown.push({ label: 'Star Rating', points: ratingPts, max: 25, note: (input.avgRating > 0 ? input.avgRating.toFixed(1) : '—') + ' avg rating' })

  // Goal progress (25 pts)
  const goalPct = input.goalTarget > 0 ? (input.reviewsThisMonth / input.goalTarget) * 100 : 50
  const goalPts =
    goalPct >= 100 ? 25 :
    goalPct >= 75  ? 18 :
    goalPct >= 50  ? 12 :
    goalPct >= 25  ? 6  : 0
  score += goalPts
  breakdown.push({ label: 'Goal Progress', points: goalPts, max: 25, note: Math.round(goalPct) + '% of monthly goal' })

  // NFC activity (25 pts)
  const tapPts =
    input.tapsThisMonth >= 20 ? 25 :
    input.tapsThisMonth >= 10 ? 18 :
    input.tapsThisMonth >= 5  ? 12 :
    input.tapsThisMonth >= 1  ? 6  : 0
  score += tapPts
  breakdown.push({ label: 'NFC Activity', points: tapPts, max: 25, note: input.tapsThisMonth + ' taps this month' })

  const grade: HealthScore['grade'] =
    score >= 90 ? 'Excellent' :
    score >= 75 ? 'Good' :
    score >= 60 ? 'Needs Attention' : 'At Risk'

  const gradeColor =
    score >= 90 ? 'text-green-400' :
    score >= 75 ? 'text-blue-400' :
    score >= 60 ? 'text-yellow-400' : 'text-red-400'

  return { score, grade, gradeColor, breakdown }
}
