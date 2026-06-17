import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ImageUploader from '@/components/dashboard/ImageUploader'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function EmployeesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) redirect('/login')

  const admin = await createAdminClient()
  const isOwner = profile?.role === 'owner' || profile?.role === 'company_admin' || profile?.role === 'super_admin'

  const { data: employees } = await admin
    .from('profiles')
    .select('id, first_name, last_name, avatar_url, created_at, cards(id, slug, status)')
    .eq('company_id', companyId)
    .eq('role', 'employee')
    .order('first_name')

  const { data: reviewCounts } = await admin
    .from('reviews')
    .select('employee_id')
    .eq('company_id', companyId)

  const countMap: Record<string, number> = {}
  reviewCounts?.forEach((r) => {
    if (r.employee_id) countMap[r.employee_id] = (countMap[r.employee_id] || 0) + 1
  })

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Employees</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {isOwner ? 'Click an avatar to upload a photo' : 'Your team members and their NFC cards'}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Card</th>
                <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Reviews</th>
                <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {employees && employees.length > 0 ? employees.map((emp) => {
                const card = (emp.cards as { id: string; slug: string; status: string }[] | null)?.[0]
                const initials = emp.first_name?.[0]?.toUpperCase() || '?'
                return (
                  <tr key={emp.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {isOwner ? (
                          <ImageUploader
                            currentUrl={emp.avatar_url}
                            type="avatar"
                            id={emp.id}
                            shape="circle"
                            size="sm"
                            fallbackLabel={initials}
                          />
                        ) : emp.avatar_url ? (
                          <img src={emp.avatar_url} alt={emp.first_name} className="w-8 h-8 rounded-full object-cover border border-gray-700" />
                        ) : (
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <span className="text-green-400 text-xs font-bold">{initials}</span>
                          </div>
                        )}
                        <p className="text-white text-sm font-medium">{emp.first_name} {emp.last_name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {card ? (
                        <div>
                          <span className={'text-xs px-2 py-1 rounded-full ' + (card.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-400')}>
                            {card.status}
                          </span>
                          {card.slug && (
                            <p className="text-gray-500 text-xs mt-1 font-mono">/u/{card.slug}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs">No card</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-green-400 font-bold">{countMap[emp.id] || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {new Date(emp