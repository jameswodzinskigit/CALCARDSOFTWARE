// app/admin/competitive/page.tsx
// Super-admin only — gate enforced by app/admin/layout.tsx
// Research updated: 2026-06-16

export const metadata = { title: 'Competitive Intelligence | CAL Admin' }

type Category = 'NFC Cards' | 'NFC + Platform' | 'Review Platform' | 'Gamification'

interface Competitor {
  name: string
  website: string
  category: Category
  price: string
  features: string[]
  weaknesses: string[]
  calCardAdvantage: string
  gbpPlaceId?: string | null
  gbpNote?: string
}

const COMPETITORS: Competitor[] = [
  // ─── Has NFC + employee tracking (closest rivals) ─────────────────────────
  {
    name: 'Tap Review Cards',
    website: 'tapreviewcards.co.uk',
    category: 'NFC + Platform',
    price: '~£17/card + subscription',
    features: [
      'Per-employee NFC cards with unique ID tracking',
      'Staff leaderboard (closest CalCard rival)',
      'AI auto-responses to reviews',
      'Smart feedback loop (catch negatives privately)',
      'Dashboard with tap & review analytics',
    ],
    weaknesses: [
      'UK-only company — no US market presence',
      'No badge / tier / reward system',
      'No GBP rank tracking',
      'No tip / tipping feature',
      'Pound-sterling pricing (friction for US buyers)',
    ],
    calCardAdvantage:
      'Most similar product in the market, but UK-only. CalCard owns the US trades vertical entirely. Deeper gamification layer (badges, tiers, rewards, tips) and built-in GBP rank tracking.',
    gbpPlaceId: null,
    gbpNote: 'UK company — no US GBP listing',
  },
  {
    name: 'GetMoreReviews',
    website: 'getmorereviews.com',
    category: 'NFC + Platform',
    price: '$129–299/mo',
    features: [
      'NFC tap cards bundled with platform subscription',
      'SMS & email automated review campaigns',
      'Bad review blocker (private feedback filter)',
      'Automated social media sharing of reviews',
      'Review monitoring across multiple platforms',
    ],
    weaknesses: [
      'No per-employee gamification or leaderboard',
      'No badges or reward system',
      'More expensive than NiceJob for similar reach',
      'No GBP rank tracking',
      'NFC cards are generic (not employee-specific)',
    ],
    calCardAdvantage:
      'GetMoreReviews NFC cards point to the business, not a specific employee. No gamification layer motivates techs. CalCard is cheaper, more motivating, and includes GBP tracking they don\'t offer.',
    gbpPlaceId: null,
    gbpNote: 'Online-only business — no GBP listing found',
  },

  // ─── Hardware-only NFC card vendors ──────────────────────────────────────
  {
    name: 'TAPro',
    website: 'taprocard.com',
    category: 'NFC Cards',
    price: '$15–30/card one-time (no monthly fee)',
    features: [
      'One-time purchase, zero monthly fees',
      'Works natively on iPhone 7+ (no app required)',
      '12,900+ businesses in 12 countries',
      'Cards for Google, Trustpilot, Facebook, Tripadvisor',
      'QR code fallback on card',
    ],
    weaknesses: [
      'Pure hardware — zero SaaS layer',
      'No employee attribution or tracking',
      'No leaderboard, badges, or rewards',
      'No analytics dashboard',
      'No GBP rank tracking',
    ],
    calCardAdvantage:
      'TAPro is a physical redirect card with no intelligence behind it. CalCard wraps every tap in attribution, gamification, and analytics. The monthly SaaS subscription creates ongoing value TAPro can never replicate.',
    gbpPlaceId: null,
    gbpNote: 'Online-only — no GBP listing found',
  },
  {
    name: 'TAPiTAG',
    website: 'tapitag.co',
    category: 'NFC Cards',
    price: '€24.99+/card one-time',
    features: [
      'NFC + QR review card, hardware-only',
      'Works with Google, Trustpilot, TripAdvisor, Yelp',
      'No monthly fee',
      'Custom branding options',
    ],
    weaknesses: [
      'No software layer — hardware only',
      'Euro pricing (friction for US buyers)',
      'No employee profiles or leaderboard',
      'No analytics or attribution',
    ],
    calCardAdvantage:
      'TAPiTAG is a passive redirect card. CalCard turns each tap into a tracked event tied to a named employee with a public profile, leaderboard ranking, and badge collection.',
    gbpPlaceId: null,
    gbpNote: 'EU company — no US GBP listing',
  },
  {
    name: 'ReviewsCard',
    website: 'reviewscard.com',
    category: 'NFC Cards',
    price: '~$19–39/card one-time',
    features: [
      'Tap-to-review NFC + QR card',
      'No monthly fees',
      'Multiple review platform support',
    ],
    weaknesses: [
      'No software platform at all',
      'No employee-level tracking',
      'No analytics or leaderboard',
    ],
    calCardAdvantage:
      'Same concept, none of the intelligence. CalCard wins on everything except upfront card cost — and the SaaS value justifies the ongoing subscription many times over.',
    gbpPlaceId: null,
    gbpNote: 'No GBP listing found',
  },

  // ─── Review generation SaaS (software-only) ───────────────────────────────
  {
    name: 'NiceJob',
    website: 'nicejob.com',
    category: 'Review Platform',
    price: '$75/mo (Reviews) · $125/mo (Pro) + $199 setup',
    features: [
      'Built for home service trades (plumbers, HVAC, electricians)',
      'Automated SMS/email review requests after job completion',
      'Jobber, Housecall Pro, FieldPulse integrations',
      'Referral campaign automation',
      'Review widgets for company website',
    ],
    weaknesses: [
      'No NFC hardware — review request is after-the-fact via text/email',
      'No employee attribution or leaderboard',
      'No gamification, badges, or rewards',
      'No GBP rank tracking',
      'Low conversion vs. in-person NFC tap',
    ],
    calCardAdvantage:
      'Closest pricing competitor ($75–125/mo vs CalCard). NiceJob captures reviews via automated follow-up texts/emails customers often ignore. CalCard captures them in the moment via NFC tap — higher conversion, deeper team motivation.',
    gbpPlaceId: null,
    gbpNote: 'HQ: Vancouver, BC, Canada — no US GBP listing',
  },
  {
    name: 'Podium',
    website: 'podium.com',
    category: 'Review Platform',
    price: '$399–599/mo base (real cost often $500–800/mo with add-ons)',
    features: [
      'SMS-first review collection + webchat',
      'Unified inbox (SMS, social, Google messages)',
      'Text-to-pay payments module',
      'AI review reply add-on ($99/mo extra)',
      'Multi-location management (2–5 locations)',
    ],
    weaknesses: [
      'No NFC cards at all',
      'No employee attribution or gamification',
      'Requires annual contract — hard to exit',
      'Real cost 5–8x more expensive than CalCard',
      'Built for text outreach, not point-of-service taps',
    ],
    calCardAdvantage:
      'Podium is the wrong tool for a 5-tech septic company. It\'s a $500–800/mo omnichannel messaging platform. CalCard is purpose-built for field techs, costs a fraction of the price, and drives more reviews per employee.',
    gbpPlaceId: 'ChIJhXpewdRCUocRmRtkGA0cVQY',
    gbpNote: 'HQ: Lehi, UT (software company — not a local service competitor)',
  },
  {
    name: 'Birdeye',
    website: 'birdeye.com',
    category: 'Review Platform',
    price: '$299+/mo per location (enterprise, quote-based)',
    features: [
      '200+ review platform monitoring',
      'AI-powered review responses',
      'Multi-location reputation management',
      'Social media management + listings sync',
      'Surveys, ticketing, and competitor benchmarking',
    ],
    weaknesses: [
      'Enterprise-priced — overkill for small trade teams',
      'No NFC cards or tap-to-review',
      'No employee gamification or leaderboard',
      'Complex onboarding, long sales cycle',
      'Not built for field service workers',
    ],
    calCardAdvantage:
      'Birdeye targets multi-location enterprises managing reputation at scale. CalCard targets the field tech team of a 1-location trade business — a completely different buyer who doesn\'t need 200 platform integrations.',
    gbpPlaceId: 'ChIJ8QBn__28j4ARRHXQSgXLSrA',
    gbpNote: 'HQ: 2479 E Bayshore Rd, Palo Alto, CA',
  },
  {
    name: 'Broadly',
    website: 'broadly.com',
    category: 'Review Platform',
    price: 'Custom pricing (contact sales)',
    features: [
      'Review collection + lead generation',
      'Webchat widget for local business websites',
      'Local SEO tools',
      'Automated follow-up campaigns',
      'Mobile app for field team use',
    ],
    weaknesses: [
      'No NFC hardware',
      'No employee gamification or leaderboard',
      'Opaque pricing requires sales call',
      'Lead gen focus dilutes the review tool',
      'No GBP rank tracking',
    ],
    calCardAdvantage:
      'Broadly bundles too many things into a complex platform. CalCard is laser-focused on field tech review gamification — simpler, more motivating, more effective for that specific use case.',
    gbpPlaceId: null,
    gbpNote: 'No public GBP listing found',
  },
  {
    name: 'Reviewflowz',
    website: 'reviewflowz.com',
    category: 'Review Platform',
    price: '$5–50/mo',
    features: [
      'Review monitoring across 60+ platforms',
      'Slack & email alerts for new reviews',
      'Multi-platform aggregation',
      'Lightweight, quick setup',
    ],
    weaknesses: [
      'Monitoring only — no review generation',
      'No NFC hardware',
      'No employee gamification',
      'Not built for field teams at all',
    ],
    calCardAdvantage:
      'Reviewflowz watches reviews passively. CalCard actively drives them via NFC taps and gamification. Different jobs entirely — but CalCard is the more valuable tool for a trades business.',
    gbpPlaceId: null,
    gbpNote: 'No GBP listing found',
  },
  {
    name: 'Grade.us',
    website: 'grade.us',
    category: 'Review Platform',
    price: '$110/mo (agency white-label)',
    features: [
      'White-label platform for marketing agencies',
      'Bulk multi-client campaign management',
      'Branded review request pages',
      'Agency reseller economics',
    ],
    weaknesses: [
      'Sold to agencies, not direct to trade businesses',
      'No NFC hardware',
      'No gamification or leaderboard',
      'Not a field tech tool',
    ],
    calCardAdvantage:
      'Agency-tier tool — not a direct competitor. Opportunity: marketing agencies who resell to trade clients could white-label CalCard instead of Grade.us to offer a differentiated, hardware-backed product.',
    gbpPlaceId: null,
    gbpNote: 'No GBP listing found',
  },

  // ─── Gamification (not review-specific) ───────────────────────────────────
  {
    name: 'Spinify',
    website: 'spinify.com',
    category: 'Gamification',
    price: '$25/mo base (per-user pricing stacks)',
    features: [
      'Sales leaderboards and badges',
      'TV display / broadcast competitions',
      'CRM integrations (Salesforce, HubSpot, Teams)',
      'Real-time progress bars',
      'AI coaching and performance nudges',
    ],
    weaknesses: [
      'Gamifies CRM activity (calls, deals) — not Google reviews',
      'No NFC hardware or tap-to-review',
      'No GBP rank tracking',
      'Per-user pricing gets expensive for a team of 8',
      'Not designed for field service workers',
    ],
    calCardAdvantage:
      'Spinify gamifies internal sales metrics. CalCard gamifies external proof-of-quality (Google reviews) — the metric that actually drives new customers for a trade business. Completely different value proposition.',
    gbpPlaceId: null,
    gbpNote: 'AU-based SaaS — no US GBP listing',
  },
]

