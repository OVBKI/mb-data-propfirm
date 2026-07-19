// Admin-managed PropFirms CRUD (custom firms overlaid on the static catalog).
//   GET    /api/admin/propfirms        → list all custom firms (both markets)
//   POST   /api/admin/propfirms        → create (no id) or update (with id) a firm
//   DELETE /api/admin/propfirms?id=…    → delete a firm
// Admin-only (verifyAdmin) via the service role. Rules live in the `data` JSONB
// blob (shape is market-specific); core attributes are first-class columns.
// The public read for the in-app merge goes through the anon key + RLS select policy.

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function GET(req) {
  const auth = await verifyAdmin(req)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  const { data, error } = await svc()
    .from('custom_propfirms')
    .select('*')
    .order('market', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, firms: data || [] })
}

export async function POST(req) {
  const auth = await verifyAdmin(req)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const market = body?.market
  const name = (body?.name || '').trim()
  if (!['futures', 'cfd'].includes(market)) return Response.json({ error: 'market invalide (futures|cfd)' }, { status: 400 })
  if (!name) return Response.json({ error: 'name requis' }, { status: 400 })
  if (body?.data != null && typeof body.data !== 'object') return Response.json({ error: 'data doit être un objet JSON' }, { status: 400 })

  const row = {
    market,
    name,
    slug: (body.slug || '').trim() || null,
    logo_url: body.logo_url || null,
    website: (body.website || '').trim() || null,
    reputation: body.reputation || null,
    tagline: (body.tagline || '').trim() || null,
    data: body.data && typeof body.data === 'object' ? body.data : {},
    is_active: body.is_active !== false,
    sort_order: Number.isFinite(body.sort_order) ? body.sort_order : 100,
    updated_at: new Date().toISOString(),
  }

  const supabase = svc()
  const res = body.id
    ? await supabase.from('custom_propfirms').update(row).eq('id', body.id).select().single()
    : await supabase.from('custom_propfirms').insert(row).select().single()

  if (res.error) {
    if (res.error.code === '23505') return Response.json({ error: `Une firme "${name}" existe déjà sur ce marché.` }, { status: 409 })
    return Response.json({ error: res.error.message }, { status: 500 })
  }
  return Response.json({ ok: true, firm: res.data })
}

export async function DELETE(req) {
  const auth = await verifyAdmin(req)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'id requis' }, { status: 400 })
  const { error } = await svc().from('custom_propfirms').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
