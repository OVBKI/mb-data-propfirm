// lib/importers/ninjatrader.js — NinjaTrader 8, Trade Performance, grille
// « Trades » exportée en CSV.
//
//   Trade number,Instrument,Account,Strategy,Market pos.,Qty,Entry price,
//   Exit price,Entry time,Exit time,...,Profit,Cum. net profit,Commission,
//   [Clearing Fee,Exchange Fee,IP Fee,NFA Fee,]MAE,MFE,ETD,Bars,
// - Les colonnes de frais varient selon la version : lecture par nom.
// - Format régional Windows : délimiteur « ; » et virgule décimale possibles.
// - Profit : net ou brut selon le réglage d'affichage. On compare à la colonne
//   « Cum. net profit » : si elle cumule Profit, Profit est déjà net.
import { parseCsv, sniffDelimiter, parseMoney, parseWallTime, guessDateOrder, findHeader, hashId, makeTrade } from './common'

const REQUIRED = ['Instrument', 'Account', 'Market pos.', 'Qty', 'Entry price', 'Exit price', 'Entry time', 'Exit time', 'Profit']
const FEE_COLS = ['Commission', 'Clearing Fee', 'Exchange Fee', 'IP Fee', 'NFA Fee']
const MONTH_CODES = 'FGHJKMNQUVXZ'

// « NQ 06-26 » → « NQM6 », comme Rithmic, Tradovate et TopstepX l'écrivent.
export function ntInstrument(s) {
  const m = String(s || '').trim().match(/^([A-Z0-9]+)\s+(\d{2})-(\d{2})$/i)
  if (!m) return String(s || '').trim()
  const mo = Number(m[2])
  return mo >= 1 && mo <= 12 ? `${m[1].toUpperCase()}${MONTH_CODES[mo - 1]}${m[3].slice(-1)}` : String(s).trim()
}

export function isNinjaTraderTrades(text) {
  const head = String(text).slice(0, 4000)
  return !!findHeader(parseCsv(head, sniffDelimiter(head)), REQUIRED)
}

export function parseNinjaTraderTrades(text) {
  const delimiter = sniffDelimiter(text)
  const decimalComma = delimiter === ';'
  const rows = parseCsv(text, delimiter)
  const h = findHeader(rows, REQUIRED)
  if (!h) throw new Error('En-tête NinjaTrader « Trades » introuvable')
  const c = h.cols
  const body = rows.slice(h.index + 1).filter((r) => r[c.Instrument] && r[c['Entry time']])
  const order = guessDateOrder(body.map((r) => r[c['Entry time']]), decimalComma ? 'dmy' : 'mdy')
  const money = (v) => parseMoney(v, { decimalComma })
  const num = (v) => parseFloat(decimalComma ? String(v).replace(/\./g, '').replace(',', '.') : String(v).replace(/,/g, ''))

  // Profit net si « Cum. net profit » en est la somme courante.
  let profitIsNet = true
  if (c['Cum. net profit'] != null) {
    let cum = 0
    for (const r of body) {
      cum += money(r[c.Profit]) || 0
      const shown = money(r[c['Cum. net profit']])
      if (shown != null && Math.abs(shown - cum) > 0.01) { profitIsNet = false; break }
    }
  }

  const trades = []
  const errors = []
  for (const r of body) {
    const entryTime = parseWallTime(r[c['Entry time']], { order })
    const exitTime = parseWallTime(r[c['Exit time']], { order })
    const profit = money(r[c.Profit])
    if (!entryTime || !exitTime || profit == null) { errors.push(r.join(delimiter)); continue }
    const fees = FEE_COLS.reduce((s, k) => s + (c[k] != null ? Math.abs(money(r[c[k]]) || 0) : 0), 0)
    const pos = String(r[c['Market pos.']] || '').trim().toLowerCase()
    const account = String(r[c.Account] || '').trim()
    const instrument = ntInstrument(r[c.Instrument])
    const qty = num(r[c.Qty])
    const entryPrice = num(r[c['Entry price']])
    trades.push(makeTrade({
      externalId: hashId([account, instrument, entryTime, exitTime, qty, entryPrice].join('|')),
      account,
      instrument,
      side: pos.startsWith('short') ? 'Short' : 'Long',
      qty,
      entryPrice,
      exitPrice: num(r[c['Exit price']]),
      entryTime,
      exitTime,
      date: exitTime.slice(0, 10),
      pnl: profitIsNet ? profit : profit - fees,
      grossPnl: profitIsNet ? profit + fees : profit,
      commissions: fees,
    }))
  }
  return { platform: 'ninjatrader', trades, errors, notes: [] }
}
