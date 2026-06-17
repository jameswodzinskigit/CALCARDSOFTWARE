import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { cardId, firstName, lastName, companyId, message } = await request.json()

    if (!cardId || !firstName || !companyId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if card exists
    const { data: card } = await supabase
      .from('cards')
      .select('id, status, employee_id')
      .eq('id', cardId)
      .single()

    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    if (card.status === 'active' && card.employee_id) {
      return NextResponse.json({ error: 'Card already activated' }, { status: 409 })
    }

    // Get company to build slug
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single()

    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    // Create or find profile
    const slug = `${firstName.toLowerCase()}-${lastName?.toLowerCase() || ''}-${Date.now()}`.replace(/[^a-z0-9-]/g, '-')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        first_name: firstName,
        last_name: lastName || '',
        company_id: companyId,
        role: 'employee',
      })
      .select()
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Activate card
    const { error: cardError } = await supabase
      .from('cards')
      .update({
        employee_id: profile.id,
        company_id: companyId,
        status: 'active',
        slug,
        personal_message: message || null,
      })
      .eq('id', cardId)

    if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 })

    return NextResponse.json({ success: true, slug })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
