import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ApplicationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const admin = await createAdminClient()
  const { data: applications } = await admin
    .from('company_applications')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Applications</h1>
            <p className="text-gray-400 text-sm mt-1">{(applications || []).length} total applications</p>
          </div>
          <a href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">&larr; Back to Admin</a>
        </div>

        {(applications || []).length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500">No applications yet. Share <span className="text-green-400">calcardai.netlify.app/join</span> to start getting leads.</p>
          </div>
        )}

        <div className="space-y-3">
          {(applications || []).map((app: any) => (
            <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{app.company_name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{app.contact_name} &middot; <a href={"mailto:" + app.email} className="text-green-400 hover:underline">{app.email}</a></p>
                  {app.phone && <p className="text-gray-500 text-sm">{app.phone}</p>}
                  {app.employee_count && <p className="text-gray-500 text-sm">{app.employee_count} employees</p>}
                  {app.message && <p className="text-gray-400 text-sm mt-2 italic">&ldquo;{app.message}&rdquo;</p>}
                </div>
                <div className="text-right">
                  <span className={"inline-block px-2 py-0.5 rounded text-xs font-medium " + (app.status === 'pending' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-green-900/40 text-green-400')}>
                    {app.status}
                  </span>
                  <p className="text-gray-600 text-xs mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
