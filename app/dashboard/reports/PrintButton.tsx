'use client'

export default function PrintButton() {
  return (
    <>
      <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors no-print flex items-center gap-2 h-10"
      >
        <span>🖨️</span> Print / Save PDF
      </button>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, header, aside { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { padding: 24px !important; }
          .bg-gray-900, .bg-gray-800\\/50, .bg-gray-800\\/40, .bg-gray-800\\/30 { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
          .text-white { color: #111 !important; }
          .text-gray-400, .text-gray-500, .text-gray-600 { color: #6b7280 !important; }
          .text-green-400 { color: #16a34a !important; }
          .text-blue-400 { color: #2563eb !important; }
          .text-yellow-400 { color: #d97706 !important; }
          .border-gray-800 { border-color: #e5e7eb !important; }
          .rounded-xl { border-radius: 8px !important; }
        }
      `}</style>
    </>
  )
}
