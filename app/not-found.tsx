import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔍</span>
        </div>
        <h1 className="text-white font-bold text-2xl mb-2">Page Not Found</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium rounded-lg text-sm transition-colors"
          >
            Sign In
          </Link>
        </div>
        <p className="text-gray-700 text-xs mt-8">CalCard · CAL OS</p>
      </div>
    </div>
  )
}
