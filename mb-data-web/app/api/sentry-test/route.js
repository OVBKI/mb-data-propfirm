// Sentry test route — throws an error on demand to verify capture.
//   curl -H "Authorization: Bearer $CRON_SECRET" https://quantara.tech/api/sentry-test
// Auth is read from the Authorization header (NOT a ?secret= query param, which
// leaks the secret into server/edge logs, browser history and Referer headers).

export async function GET(request) {
  const authHeader = request.headers.get('authorization') || ''
  const expected = process.env.CRON_SECRET

  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Force an error to test Sentry capture
  throw new Error('Sentry test error — if you see this in Sentry, integration works ✓')
}
