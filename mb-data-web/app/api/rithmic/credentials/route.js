// Proxy Next.js → Python rithmic-sync service for credential management.
// Supports multi-credentials (since service v0.2). Each row is identified by `label`.

import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

const RITHMIC_SYNC_URL = process.env.RITHMIC_SYNC_URL

function configError() {
  return Response.json(
    { error: 'RITHMIC_SYNC_URL not configured. Set the env var to your Railway service URL.' },
    { status: 503 },
  )
}

async function getAccessToken(request) {
  const auth = request.headers.get('authorization')
  if (!auth || !auth.toLowerCase().startsWith('bearer ')) return null
  return auth.split(' ', 2)[1]
}

// GET /api/rithmic/credentials — returns list of all credentials sets for user
export async function GET(request) {
  if (!RITHMIC_SYNC_URL) return configError()
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const token = await getAccessToken(request)
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}/credentials`, {
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

// POST /api/rithmic/credentials — add or update by label
export async function POST(request) {
  if (!RITHMIC_SYNC_URL) return configError()
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // 5 writes per hour per user — credentials don't change often
  const limit = rateLimit({ key: `rithmic-creds:${auth.user.id}`, windowMs: 3600_000, max: 10 })
  if (!limit.allowed) return rateLimitResponse(limit)

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'invalid JSON' }, { status: 400 }) }
  if (!body?.label || !body?.username || !body?.password || !body?.system_name) {
    return Response.json({ error: 'label, username, password, system_name required' }, { status: 400 })
  }

  const token = await getAccessToken(request)
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}/credentials`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: `rithmic-sync unreachable: ${e.message}` }, { status: 502 })
  }
}

// DELETE /api/rithmic/credentials?label=foo
export async function DELETE(request) {
  if (!RITHMIC_SYNC_URL) return configError()
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const label = searchParams.get('label')
  if (!label) return Response.json({ error: 'label query param required' }, { status: 400 })

  const token = await getAccessToken(request)
  try {
    const res = await fetch(`${RITHMIC_SYNC_URL}/credentials/${encodeURIComponent(label)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json().catch(() => ({}))
    return Response.json(data, { status: res.status })
  } catch (e) {
    return Response.json({ error: `rithmic-sync unreachable: ${e.message}` }, { status: 502 })
  }
}
