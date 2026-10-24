// lib/importers/tradovate.js — export « Performance » de Tradovate.
//
// Une ligne par aller-retour clôturé :
//   symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,
//   buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
// - P&L BRUT (« $25.00 », « $(6.25) ») : ce fichier ne contient pas les frais.
// - Pas de colonne sens : vente avant achat = short.
// - Heures « MM/DD/YYYY HH:mm:ss » dans le fuseau du navigateur de l'utilisateur.
// - Pas de colonne compte : un fichier = un compte, choisi à l'import.
import { parseCsv, parseMoney, parseWallTime, findHeader, makeTrade } from './common'

export const TRADOVATE_HEADER = ['symbol', 'buyFillId', 'sellFillId', 'qty', 'buyPrice', 'sellPrice', 'pnl', 'boughtTimestamp', 'soldTimestamp']

export function isTradovatePerformance(text) {
  return !!findHeader(parseCsv(String(text).slice(0, 4000)), TRADOVATE_HEADER)
}

export function parseTradovatePerformance(text) {
  const rows = parseCsv(text)
  const h = findHeader(rows, TRADOVATE_HEADER)
  if (!h) throw new Error('En-tête Tradovate Performance introuvable')
  const c = h.cols
  const trades = []
  const errors = []
  for (const r of rows.slice(h.index + 1)) {
    const bought = parseWallTime(r[c.boughtTimestamp])
    const sold = parseWallTime(r[c.soldTimestamp])
    const gross = parseMoney(r[c.pnl])
    if (!bought || !sold || gross == null) { errors.push(r.join(',')); continue }
    const short = sold < bought
    const buyPrice = parseFloat(r[c.buyPrice])
    const sellPrice = parseFloat(r[c.sellPrice])
    trades.push(makeTrade({
      externalId: `${r[c.buyFillId]}-${r[c.sellFillId]}`,
      instrument: String(r[c.symbol] || '').trim(),
      side: short ? 'Short' : 'Long',
      qty: parseFloat(r[c.qty]),
      entryPrice: short ? sellPrice : buyPrice,
      exitPrice: short ? buyPrice : sellPrice,
      entryTime: short ? sold : bought,
      exitTime: short ? bought : sold,
      date: (short ? bought : sold).slice(0, 10),
      grossPnl: gross,
      commissions: 0,
    }))
  }
  return { platform: 'tradovate', trades, errors, notes: ['grossOnly'] }
}
