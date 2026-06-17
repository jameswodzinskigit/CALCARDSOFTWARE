import { cookies } from 'next/headers'

/**
 * Returns the active company ID for the current request.
 * For super_admin: uses the sa_company_id cookie override if set.
 * For all others: returns their own company_id from profile.
 */
export async function getActiveCompanyId(
  ownCompanyId: string | null | undefined,
  role: string | null | undefined
): Promise<string | null> {
  if (role !== 'super_admin') return ownCompanyId || null
  const cookieStore = await cookies()
  const override = cookieStore.get('sa_company_id')?.value
  return override || ownCompanyId || null
}

/**
 * Returns the cookie override value only (null if not set or not super_admin).
 * Useful for knowing if super admin is "viewing as" another company.
 */
export async function getCompanyOverride(
  role: string | null | undefined
): Promise<string | null> {
  if (role !== 'super_admin') return null
  const cookieStore = await cookies()
  return cookieStore.get('sa_company_id')?.value || null
}
