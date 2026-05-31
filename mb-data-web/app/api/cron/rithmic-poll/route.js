// Vercel cron → Python rithmic-sync service.
// Schedule defined in vercel.json. Vercel sends `Authorization: Bearer <CRON_SECRET>`.
// We forward to the Python service with a separate shared secret (RITHMIC_CRON_SECRET).

const RITHMIC_SYNC_URL = process.env.RITHMIC_SYNC_URL
const CRON_SECRET = process.env.CRON_SECRET
const RITHMIC_CRON_SECRET = process.env.RITHMIC_CRON_SECRET

export async function GET(request) {
  // 1. Verify Vercel cron auth (same CRON_SECRET used for other crons)
  if (!CRON_SECRET) {
    return Response.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check we have the downstream URL + secret
  if (!RITHMIC_SYNC_URL) {
    return Response.json({ error: 'RITHMIC_SYNC_URL not configured' }, { status: 503 })
  }
  if (!RITHMIC_CRON_SECRET) {
    return Response.json({ error: 'RITHMIC_CRON_SECRET not configured' }, { status: 503 })
  }

  // 3. Forward to Python service /cron/poll-all
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}/cron/poll-all`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': RITHMIC_CRON_SECRET },
      // Cron can take a while if there are many opt-in users, give it room.
      // Note: Vercel cron has its own timeout (60s on Hobby, 300s on Pro).
      signal: AbortSignal.timeout(50_000),
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: `rithmic-sync unreachable: ${e.message}` }, { status: 502 })
  }
}
