// POST /api/import/topstepx — lecture ponctuelle d'un compte TopstepX via
// l'API ProjectX, pour l'Import Lab.
//
// Corps : { userName, apiKey, accountIds?: number[], start?: ISO, end?: ISO }
//   - sans accountIds : renvoie les comptes ;
//   - avec accountIds : renvoie les exécutions (demi-tours) de la période, que
//     le navigateur regroupe en allers-retours (lib/importers/projectx).
//
// Le nom d'utilisateur et la clé ne sont JAMAIS stockés ni journalisés : ils
// servent à ouvrir une session ProjectX le temps de la requête. Pas d'accès
// en écriture : seuls Account/search et Trade/search sont appelés.
// Doc : https://gateway.docs.projectx.com
import { verifyAuth } from '../../../../lib/apiAuth'
import { rateLimit, rateLimitResponse } from '../../../../lib/rateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BASE = process.env.PROJECTX_API_URL || 'https://api.topstepx.com'
const DAY = 86400000
const CHUNK_DAYS = 30
const MAX_DAYS = 400

async function px(path, body, token) {
  const r = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  })
  if (r.status === 429) throw Object.assign(new Error('RATE'), { code: 'RATE' })
  const data = await r.json().catch(() => null)
  if (!r.ok || !data) throw Object.assign(new Error(`HTTP ${r.status}`), { code: 'UPSTREAM' })
  return data
}

export async function POST(request) {
  const auth = await verifyAuth(request)
  if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

  // La connexion ProjectX est elle-même limitée : 10 appels par 10 minutes suffisent.
  const limit = rateLimit({ key: `topstepx:${auth.user.id}`, windowMs: 600_000, max: 10 })
  if (!limit.allowed) return rateLimitResponse(limit, 'Trop de tentatives. Réessaie dans quelques minutes.')

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Requête invalide' }, { status: 400 }) }
  const userName = typeof body?.userName === 'string' ? body.userName.trim() : ''
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!userName || !apiKey || userName.length > 200 || apiKey.length > 500) {
    return Response.json({ error: 'Nom d’utilisateur et clé API requis' }, { status: 400 })
  }

  try {
    const login = await px('/api/Auth/loginKey', { userName, apiKey })
    if (!login.success || !login.token) {
      return Response.json({ error: 'Connexion refusée par TopstepX. Vérifie le nom d’utilisateur (pas l’e-mail) et la clé API, et que l’abonnement API est bien lié à ton compte.' }, { status: 401 })
    }
    const token = login.token

    const ids = Array.isArray(body.accountIds) ? body.accountIds.map(Number).filter(Number.isFinite).slice(0, 20) : null
    if (!ids || ids.length === 0) {
      const res = await px('/api/Account/search', { onlyActiveAccounts: false }, token)
      const accounts = (res.accounts || []).map((a) => ({ id: a.id, name: a.name, balance: a.balance, canTrade: a.canTrade }))
      return Response.json({ accounts })
    }

    const end = body.end ? new Date(body.end) : new Date()
    let start = body.start ? new Date(body.start) : new Date(end.getTime() - 90 * DAY)
    if (isNaN(start) || isNaN(end) || start >= end) return Response.json({ error: 'Période invalide' }, { status: 400 })
    if (end - start > MAX_DAYS * DAY) start = new Date(end.getTime() - MAX_DAYS * DAY)

    const fills = []
    for (const accountId of ids) {
      for (let from = start.getTime(); from < end.getTime(); from += CHUNK_DAYS * DAY) {
        const to = Math.min(from + CHUNK_DAYS * DAY, end.getTime())
        const res = await px('/api/Trade/search', { accountId, startTimestamp: new Date(from).toISOString(), endTimestamp: new Date(to).toISOString() }, token)
        if (res.success === false) return Response.json({ error: `TopstepX a refusé la lecture du compte ${accountId}.` }, { status: 502 })
        for (const t of res.trades || []) {
          fills.push({
            id: t.id, accountId: t.accountId, contractId: t.contractId, creationTimestamp: t.creationTimestamp,
            price: t.price, profitAndLoss: t.profitAndLoss, fees: t.fees, side: t.side, size: t.size, voided: t.voided,
          })
        }
      }
    }
    // Une exécution à cheval sur deux tranches peut revenir deux fois.
    const unique = [...new Map(fills.map((f) => [f.id, f])).values()]
    return Response.json({ fills: unique, start: start.toISOString(), end: end.toISOString() })
  } catch (e) {
    if (e.code === 'RATE') return Response.json({ error: 'TopstepX limite le nombre d’appels. Réessaie dans une minute.' }, { status: 429 })
    return Response.json({ error: 'TopstepX ne répond pas. Réessaie plus tard.' }, { status: 502 })
  }
}
