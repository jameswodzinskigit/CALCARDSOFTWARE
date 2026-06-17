import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'

export async function createNotification(
  companyId: string,
  type: string,
  title: string,
  body?: string,
  link?: string
) {
  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await admin.from('notifications').insert({
    company_id: companyId,
    type,
    title,
    body: body || null,
    link: link || null,
  })
}

// TODO: wire from review ingestion webhook
// createNotification(companyId, 'report', 'Monthly report ready', 'Your June performance report is available.', '/dashboard/reports')

// TODO: wire from review ingestion webhook
// createNotification(companyId, 'warning', '1-star review received', 'A new 1-star review was posted. Respond quickly to protect your rating.', '/dashboard/reviews')
