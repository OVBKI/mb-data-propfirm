// lib/importers/metatrader.js — rapports HTML de MetaTrader 5 et MetaTrader 4.
//
// MT5 : Historique → clic droit → Rapport → HTML. Section « Positions », une
//   ligne par position clôturée :
//     Time | Position | Symbol | Type | Volume | Price | S / L | T / P | Time |
//     Price | Commission | Swap | Profit
//   Chaque ligne porte une cellule masquée (class="hidden") après Type, et les
//   milliers sont séparés par une espace (« 1 978.59 »). Heures du serveur du
//   broker, « YYYY.MM.DD HH:MM:SS ».
// MT4 : Historique du compte → Enregistrer le rapport. Section « Closed
//   Transactions » : Ticket | Open Time | Type | Size | Item | Price | S / L |
//   T / P | Close Time | Price | Commission | Taxes | Swap | Profit. Les lignes
//   balance/credit sont ignorées.
// Rapport en anglais requis : les intitulés sont traduits avec l'interface.
import { parseWallTime, makeTrade } from './common'

const ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }
function text(html) {
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (_, e) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim()
}

// Lignes du document : tableau de cellules visibles (texte).
export function htmlRows(html) {
  const rows = []
  const trRe = /<tr\b[^>]*>([\s\S]*?)(?=<tr\b|<\/table>|$)/gi
  let m
  while ((m = trRe.exec(html))) {
    const cells = []
    const tdRe = /<t([dh])\b([^>]*)>([\s\S]*?)(?=<t[dh]\b|<\/tr>|$)/gi
    let c
    while ((c = tdRe.exec(m[1]))) {
      if (/class\s*=\s*["']?[^"'>]*\bhidden\b/i.test(c[2])) continue
      cells.push(text(c[3].replace(/<\/t[dh]>[\s\S]*$/i, '')))
    }
    if (cells.length) rows.push(cells)
  }
  return rows
}

const num = (v) => {
  const s = String(v || '').replace(/[\s ]/g, '')
  if (!s) return 0
  const n = parseFloat(s)
  return isFinite(n) ? n : 0
}

export function isMetaTraderReport(html) {
  const s = String(html).slice(0, 200000)
  return /<html|<table/i.test(s) && (/>\s*Positions\s*</i.test(s) || /Closed Transactions/i.test(s))
}

function reportAccount(rows) {
  for (const r of rows.slice(0, 15)) {
    const joined = r.join(' ')
    const m = joined.match(/Account:\s*([A-Za-z0-9_-]+)/i)
    if (m) return m[1]
  }
  return null
}

export function parseMetaTraderReport(html) {
  const rows = htmlRows(html)
  const account = reportAccount(rows)
  const trades = []
  const errors = []

  // MT5
  const posIdx = rows.findIndex((r) => r.length === 1 && /^positions$/i.test(r[0]))
  if (posIdx >= 0) {
    for (const r of rows.slice(posIdx + 1)) {
      if (r.length === 1 && r[0]) break // section suivante (Orders) ; une ligne vide n'est qu'un espacement
      if (/^time$/i.test(r[0])) continue // en-tête
      if (r.length < 13) continue
      const [openT, position, symbol, type, volume, openP, , , closeT, closeP, commission, swap, profit] = r
      if (!/^(buy|sell)/i.test(type)) continue
      const entryTime = parseWallTime(openT)
      const exitTime = parseWallTime(closeT)
      if (!entryTime || !exitTime) { errors.push(r.join(' | ')); continue }
      const comm = num(commission)
      trades.push(makeTrade({
        externalId: position,
        account,
        instrument: symbol,
        side: /^buy/i.test(type) ? 'Long' : 'Short',
        qty: num(volume),
        entryPrice: num(openP),
        exitPrice: num(closeP),
        entryTime,
        exitTime,
        pnl: num(profit) + comm + num(swap),
        grossPnl: num(profit),
        commissions: -comm,
      }))
    }
    return { platform: 'mt5', trades, errors, notes: [] }
  }

  // MT4
  const ctIdx = rows.findIndex((r) => r.some((c) => /^Closed Transactions:?$/i.test(c)))
  if (ctIdx >= 0) {
    for (const r of rows.slice(ctIdx + 1)) {
      if (r.some((c) => /^(Open Trades|Working Orders):?$/i.test(c))) break
      if (/^ticket$/i.test(r[0]) || r.length < 14) continue
      const [ticket, openT, type, size, item, openP, , , closeT, closeP, commission, taxes, swap, profit] = r
      if (!/^(buy|sell)$/i.test(type)) continue
      const entryTime = parseWallTime(openT)
      const exitTime = parseWallTime(closeT)
      if (!entryTime || !exitTime) { errors.push(r.join(' | ')); continue }
      const comm = num(commission) + num(taxes)
      trades.push(makeTrade({
        externalId: ticket,
        account,
        instrument: String(item || '').toUpperCase(),
        side: /^buy/i.test(type) ? 'Long' : 'Short',
        qty: num(size),
        entryPrice: num(openP),
        exitPrice: num(closeP),
        entryTime,
        exitTime,
        pnl: num(profit) + comm + num(swap),
        grossPnl: num(profit),
        commissions: -comm,
      }))
    }
    return { platform: 'mt4', trades, errors, notes: [] }
  }
  throw new Error('Section « Positions » (MT5) ou « Closed Transactions » (MT4) introuvable. Exporte le rapport avec l’interface en anglais.')
}
