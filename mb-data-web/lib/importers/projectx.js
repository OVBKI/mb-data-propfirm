// lib/importers/projectx.js — TopstepX (plateforme ProjectX).
//
// 1. Export CSV de l'onglet « Trades » :
//      Id,ContractName,EnteredAt,ExitedAt,EntryPrice,ExitPrice,Fees,PnL,Size,
//      Type,TradeDay,TradeDuration[,Commissions]
//    Heures « MM/DD/YYYY HH:mm:ss ±HH:MM » (fuseau de l'utilisateur), PnL BRUT,
//    Fees = frais du trade, Commissions souvent vide.
// 2. Exécutions de l'API ProjectX (/api/Trade/search) : des demi-tours. Le
//    P&L n'est porté que par l'exécution de clôture ; on reconstitue les
//    allers-retours en FIFO par contrat.
import { parseCsv, parseMoney, parseWallTime, findHeader, makeTrade } from './common'

const REQUIRED = ['Id', 'ContractName', 'EnteredAt', 'ExitedAt', 'EntryPrice', 'ExitPrice', 'Fees', 'PnL', 'Size', 'Type']

export function isTopstepXTrades(text) {
  return !!findHeader(parseCsv(String(text).slice(0, 4000)), REQUIRED)
}

export function parseTopstepXTrades(text) {
  const rows = parseCsv(text)
  const h = findHeader(rows, REQUIRED)
  if (!h) throw new Error('En-tête TopstepX « Trades » introuvable')
  const c = h.cols
  const trades = []
  const errors = []
  for (const r of rows.slice(h.index + 1)) {
    const entryTime = parseWallTime(r[c.EnteredAt])
    const exitTime = parseWallTime(r[c.ExitedAt])
    const gross = parseMoney(r[c.PnL])
    if (!r[c.Id] || !entryTime || !exitTime || gross == null) { errors.push(r.join(',')); continue }
    const fees = Math.abs(parseMoney(r[c.Fees]) || 0) + (c.Commissions != null ? Math.abs(parseMoney(r[c.Commissions]) || 0) : 0)
    const tradeDay = c.TradeDay != null ? parseWallTime(r[c.TradeDay]) : null
    trades.push(makeTrade({
      externalId: String(r[c.Id]).trim(),
      instrument: String(r[c.ContractName] || '').trim(),
      side: /short/i.test(r[c.Type]) ? 'Short' : 'Long',
      qty: parseFloat(r[c.Size]),
      entryPrice: parseFloat(r[c.EntryPrice]),
      exitPrice: parseFloat(r[c.ExitPrice]),
      entryTime,
      exitTime,
      date: (tradeDay || exitTime).slice(0, 10),
      grossPnl: gross,
      commissions: fees,
    }))
  }
  return { platform: 'topstepx', trades, errors, notes: [] }
}

// « CON.F.US.EP.H25 » → « EPH25 » ; un autre format est rendu tel quel.
export function contractSymbol(contractId) {
  const parts = String(contractId || '').split('.')
  return parts.length >= 5 ? `${parts[3]}${parts[4]}` : String(contractId || '')
}

const pad = (n) => String(n).padStart(2, '0')
// Horodatage UTC de l'API → heure murale locale, comme une saisie manuelle.
export function isoToLocalWall(iso, offsetMinutes = new Date(iso).getTimezoneOffset()) {
  const d = new Date(new Date(iso).getTime() - offsetMinutes * 60000)
  if (isNaN(d)) return null
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

// Exécutions API → allers-retours. side : 0 = achat, 1 = vente.
// Chaque exécution de clôture porte le P&L brut de la quantité qu'elle ferme ;
// les frais de l'ouverture sont répartis au prorata de la quantité fermée.
export function pairProjectXFills(fills, { accountName, offsetMinutes } = {}) {
  const sorted = (fills || [])
    .filter((f) => !f.voided && Number(f.size) > 0)
    .sort((a, b) => String(a.creationTimestamp).localeCompare(String(b.creationTimestamp)) || Number(a.id) - Number(b.id))
  const open = {} // contractId → [{ fill, remaining, sign }]
  const trades = []
  for (const f of sorted) {
    const sign = Number(f.side) === 0 ? 1 : -1
    const queue = open[f.contractId] || (open[f.contractId] = [])
    let qty = Number(f.size)
    const closing = queue.length && queue[0].sign !== sign
    if (!closing) {
      queue.push({ fill: f, remaining: qty, sign })
      continue
    }
    const closeFeePerUnit = (Number(f.fees) || 0) / Number(f.size)
    const grossPerUnit = (Number(f.profitAndLoss) || 0) / Number(f.size)
    while (qty > 0 && queue.length && queue[0].sign !== sign) {
      const o = queue[0]
      const q = Math.min(qty, o.remaining)
      const openFeePerUnit = (Number(o.fill.fees) || 0) / Number(o.fill.size)
      trades.push(makeTrade({
        externalId: `${o.fill.id}-${f.id}`,
        account: accountName || (f.accountId != null ? String(f.accountId) : null),
        instrument: contractSymbol(f.contractId),
        side: o.sign > 0 ? 'Long' : 'Short',
        qty: q,
        entryPrice: Number(o.fill.price),
        exitPrice: Number(f.price),
        entryTime: isoToLocalWall(o.fill.creationTimestamp, offsetMinutes),
        exitTime: isoToLocalWall(f.creationTimestamp, offsetMinutes),
        grossPnl: grossPerUnit * q,
        commissions: (openFeePerUnit + closeFeePerUnit) * q,
      }))
      o.remaining -= q
      qty -= q
      if (o.remaining <= 0) queue.shift()
    }
    // Reliquat de sens inverse : retournement de position, il ouvre.
    if (qty > 0) queue.push({ fill: { ...f, size: qty, fees: closeFeePerUnit * qty }, remaining: qty, sign })
  }
  const stillOpen = Object.values(open).reduce((s, q) => s + q.length, 0)
  return { platform: 'topstepx-api', trades, errors: [], notes: stillOpen ? ['openPositions'] : [] }
}
