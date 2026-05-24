import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = [
  'bakkali-omar@hotmail.com',
  'omar.mbtrading@gmail.com',
  'admin@quantara.tech',
]

export async function middleware(request) {
  const { pathname } = request.nextUrl

  const accessToken = request.cookies.get('sb-access-token')?.value
    || request.cookies.get(`sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`)?.value

  const isAppRoute = pathname.startsWith('/app')
  const isAdminRoute = pathname.startsWith('/admin')

  if (!isAppRoute && !isAdminRoute) return NextResponse.next()

  if (!accessToken) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/callback'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAdminRoute) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data: { user } } = await supabase.auth.getUser(accessToken)
      if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase().trim())) {
        return NextResponse.redirect(new URL('/app', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
