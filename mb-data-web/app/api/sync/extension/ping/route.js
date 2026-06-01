// GET /api/sync/extension/ping — auth check for the Quantara Sync extension popup.

import { verifyAuth } from '../../../../../lib/apiAuth'

export async function GET(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  return Response.json({ ok: true, email: auth.user.email, userId: auth.user.id })
}
