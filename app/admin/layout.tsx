import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

const adminSections = [
  {
    items: [
      { href: '/admin', label: 'Overview', icon: '&#128202;', exact: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/companies', label: 'Companies', icon: '&#127970;' },
      { href: '/admin/reviews', label: 'Reviews', icon: '&#11088;' },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { href: '/admin/competitive', label: 'Competitive Intel', icon: '&#127919;' },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/chat', label: 'CAL Chat', icon: '&#128172;' },
    ],
  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/login')

  return (
    <div className="flex h-screen bg-gray-950">
      <Sidebar sections={adminSections} title="CAL Admin" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Super Admin" subtitle="CAL OS Platform" />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