const CATEGORY_META: Record<Category, { bg: string; text: string; border: string; icon: string }> = {
  'NFC + Platform': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: '&#9889;' },
  'NFC Cards':      { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   icon: '&#128243;' },
  'Review Platform':{ bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: '&#11088;' },
  'Gamification':   { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20',   icon: '&#127942;' },
}

function CategoryBadge({ category }: { category: Category }) {
  const m = CATEGORY_META[category]
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${m.bg} ${m.text} ${m.border}`}
      dangerouslySetInnerHTML={{ __html: `${m.icon} ${category}` }}
    />
  )
}

const FEATURE_MATRIX: [string, boolean, boolean, boolean, boolean, boolean][] = [
  // [label, CalCard, NFC+Platform, NFC-only, ReviewSaaS, Gamification]
  ['NFC tap-to-review card',          true,  true,  true,  false, false],
  ['Employee-level attribution',      true,  false, false, false, false],
  ['Public leaderboard',              true,  true,  false, false, true ],
  ['Badges & rewards system',         true,  false, false, false, true ],
  ['GBP rank tracking',               true,  false, false, false, false],
  ['Owner analytics dashboard',       true,  true,  false, true,  true ],
  ['Real-time review wall',           true,  false, false, false, false],
  ['Tipping (Venmo/CashApp)',         true,  false, false, false, false],
  ['No per-user pricing',             true,  true,  true,  true,  false],
  ['Built for field service trades',  true,  false, false, true,  false],
  ['Under $150/mo for small team',    true,  false, true,  true,  false],
]

const PRICING_LADDER = [
  { name: 'Hardware cards (TAPro, TAPiTAG, etc.)', price: '$20–50', freq: 'one-time', color: 'text-blue-400' },
  { name: 'NiceJob Reviews',                        price: '$75',    freq: '/mo',      color: 'text-yellow-400' },
  { name: 'CalCard (target range)',                 price: '$99–149',freq: '/mo',      color: 'text-green-400', isUs: true },
  { name: 'NiceJob Pro',                            price: '$125',   freq: '/mo',      color: 'text-yellow-400' },
  { name: 'GetMoreReviews',                         price: '$129',   freq: '/mo',      color: 'text-yellow-400' },
  { name: 'Birdeye Standard',                       price: '$299+',  freq: '/mo',      color: 'text-yellow-400' },
  { name: 'Podium Core (+ typical add-ons)',        price: '$500–800',freq: '/mo',     color: 'text-red-400' },
]

export default function CompetitivePage() {
  const nfcPlatform = COMPETITORS.filter(c => c.category === 'NFC + Platform')
  const nfcCards    = COMPETITORS.filter(c => c.category === 'NFC Cards')
  const reviewSaas  = COMPETITORS.filter(c => c.category === 'Review Platform')
  const gamify      = COMPETITORS.filter(c => c.category === 'Gamification')
  const gbpTargets  = COMPETITORS.filter(c => c.gbpPlaceId)

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">&#128202; Competitive Intelligence</h1>
        <p className="text-gray-400 text-sm mt-1">
          {COMPETITORS.length} competitors tracked &middot; Last updated June 16, 2026
        </p>
      </div>

      {/* Positioning summary */}
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-semibold text-base flex items-center gap-2">
          <span>&#127919;</span> Where CalCard Wins
        </h2>
        <p className="text-gray-300 text-sm leading-relaxed">
          CalCard is the <strong className="text-white">only US platform</strong> combining NFC tap-to-review cards
          with per-employee attribution, a full gamification layer (leaderboard, badges, rewards, tips), and
          Google Business Profile rank tracking &#8212; built exclusively for{' '}
          <em>field service trade teams</em>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <p className="text-blue-400 font-semibold text-xs mb-1">vs. Hardware-only cards</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              TAPro, TAPiTAG, ReviewsCard capture a review but record nothing. CalCard ties every tap
              to an employee, builds their profile, and feeds the leaderboard.
            </p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <p className="text-yellow-400 font-semibold text-xs mb-1">vs. Review SaaS (NiceJob, Podium)</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Competitors capture reviews <em>after</em> the job via SMS/email. CalCard captures them
              <em> in the moment</em> via NFC tap &#8212; higher conversion, stronger attribution.
            </p>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <p className="text-purple-400 font-semibold text-xs mb-1">vs. Gamification platforms</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Spinify gamifies CRM calls and deals. CalCard gamifies customer-facing Google reviews
              &#8212; the metric that directly drives new business for trade companies.
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs">
          <strong className="text-gray-400">Win condition:</strong> Target service trade shops with 2–20 technicians
          (plumbers, HVAC, septic, electrical) where employee accountability and motivation matter.
          USS is the proof of concept.
        </p>
      </div>

      {/* Category counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'NFC + Platform', count: nfcPlatform.length, color: 'text-purple-400' },
          { label: 'NFC Cards only', count: nfcCards.length,    color: 'text-blue-400' },
          { label: 'Review SaaS',    count: reviewSaas.length,  color: 'text-yellow-400' },
          { label: 'Gamification',   count: gamify.length,      color: 'text-pink-400' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{count}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Competitor cards — grouped by category */}
      {[
        { title: 'NFC + Platform (Closest Rivals)', list: nfcPlatform, labelColor: 'text-purple-400' },
        { title: 'NFC Card Companies (Hardware-only)', list: nfcCards, labelColor: 'text-blue-400' },
        { title: 'Review Generation SaaS', list: reviewSaas, labelColor: 'text-yellow-400' },
        { title: 'Gamification Platforms', list: gamify, labelColor: 'text-pink-400' },
      ].map(({ title, list, labelColor }) => (
        <div key={title} className="space-y-3">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${labelColor}`}>{title}</h2>
          {list.map(comp => (
            <div key={comp.name} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-white font-semibold">{comp.name}</h3>
                      <CategoryBadge category={comp.category} />
                    </div>
                    <a href={'https://' + comp.website} target="_blank" rel="noopener noreferrer"
                       className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                      {comp.website} &#8599;
                    </a>
                  </div>
                </div>
                <p className="text-white text-sm font-mono">{comp.price}</p>
              </div>

              {/* Three-column body */}
              <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                <div className="px-5 py-4 space-y-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Key Features</p>
                  <ul className="space-y-1">
                    {comp.features.map(f => (
                      <li key={f} className="text-gray-300 text-xs flex gap-2">
                        <span className="text-gray-600 shrink-0 mt-0.5">&#8226;</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Weaknesses</p>
                  <ul className="space-y-1">
                    {comp.weaknesses.map(w => (
                      <li key={w} className="text-gray-400 text-xs flex gap-2">
                        <span className="text-red-500/60 shrink-0 mt-0.5">&#8722;</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">CalCard Advantage</p>
                  <p className="text-green-300 text-xs leading-relaxed">{comp.calCardAdvantage}</p>
                  {comp.gbpNote && (
                    <p className="text-gray-600 text-xs pt-1 leading-relaxed">
                      &#128205; {comp.gbpNote}
                      {comp.gbpPlaceId && (
                        <span> &mdash; <code className="font-mono text-gray-400">{comp.gbpPlaceId}</code></span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Feature comparison matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">&#128203; Feature Comparison Matrix</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 font-medium text-xs">Feature</th>
                <th className="text-center px-3 py-3 text-green-400 font-medium text-xs whitespace-nowrap">CalCard</th>
                <th className="text-center px-3 py-3 text-purple-400 font-medium text-xs whitespace-nowrap">NFC+Platform</th>
                <th className="text-center px-3 py-3 text-blue-400 font-medium text-xs whitespace-nowrap">NFC Cards</th>
                <th className="text-center px-3 py-3 text-yellow-400 font-medium text-xs whitespace-nowrap">Review SaaS</th>
                <th className="text-center px-3 py-3 text-pink-400 font-medium text-xs whitespace-nowrap">Gamification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {FEATURE_MATRIX.map(([label, calcard, nfcPlat, nfcCard, rev, gamify]) => (
                <tr key={label} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-2.5 text-gray-300 text-xs">{label}</td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {calcard ? <span className="text-green-400 font-bold">&#10003;</span> : <span className="text-gray-700">&#8211;</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {nfcPlat ? <span className="text-gray-300">&#10003;</span> : <span className="text-gray-700">&#8211;</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {nfcCard ? <span className="text-gray-300">&#10003;</span> : <span className="text-gray-700">&#8211;</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {rev ? <span className="text-gray-300">&#10003;</span> : <span className="text-gray-700">&#8211;</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs">
                    {gamify ? <span className="text-gray-300">&#10003;</span> : <span className="text-gray-700">&#8211;</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 border-t border-gray-800 text-gray-600 text-xs">
          &#10003; = Yes &nbsp;&#8211; = No / N/A &nbsp;&middot;&nbsp;
          NFC+Platform column = best-in-class competitor per feature (e.g. Tap Review Cards for leaderboard, GetMoreReviews for NFC+platform)
        </p>
      </div>

      {/* Pricing ladder */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">&#128176; Pricing Ladder</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {PRICING_LADDER.map(({ name, price, freq, color, isUs }) => (
            <div key={name}
              className={'flex items-center justify-between px-5 py-3' + (isUs ? ' bg-green-500/5' : '')}>
              <div className="flex items-center gap-2">
                {isUs && <span className="text-green-500 text-xs">&#9654;</span>}
                <p className={`text-sm font-medium ${color}`}>{name}</p>
              </div>
              <p className="text-white text-sm font-mono">
                {price}<span className="text-gray-500 text-xs">{freq}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="p-4 bg-green-500/5 border-t border-green-500/20">
          <p className="text-green-400 text-xs leading-relaxed">
            &#128161; <strong>Pricing strategy:</strong> $99–149/mo undercuts NiceJob Pro ($125) and GetMoreReviews ($129)
            while offering NFC hardware + gamification + GBP tracking that neither provides. Strong value story for any
            trade business comparison-shopping at that price point.
          </p>
        </div>
      </div>

      {/* GBP Place IDs */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">&#128205; GBP Place IDs</h2>
          <p className="text-gray-400 text-xs mt-1">
            Confirmed Google Place IDs. Software company HQs listed for reference.
            For local service competitor tracking, add Place IDs per client in their company record.
          </p>
        </div>
        <div className="divide-y divide-gray-800">
          {gbpTargets.map(comp => (
            <div key={comp.name} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-white text-sm font-medium">{comp.name}</p>
                <p className="text-gray-500 text-xs">{comp.gbpNote}</p>
              </div>
              <code className="text-green-400 text-xs bg-gray-800 px-3 py-1 rounded font-mono">
                {comp.gbpPlaceId}
              </code>
            </div>
          ))}
          {COMPETITORS.filter(c => !c.gbpPlaceId).slice(0, 4).map(comp => (
            <div key={comp.name} className="flex items-center justify-between px-5 py-3 opacity-40">
              <div>
                <p className="text-white text-sm font-medium">{comp.name}</p>
                <p className="text-gray-500 text-xs">{comp.gbpNote}</p>
              </div>
              <span className="text-gray-600 text-xs italic">No GBP listing found</span>
            </div>
          ))}
        </div>
        <div className="p-5 bg-gray-900/50 border-t border-gray-800">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            &#128270; Finding local competitor Place IDs (per client)
          </p>
          <p className="text-gray-600 text-xs leading-relaxed">
            For GBP rank scan research, find a client&#39;s local competitors on Google Maps, copy
            the Place ID from the URL (or use the tool below), and add it to the company record in Supabase.
            Example: USS competitors would be other septic/sewer companies in their service area.
          </p>
          <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-blue-400 hover:text-blue-300 text-xs transition-colors">
            &#8599; Open Google Place ID Finder
          </a>
        </div>
      </div>

      {/* Research notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm">&#128221; Research Notes</h2>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <p className="text-gray-300 font-medium mb-1">Pricing methodology</p>
            <p className="leading-relaxed">
              Prices are public list prices as of June 2026 sourced from vendor websites, Capterra, G2, GetApp,
              and independent review blogs. Podium and Birdeye negotiate significantly off-list;
              actual contract prices may be lower. NFC card prices are per-card estimates.
            </p>
          </div>
          <div>
            <p className="text-gray-300 font-medium mb-1">Key gaps in this research</p>
            <ul className="space-y-1 leading-relaxed">
              <li>&#8226; GBP Place IDs for most competitors not found (online-only SaaS businesses)</li>
              <li>&#8226; Tap Review Cards (UK) &#8212; closest rival; worth monitoring for US expansion</li>
              <li>&#8226; GetMoreReviews NFC offering needs deeper feature audit</li>
              <li>&#8226; No research yet on trades-specific CRM tools (ServiceTitan, Jobber) adding review features</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
