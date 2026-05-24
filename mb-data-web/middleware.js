import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith('/admin')) return NextResponse.next()

  // L'auth admin est vérifiée côté client dans app/admin/layout.js
  // et côté serveur dans les routes /api/admin/* via verifyAdmin().
  // Le middleware empêche le pre-rendering des pages admin par les crawlers.
  const referer = request.headers.get('referer') || ''
  const hasOrigin = referer.includes(request.nextUrl.origin)

  if (!hasOrigin && !request.headers.get('authorization')) {
    return NextResponse.redirect(new URL('/app', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
