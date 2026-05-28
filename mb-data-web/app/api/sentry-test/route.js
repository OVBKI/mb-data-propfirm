// Sentry test route — throws an error on demand to verify capture.
// GET /api/sentry-test?secret=YOUR_SECRET
// Returns 401 unless ?secret matches CRON_SECRET (so it's not publicly abusable).

export async function GET(request) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Force an error to test Sentry capture
  throw new Error('Sentry test error — if you see this in Sentry, integration works ✓')
}
