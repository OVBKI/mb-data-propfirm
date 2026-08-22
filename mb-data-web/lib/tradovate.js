// lib/tradovate.js — la logique pure de la synchronisation Tradovate.
//
// Tout ce qui est testable sans réseau vit ici : la construction de la requête
// d'authentification, la lecture de sa réponse (y compris le cas de pénalité),
// la durée de vie du jeton, et surtout l'APPARIEMENT des exécutions en trades.
// Les routes API ne font que du transport.
//
// ┌─ CE QUE TRADOVATE DONNE, ET CE QU'IL NE DONNE PAS ────────────────────────┐
// │ /fill/list rend des EXÉCUTIONS : « acheté 2 ESZ5 à 5012,25 à 14h31 ».     │
// │ Il ne rend PAS de trades, et il ne rend AUCUN P&L en devise.              │
// │ Un journal a besoin d'allers-retours et d'euros : c'est ce fichier qui    │
// │ fait la conversion, et c'est là que se logent les erreurs.                │
// └───────────────────────────────────────────────────────────────────────────┘

import { tradePnL, pointValue } from './futuresContracts'

export const TRADOVATE_HOSTS = {
  live: 'https://live.tradovateapi.com/v1',
  demo: 'https://demo.tradovateapi.com/v1',
}

// Un jeton Tradovate vit ~80 minutes. On le considère mort AVANT son échéance
// réelle : un jeton qui expire pendant une requête produit une erreur 401
// difficile à distinguer d'un mauvais mot de passe.
export const TOKEN_SKEW_MS = 5 * 60 * 1000

export function authBody({ username, password, appId, appVersion, cid, sec, deviceId }) {
  return {
    name: username,
    password,
    appId,
    appVersion,
    cid,
    sec,
    // Tradovate lie le jeton à un appareil. Une valeur STABLE par utilisateur
    // évite d'être traité comme une nouvelle machine à chaque synchronisation,
    // ce qui déclenche des vérifications supplémentaires.
    deviceId: deviceId || 'quantara-sync',
  }
}

// Tradovate ne répond pas par un code d'erreur quand il limite : il renvoie 200
// avec un « p-ticket » et un délai d'attente. Traiter ça comme un succès donne
// un jeton vide et une erreur incompréhensible trois appels plus loin.
export function parseAuthResponse(json) {
  if (!json || typeof json !== 'object') {
    return { ok: false, kind: 'malformed', message: 'Réponse vide ou illisible' }
  }
  if (json['p-ticket']) {
    return {
      ok: false,
      kind: 'penalty',
      ticket: json['p-ticket'],
      // p-time est en SECONDES.
      waitMs: Math.max(0, Number(json['p-time'] || 0)) * 1000,
      captcha: Boolean(json['p-captcha']),
      message: json['p-captcha']
        ? 'Tradovate demande un captcha : connecte-toi une fois sur tradovate.com puis réessaie.'
        : `Tradovate limite les connexions, réessai dans ${json['p-time'] || '?'} s.`,
    }
  }
  if (json.errorText) {
    return { ok: false, kind: 'rejected', message: json.errorText }
  }
  if (!json.accessToken) {
    return { ok: false, kind: 'malformed', message: 'Aucun jeton dans la réponse' }
  }
  return {
    ok: true,
    token: json.accessToken,
    marketToken: json.mdAccessToken || null,
    userId: json.userId ?? null,
    // `expirationTime` est une date ISO.
    expiresAt: json.expirationTime ? Date.parse(json.expirationTime) : null,
  }
}

export function isTokenUsable(session, now = Date.now()) {
  if (!session || !session.token) return false
  if (!session.expiresAt) return false
  return session.expiresAt - TOKEN_SKEW_MS > now
}

