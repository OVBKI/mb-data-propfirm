// API admin — dépenses générales de l'activité formation (publicité, outils…).
// La lecture passe par GET /api/admin/formations, qui renvoie ventes et dépenses
// d'un coup ; cette route ne fait qu'écrire.
//
//   POST   /api/admin/formations/expenses          → crée une dépense ({ repeat: n } = une ligne par mois pendant n mois)
//   PUT    /api/admin/formations/expenses          → modifie une dépense (id dans le body)
//   DELETE /api/admin/formations/expenses?id=xxx   → supprime une dépense
//
// SÉCURITÉ : verifyAdmin puis service role, comme /api/admin/formations. La table
// a la RLS activée sans policy.

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../../lib/apiAuth'
import { expenseError, expandRepeat, toCents, fromCents } from '../../../../../lib/formationSales'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const json = (body, status = 200) => Response.json(body, { status })

async function guard(request) {
  const auth = await verifyAdmin(request)
  if (auth.error) return { res: json({ error: auth.error }, auth.status || 401) }
  const admin = getAdminClient()
  if (!admin) return { res: json({ error: 'SUPABASE_SERVICE_ROLE_KEY non configurée sur Vercel' }, 500) }
  return { admin }
}

function dbError(error) {
  const missing = error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '')
  return json({
    error: missing
      ? 'La table formation_expenses n\'existe pas encore : colle le bloc SQL des dépenses dans l\'éditeur SQL de Supabase.'
      : error?.message || 'Erreur base de données',
  }, 500)
}

function normalize(body) {
  return {
    expense_date: body.expense_date,
    category: String(body.category || ''),
    label: String(body.label || '').trim().slice(0, 120),
    amount: fromCents(toCents(body.amount)),
    note: String(body.note || '').trim().slice(0, 1000) || null,
  }
}

async function readBody(request) {
  try { return await request.json() } catch { return null }
}

export async function POST(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  const body = await readBody(request)
  if (!body) return json({ error: 'Corps JSON invalide' }, 400)
  const row = normalize(body)
  const repeat = body.repeat ?? 1
  const err = expenseError({ ...row, repeat })
  if (err) return json({ error: err }, 400)
  // Un seul INSERT multi-lignes : les mois répétés sont créés ensemble ou pas du tout.
  const { data, error } = await admin.from('formation_expenses').insert(expandRepeat(row, repeat)).select('id')
  if (error) return dbError(error)
  return json({ created: data?.length || 0 })
}

export async function PUT(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  const body = await readBody(request)
  if (!body) return json({ error: 'Corps JSON invalide' }, 400)
  if (!body.id) return json({ error: 'id manquant' }, 400)
  const row = normalize(body)
  const err = expenseError(row)
  if (err) return json({ error: err }, 400)
  const { data, error } = await admin.from('formation_expenses')
    .update({ ...row, updated_at: new Date().toISOString() }).eq('id', body.id).select('id')
  if (error) return dbError(error)
  if (!data?.length) return json({ error: 'Dépense introuvable' }, 404)
  return json({ ok: true })
}

export async function DELETE(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'id manquant' }, 400)
  const { error } = await admin.from('formation_expenses').delete().eq('id', id)
  if (error) return dbError(error)
  return json({ ok: true })
}
