// Proxy Next.js → Python rithmic-sync service for sync operations.

import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

const RITHMIC_SYNC_URL = process.env.RITHMIC_SYNC_URL

function configError() {
  return Response.json(
    { error: 'RITHMIC_SYNC_URL not configured. Set the env var to your Railway service URL.' },
    { status: 503 },
  )
}

export async function POST(request) {
  if (!RITHMIC_SYNC_URL) return configError()
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // Rate limit : 3 syncs every 5 min — sync is heavy, allows a few retries during testing
  const limit = rateLimit({ key: `rithmic-sync:${auth.user.id}`, windowMs: 5 * 60_000, max: 3 })
  if (!limit.allowed) return rateLimitResponse(limit, 'Trop de syncs lancés récemment. Attends 5 minutes.')

  let body
  try { body = await request.json() } catch { body = {} }
  const days = Math.max(1, Math.min(365, parseInt(body.days, 10) || 90))

  const token = request.headers.get('authorization')?.split(' ', 2)[1]
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}/sync/historical`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ days, account_id: body.account_id || null }),
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: `rithmic-sync unreachable: ${e.message}` }, { status: 502 })
  }
}

export async function GET(request) {
  if (!RITHMIC_SYNC_URL) return configError()
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('job_id')
  const path = jobId ? `/sync/jobs/${encodeURIComponent(jobId)}` : '/sync/jobs'

  const token = request.headers.get('authorization')?.split(' ', 2)[1]
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: `rithmic-sync unreachable: ${e.message}` }, { status: 502 })
  }
}
