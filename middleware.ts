import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/u/') ||
    pathname.startsWith('/wall/') ||
    pathname.startsWith('/activate') ||
    pathname.startsWith('/tip/') ||
    pathname.startsWith('/join') ||
    pathname === '/leaderboard' ||
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
