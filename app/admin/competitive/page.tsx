export default function CompetitivePage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white font-semibold text-xl">Competitive Intelligence</h2>
        <p className="text-gray-400 text-sm mt-1">
          Market research on NFC review card vendors, review generation SaaS, and trades-focused platforms.
          Last updated June 2026.
        </p>
      </div>

      {/* Market Positioning Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <h3 className="text-white font-semibold">&#127919; Market Positioning</h3>
        <div className="prose prose-invert text-sm text-gray-300 space-y-3 max-w-none">
          <p>
            CalCard occupies a unique intersection in the market that no single competitor fully owns:
            <strong className="text-white"> hardware NFC cards + per-employee gamification/leaderboards + trades-vertical focus</strong>,
            delivered as a single SaaS platform.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-green-400 font-semibold text-xs uppercase tracking-wide mb-2">vs. Hardware-only vendors</p>
              <p className="text-gray-300 text-sm">
                TAPro, Tap Review Cards — sell cards but no SaaS layer (or very thin one). No badges,
                no leaderboard tiers, no GBP rank tracking. CalCard wraps the hardware in a full
                engagement platform.
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-blue-400 font-semibold text-xs uppercase tracking-wide mb-2">vs. Review SaaS platforms</p>
              <p className="text-gray-300 text-sm">
                Podium ($399–599/mo), Birdeye ($299+/mo), NiceJob ($75–125/mo) — software with no NFC
                hardware, no per-technician gamification, no leaderboard. CalCard is more engaging
                and far cheaper for the owner-operator segment.
              </p>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <p className="text-purple-400 font-semibold text-xs uppercase tracking-wide mb-2">vs. Trades-adjacent tools</p>
              <p className="text-gray-300 text-sm">
                GetMoreReviews ($129–299/mo) has NFC cards but no employee-level gamification.
                NiceJob integrates with Jobber/HCP but is purely software. CalCard is the only
                platform where each technician owns their performance on a public leaderboard.
              </p>
            </div>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            <strong className="text-gray-300">Win condition:</strong> Target service trade businesses (plumbers, HVAC, septic, electricians)
            with 2–20 technicians where employee motivation and individual accountability matter. These are CalCard's
            strongest accounts — USS is the proof of concept.
          </p>
        </div>
      </div>

      {/* Competitors Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold">Competitor Matrix</h3>
          <p className="text-gray-400 text-xs mt-1">
            Category: <span className="text-yellow-400">NFC Cards</span> = hardware-first &middot;{' '}
            <span className="text-blue-400">Review Platform</span> = software-first &middot;{' '}
            <span className="text-purple-400">Both</span> = hardware + software
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Company</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Price / mo est.</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Key Features</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">CalCard Advantage</th>
                <th className="text-left px-4 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider whitespace-nowrap">GBP Place ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {COMPETITORS.map((c) => (
                <tr key={c.name} className="hover:bg-gray-800/40 transition-colors align-top">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <a
                      href={'https://' + c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium hover:text-green-400 transition-colors"
                    >
                      {c.name}
                    </a>
                    <p className="text-gray-500 text-xs mt-0.5">{c.website}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <CategoryBadge category={c.category} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-white font-mono text-xs">{c.price}</span>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <ul className="space-y-1">
                      {c.features.map((f, i) => (
                        <li key={i} className="text-gray-300 text-xs flex gap-1.5">
                          <span className="text-gray-600 mt-0.5">&#8226;</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <p className="text-green-300 text-xs leading-relaxed">{c.calCardAdvantage}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {c.gbpPlaceId ? (
                      <span className="font-mono text-xs text-blue-300">{c.gbpPlaceId}</span>
                    ) : (
                      <span className="text-gray-600 text-xs italic">not found</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GBP Scan Targets */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold">&#128205; GBP Scan Targets</h3>
          <p className="text-gray-400 text-xs mt-1">
            Google Place IDs confirmed for competitors. Use these to run GBP rank scans to track
            competitor visibility on &ldquo;review software&rdquo; and related keywords.
          </p>
        </div>
        <div className="p-5 space-y-3">
          {COMPETITORS.filter((c) => c.gbpPlaceId).map((c) => (
            <div key={c.name} className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-3">
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{c.name}</p>
                <p className="text-gray-400 text-xs">{c.website}</p>
              </div>
              <code className="text-blue-300 text-xs font-mono bg-gray-900 px-3 py-1.5 rounded">{c.gbpPlaceId}</code>
            </div>
          ))}
          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mt-2">
            <p className="text-yellow-400 text-xs font-medium mb-1">&#9888; Most competitors lack confirmed GBP listings</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              NFC card vendors and review SaaS companies primarily operate as online-only businesses without physical
              storefront GBP listings. To find place IDs manually, visit{' '}
              <a
                href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Google Place ID Finder
              </a>{' '}
              and search for each company by name + city (e.g. &ldquo;Podium Lehi Utah&rdquo;,
              &ldquo;Birdeye Southlake Texas&rdquo;, &ldquo;NiceJob Vancouver&rdquo;).
            </p>
          </div>
        </div>
      </div>

      {/* Research Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm">&#128221; Research Notes &amp; Sources</h3>
        <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-400">
          <div>
            <p className="text-gray-300 font-medium mb-1">Pricing methodology</p>
            <p>
              Prices are public list prices as of June 2026 from vendor websites, Capterra, G2, and GetApp.
              Podium and Birdeye are known to negotiate significantly; actual contract prices may differ.
              NFC card one-time prices are per-card estimates.
            </p>
          </div>
          <div>
            <p className="text-gray-300 font-medium mb-1">Key sources</p>
            <ul className="space-y-0.5">
              <li>tapreviewcards.co.uk — UK NFC + gamification competitor</li>
              <li>taprocard.com — hardware-only NFC cards</li>
              <li>getmorereviews.com/features/review-tap-cards — NFC + platform</li>
              <li>nicejob.com — trades-focused review automation</li>
              <li>podium.com / birdeye.com — enterprise review platforms</li>
              <li>reviewflowz.com — monitoring specialist</li>
              <li>grade.us — agency white-label</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  if (category === 'NFC Cards') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full whitespace-nowrap">
        &#128243; NFC Cards
      </span>
    )
  }
  if (category === 'Review Platform') {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full whitespace-nowrap">
        &#11088; Review Platform
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded-full whitespace-nowrap">
      &#9889; Both
    </span>
  )
}

const COMPETITORS = [
  {
    name: 'Tap Review Cards',
    website: 'tapreviewcards.co.uk',
    category: 'Both',
    price: '~£17/card + sub',
    features: [
      'Per-employee NFC cards with unique ID tracking',
      'Staff leaderboard (closest CalCard rival)',
      'AI auto-responses to reviews',
      'Smart feedback loop (catch bad reviews privately)',
      'Dashboard with tap & review analytics',
    ],
    calCardAdvantage:
      'UK-only company; no US presence. No badge/reward system. No GBP rank tracking. CalCard has deeper gamification (badges, tiers, tips) and US trade business focus.',
    gbpPlaceId: null,
  },
  {
    name: 'TAPro',
    website: 'taprocard.com',
    category: 'NFC Cards',
    price: '$15–30/card one-time',
    features: [
      'One-time purchase, zero monthly fees',
      'No app required (iPhone 7+ native NFC)',
      '12,900+ businesses in 12 countries',
      'Cards for Google, Trustpilot, Facebook',
      'No employee tracking or dashboard',
    ],
    calCardAdvantage:
      'Pure hardware — no SaaS, no leaderboard, no employee accountability. Businesses get cards but no engagement layer. CalCard\'s monthly SaaS creates recurring value TAPro can\'t match.',
    gbpPlaceId: null,
  },
  {
    name: 'GetMoreReviews',
    website: 'getmorereviews.com',
    category: 'Both',
    price: '$129–299/mo',
    features: [
      'NFC tap cards bundled with platform',
      'SMS & email review campaigns',
      'Bad review blocker / negative feedback filter',
      'Automated social media sharing',
      'Review monitoring across platforms',
    ],
    calCardAdvantage:
      'No per-employee gamification or leaderboard. Expensive for small trade teams. CalCard is cheaper and more motivating for field techs. No GBP rank tracking.',
    gbpPlaceId: null,
  },
  {
    name: 'NiceJob',
    website: 'nicejob.com',
    category: 'Review Platform',
    price: '$75–125/mo',
    features: [
      'Built for home service trades (plumbers, HVAC, landscapers)',
      'Automated SMS/email after job completion',
      'Jobber, Housecall Pro, FieldPulse integrations',
      'Referral campaign tools',
      'Social proof website widgets',
    ],
    calCardAdvantage:
      'No NFC cards — relies on SMS/email drip which customers ignore. No employee leaderboard. CalCard\'s in-person NFC tap is higher-conversion than post-job texts.',
    gbpPlaceId: null,
  },
  {
    name: 'Podium',
    website: 'podium.com',
    category: 'Review Platform',
    price: '$399–599/mo',
    features: [
      'Full messaging suite (webchat, SMS, payments)',
      'Multi-location review management',
      'Google & Facebook review requests via SMS',
      'Annual contracts required',
      'AI chatbot & lead response',
    ],
    calCardAdvantage:
      'Costs 5–8x more. No NFC cards. No per-technician gamification. Overkill for 2–20 tech trades shops. CalCard is the cost-effective alternative for field service SMBs.',
    gbpPlaceId: null,
  },
  {
    name: 'Birdeye',
    website: 'birdeye.com',
    category: 'Review Platform',
    price: '$299+/mo',
    features: [
      'AI-powered review responses',
      '200+ review site monitoring',
      'Multi-location management',
      'Social media management',
      'Competitor benchmarking reports',
    ],
    calCardAdvantage:
      'Enterprise-focused, complex onboarding. No NFC hardware. No employee gamification. Pricing and complexity is mis-matched for service trade SMBs.',
    gbpPlaceId: null,
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
      'Lightweight SaaS, quick setup',
      'No review generation features',
    ],
    calCardAdvantage:
      'Monitoring-only — no generation, no NFC, no gamification. CalCard actively drives reviews; Reviewflowz just watches. Different jobs, but CalCard is the more valuable tool.',
    gbpPlaceId: null,
  },
  {
    name: 'Grade.us',
    website: 'grade.us',
    category: 'Review Platform',
    price: '$110/mo (agency)',
    features: [
      'White-label for marketing agencies',
      'Bulk multi-client campaign management',
      'Branded review request pages',
      'Agency reseller economics',
      'No NFC hardware',
    ],
    calCardAdvantage:
      'Agency-tier tool — not sold direct to trade businesses. No NFC, no gamification, no leaderboard. CalCard can potentially partner with agencies who resell to their trade clients.',
    gbpPlaceId: null,
  },
]