// ============================================================================
// Appariement des exécutions
// ============================================================================
// Méthode : quantité signée cumulée par contrat. On additionne les exécutions
// dans l'ordre chronologique ; chaque fois que la position repasse par ZÉRO, un
// aller-retour est terminé.
//
// Pourquoi pas simplement « une entrée, une sortie » : un trade réel se construit
// et se démonte en plusieurs fois (2 lots achetés, 1 revendu, 1 ajouté, 2
// revendus). Compter par paires produirait quatre trades là où il n'y en a qu'un.
//
// Le prix retenu est la moyenne PONDÉRÉE par la quantité — une moyenne simple
// serait fausse dès que les lots sont de tailles différentes.
export function pairFills(fills) {
  const byContract = new Map()
  for (const f of normalizeFills(fills)) {
    if (!byContract.has(f.contract)) byContract.set(f.contract, [])
    byContract.get(f.contract).push(f)
  }

  const trades = []
  for (const [contract, list] of byContract) {
    list.sort((a, b) => a.ts - b.ts || a.id - b.id)

    let position = 0          // quantité signée en cours
    let openQty = 0           // quantité ouverte (valeur absolue)
    let openCost = 0          // somme prix×qty du côté d'ouverture
    let closeQty = 0
    let closeCost = 0
    let openedAt = null
    let side = null

    for (const f of list) {
      const signed = f.action === 'Sell' ? -f.qty : f.qty

      if (position === 0) {
        // Nouvelle position.
        side = signed > 0 ? 'Long' : 'Short'
        openedAt = f.ts
        openQty = Math.abs(signed); openCost = f.price * Math.abs(signed)
        closeQty = 0; closeCost = 0
        position = signed
        continue
      }

      const sameDirection = (position > 0 && signed > 0) || (position < 0 && signed < 0)
      if (sameDirection) {
        // Renfort : ça fait partie de la MÊME entrée.
        openQty += Math.abs(signed); openCost += f.price * Math.abs(signed)
        position += signed
        continue
      }

      // Réduction ou clôture. On ne compte que ce qui ferme réellement : au-delà,
      // c'est une INVERSION, et le surplus ouvre une nouvelle position.
      const closing = Math.min(Math.abs(signed), Math.abs(position))
      closeQty += closing; closeCost += f.price * closing
      position += signed

      if (position === 0 || Math.sign(position) !== Math.sign(position - signed)) {
        trades.push(buildTrade({ contract, side, openQty, openCost, closeQty, closeCost, openedAt, closedAt: f.ts }))
        const overflow = Math.abs(signed) - closing
        if (overflow > 0) {
          // Inversion : le reste ouvre la position opposée.
          side = signed > 0 ? 'Long' : 'Short'
          openedAt = f.ts
          openQty = overflow; openCost = f.price * overflow
          closeQty = 0; closeCost = 0
          position = signed > 0 ? overflow : -overflow
        } else {
          position = 0; openQty = 0; openCost = 0; closeQty = 0; closeCost = 0; openedAt = null; side = null
        }
      }
    }
    // Une position encore ouverte n'est PAS un trade : elle n'a pas de résultat.
    // L'écarter est volontaire — l'inscrire au journal fabriquerait un P&L.
  }

  return trades.sort((a, b) => a.closedAt - b.closedAt)
}

function buildTrade({ contract, side, openQty, openCost, closeQty, closeCost, openedAt, closedAt }) {
  const qty = closeQty
  const entry = +(openCost / openQty).toFixed(6)
  const exit = +(closeCost / closeQty).toFixed(6)
  const pnl = tradePnL({ contract, side, entry, exit, qty })
  return {
    contract,
    side,
    qty,
    entry,
    exit,
    openedAt,
    closedAt,
    pnl,                                   // null si le contrat est inconnu
    needsMultiplier: pointValue(contract) === null,
  }
}

// Les noms de champs de Tradovate ont bougé au fil des versions. On accepte les
// variantes plutôt que de casser sur un renommage, mais on REJETTE ce qui est
// inexploitable : une exécution sans prix ni quantité n'est pas récupérable.
export function normalizeFills(raw) {
  const out = []
  for (const f of Array.isArray(raw) ? raw : []) {
    const price = Number(f.price ?? f.fillPrice)
    const qty = Number(f.qty ?? f.quantity ?? f.filledQty)
    const ts = Date.parse(f.timestamp ?? f.tradeDate ?? f.time ?? '')
    const contract = String(f.contract ?? f.contractName ?? f.symbol ?? '').trim()
    if (!contract || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(ts)) continue
    const action = String(f.action ?? f.side ?? '').toLowerCase().startsWith('s') ? 'Sell' : 'Buy'
    out.push({ id: Number(f.id ?? 0), contract, price, qty, ts, action })
  }
  return out
}

// Un trade Tradovate → une ligne journal_entries.
// `source_id` rend la synchronisation IDEMPOTENTE : relancer sur la même période
// met à jour au lieu de dupliquer. Sans lui, chaque passage doublerait le journal.
export function toJournalEntry(trade, { accountId, userId }) {
  const d = new Date(trade.closedAt)
  return {
    user_id: userId,
    account_id: accountId,
    date: d.toISOString().slice(0, 10),
    traded_at: d.toISOString(),
    pnl: trade.pnl ?? 0,
    instrument: trade.contract,
    side: trade.side,
    entry_price: trade.entry,
    exit_price: trade.exit,
    source: 'tradovate',
    source_id: `tradovate:${trade.contract}:${trade.openedAt}:${trade.closedAt}`,
    notes: trade.needsMultiplier
      ? `⚠ Multiplicateur inconnu pour ${trade.contract} — P&L à saisir à la main.`
      : '',
  }
}
