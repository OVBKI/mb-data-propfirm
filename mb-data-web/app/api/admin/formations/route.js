// API admin — ventes de formation et leurs échéanciers (/admin/formations).
//
// Endpoints :
//   GET    /api/admin/formations          → { sales: [...], installments: [...] }
//   POST   /api/admin/formations          → crée une vente ET son échéancier
//   PUT    /api/admin/formations          → met à jour une vente (id dans le body) et remplace son échéancier
//   PATCH  /api/admin/formations          → { installment_id, paid_at } : marque une échéance payée (ou non)
//   DELETE /api/admin/formations?id=xxx   → supprime une vente (l'échéancier part en cascade)
//
// SÉCURITÉ : verifyAdmin (Bearer + lib/admins.js), puis service role. Les deux
// tables ont la RLS activée SANS policy : rien n'y est lisible avec la clé anon.
// La validation est celle de lib/formationSales.js, la même que la page applique
// avant d'envoyer : le serveur ne fait pas confiance au navigateur.

import { createClient } from '@supabase/supabase-js'
import { verifyAdmin } from '../../../../lib/apiAuth'
import { fetchAll } from '../../../../lib/fetchAll'
import { saleError, isISODate, toCents, fromCents } from '../../../../lib/formationSales'

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

// Une table absente (SQL pas encore joué sur Supabase) donne un message utile
// plutôt qu'un code PostgREST incompréhensible.
function dbError(error) {
  const missing = error?.code === '42P01' || error?.code === 'PGRST205' || /does not exist|schema cache/i.test(error?.message || '')
  return json({
    error: missing
      ? 'Les tables formation_sales et formation_installments n\'existent pas encore : recolle supabase-schema.sql dans l\'éditeur SQL de Supabase.'
      : error?.message || 'Erreur base de données',
  }, 500)
}

// Nettoie le corps envoyé par la page : seules les colonnes connues passent.
function normalize(body) {
  const fees = (Array.isArray(body.fees) ? body.fees : [])
    .map((f) => ({ label: String(f?.label || '').trim().slice(0, 80), amount: fromCents(toCents(f?.amount)) }))
    .filter((f) => f.label || f.amount)
  const installments = (Array.isArray(body.installments) ? body.installments : []).map((i) => ({
    id: typeof i?.id === 'string' ? i.id : null,
    due_date: i?.due_date,
    amount: fromCents(toCents(i?.amount)),
    paid_at: i?.paid_at || null,
  }))
  return {
    sale: {
      client_name: String(body.client_name || '').trim().slice(0, 120),
      client_email: String(body.client_email || '').trim().slice(0, 160) || null,
      formation: String(body.formation || '').trim().slice(0, 120) || null,
      sale_date: body.sale_date,
      price: fromCents(toCents(body.price)),
      payment_mode: body.payment_mode === 'installments' ? 'installments' : 'once',
      fees,
      note: String(body.note || '').trim().slice(0, 2000) || null,
    },
    installments,
  }
}

function validate({ sale, installments }) {
  const err = saleError({ ...sale, installments })
  if (err) return err
  if (sale.payment_mode === 'once' && installments.length !== 1) {
    return 'Un paiement en une fois n\'a qu\'une échéance. Choisis « en plusieurs fois » pour en avoir davantage.'
  }
  return null
}

export async function GET(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  const sales = await fetchAll(() => admin.from('formation_sales').select('*').order('sale_date', { ascending: false }).order('id'))
  if (sales.error) return dbError(sales.error)
  const inst = await fetchAll(() => admin.from('formation_installments').select('id, sale_id, due_date, amount, paid_at').order('due_date').order('id'))
  if (inst.error) return dbError(inst.error)
  return json({ sales: sales.data, installments: inst.data })
}

export async function POST(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  let body
  try { body = await request.json() } catch { return json({ error: 'Corps JSON invalide' }, 400) }
  const n = normalize(body)
  const err = validate(n)
  if (err) return json({ error: err }, 400)

  const { data: sale, error } = await admin.from('formation_sales').insert(n.sale).select().single()
  if (error) return dbError(error)
  const rows = n.installments.map(({ due_date, amount, paid_at }) => ({ sale_id: sale.id, due_date, amount, paid_at }))
  const { error: instErr } = await admin.from('formation_installments').insert(rows)
  if (instErr) {
    // Pas de vente sans échéancier : elle afficherait « payée » alors que rien ne l'est.
    await admin.from('formation_sales').delete().eq('id', sale.id)
    return dbError(instErr)
  }
  return json({ data: sale })
}

export async function PUT(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  let body
  try { body = await request.json() } catch { return json({ error: 'Corps JSON invalide' }, 400) }
  if (!body.id) return json({ error: 'id manquant' }, 400)
  const n = normalize(body)
  const err = validate(n)
  if (err) return json({ error: err }, 400)

  const { data: updated, error } = await admin.from('formation_sales')
    .update({ ...n.sale, updated_at: new Date().toISOString() }).eq('id', body.id).select('id')
  if (error) return dbError(error)
  if (!updated?.length) return json({ error: 'Vente introuvable' }, 404)

  // Remplacement de l'échéancier sans fenêtre où il serait vide : on écrit
  // d'abord (mise à jour des lignes gardées, insertion des nouvelles), on retire
  // ensuite celles qui ont disparu. Un id qui n'appartient pas à CETTE vente est
  // traité comme une nouvelle ligne, jamais déplacé depuis une autre vente.
  const { data: existing, error: exErr } = await admin.from('formation_installments').select('id').eq('sale_id', body.id)
  if (exErr) return dbError(exErr)
  const ownIds = new Set((existing || []).map((r) => r.id))
  const kept = n.installments.filter((i) => i.id && ownIds.has(i.id))
  const added = n.installments.filter((i) => !(i.id && ownIds.has(i.id)))

  if (kept.length) {
    const { error: e } = await admin.from('formation_installments')
      .upsert(kept.map(({ id, due_date, amount, paid_at }) => ({ id, sale_id: body.id, due_date, amount, paid_at })), { onConflict: 'id' })
    if (e) return dbError(e)
  }
  if (added.length) {
    const { error: e } = await admin.from('formation_installments')
      .insert(added.map(({ due_date, amount, paid_at }) => ({ sale_id: body.id, due_date, amount, paid_at })))
    if (e) return dbError(e)
  }
  const keptIds = new Set(kept.map((i) => i.id))
  const removed = [...ownIds].filter((id) => !keptIds.has(id))
  if (removed.length) {
    const { error: e } = await admin.from('formation_installments').delete().in('id', removed)
    if (e) return dbError(e)
  }
  return json({ ok: true })
}

export async function PATCH(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  let body
  try { body = await request.json() } catch { return json({ error: 'Corps JSON invalide' }, 400) }
  if (!body.installment_id) return json({ error: 'installment_id manquant' }, 400)
  const paidAt = body.paid_at || null
  if (paidAt && !isISODate(paidAt)) return json({ error: 'Date de paiement invalide' }, 400)
  const { data, error } = await admin.from('formation_installments')
    .update({ paid_at: paidAt }).eq('id', body.installment_id).select('id')
  if (error) return dbError(error)
  if (!data?.length) return json({ error: 'Échéance introuvable' }, 404)
  return json({ ok: true })
}

export async function DELETE(request) {
  const { admin, res } = await guard(request)
  if (res) return res
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'id manquant' }, 400)
  const { error } = await admin.from('formation_sales').delete().eq('id', id)
  if (error) return dbError(error)
  return json({ ok: true })
}
