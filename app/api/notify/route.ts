import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notify'

export async function POST(request: NextRequest) {
  try {
    const { company_id, type, title, body, link } = await request.json()
    if (!company_id || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields: company_id, type, title' }, { status: 400 })
    }
    await createNotification(company_id, type, title, body, link)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
