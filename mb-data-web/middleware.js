import { NextResponse } from 'next/server'

// Admin path guard.
//
// History: an earlier version of this middleware allowed /admin/* through
// whenever a Referer header pointed at our own origin OR any Authorization
// header was present. Both checks are trivially forged by any HTTP client,
// so the gate was security theater. (Audit P0-3, June 2026.)
//
// What's actually enforced today:
//   * Admin PAGES are guarded client-side by app/admin/layout.js, which
//     validates the user's Supabase session and the admin email list before
//     rendering anything sensitive. RSC payloads from /admin pages contain
//     no user data on first paint.
//   * Admin APIs (/api/admin/*) require a valid Bearer token and run
//     `verifyAdmin()` server-side. Those are the real security boundary.
//
// What this middleware does:
//   * Tags every /admin/* response with `X-Robots-Tag: noindex, nofollow`
//     so crawlers don't index the admin surface.
//   * Sets `Cache-Control: private, no-store` so any intermediate caches
//     (Vercel edge, CDNs) never reuse an admin response for a different
//     viewer.
//   * Strips well-known unauthenticated bot user-agents up front to avoid
//     wasting compute on them. Real auth is still done by the page/API.

const BOT_UA_RE = /(googlebot|bingbot|yandex|baiduspider|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|archive\.org_bot|petalbot)/i

export function middleware(request) {
  const ua = request.headers.get('user-agent') || ''
  if (BOT_UA_RE.test(ua)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const res = NextResponse.next()
  res.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive')
  res.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
