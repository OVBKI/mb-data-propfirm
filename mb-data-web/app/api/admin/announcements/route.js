// API admin pour gérer les annonces / bannières globales.
// Nécessite SUPABASE_SERVICE_ROLE_KEY en env var Vercel (côté server uniquement).
//
// Endpoints :
//   GET    /api/admin/announcements          → liste toutes les annonces (y compris inactives)
//   POST   /api/admin/announcements          → crée une nouvelle annonce
//   PUT    /api/admin/announcements           → met à jour une annonce existante (id dans le body)
//   DELETE /api/admin/announcements?id=xxx    → supprime une annonce
//
// SÉCURITÉ : vérifie que la requête vient d'un admin via Bearer token Supabase
// + match avec ADMIN_EMAILS (centralisée dans lib/admins.js).
// Utilise service_role key pour bypass RLS (l'admin doit voir les annonces inactives).

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'

export const dynamic = 'force-dynamic'

// Crée un client Supabase avec la service_role key (admin, bypass RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function missingServiceKeyResponse() {
  return Response.json({
    error: 'SUPABASE_SERVICE_ROLE_KEY non configurée sur Vercel',
    hint: 'Va dans Vercel → Settings → Environment Variables → Add → SUPABASE_SERVICE_ROLE_KEY',
  }, { status: 500 })
}

// === GET — liste toutes les annonces ===
export async function GET(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })

  const admin = getAdminClient()
  if (!admin) return missingServiceKeyResponse()

  const { data, error } = await admin
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data: data || [] })
}

// === POST — crée une nouvelle annonce ===
export async function POST(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })

  const admin = getAdminClient()
  if (!admin) return missingServiceKeyResponse()

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.title?.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 })
  }

  const payload = {
    title: body.title.trim(),
    message: (body.message || '').trim(),
    type: body.type || 'info',
    active: body.active !== undefined ? body.active : true,
    starts_at: body.starts_at || new Date().toISOString(),
    ends_at: body.ends_at || null,
    link_url: body.link_url?.trim() || null,
    link_label: body.link_label?.trim() || null,
    // Pas de `created_by` : la colonne n'existe pas dans la table announcements
    // (voir supabase-schema.sql) — l'envoyer fait échouer l'insert (PGRST204).
  }

  const { data, error } = await admin.from('announcements').insert(payload).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data }, { status: 201 })
}

// === PUT — met à jour une annonce existante ===
export async function PUT(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })

  const admin = getAdminClient()
  if (!admin) return missingServiceKeyResponse()

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.id) {
    return Response.json({ error: 'id is required' }, { status: 400 })
  }

  const payload = {}
  if (body.title !== undefined) payload.title = body.title.trim()
  if (body.message !== undefined) payload.message = body.message.trim()
  if (body.type !== undefined) payload.type = body.type
  if (body.active !== undefined) payload.active = body.active
  if (body.starts_at !== undefined) payload.starts_at = body.starts_at
  if (body.ends_at !== undefined) payload.ends_at = body.ends_at
  if (body.link_url !== undefined) payload.link_url = body.link_url?.trim() || null
  if (body.link_label !== undefined) payload.link_label = body.link_label?.trim() || null

  const { data, error } = await admin
    .from('announcements')
    .update(payload)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ data })
}

// === DELETE — supprime une annonce ===
export async function DELETE(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status || 401 })

  const admin = getAdminClient()
  if (!admin) return missingServiceKeyResponse()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return Response.json({ error: 'id query param is required' }, { status: 400 })
  }

  const { error } = await admin.from('announcements').delete().eq('id', id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
