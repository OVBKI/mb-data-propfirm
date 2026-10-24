// lib/importers/common.js — outils partagés par les imports de plateformes
// (Tradovate, NinjaTrader, TopstepX, MetaTrader, API ProjectX).
//
// Chaque parseur rend la même forme de trade, que l'Import Lab écrit ensuite
// dans journal_entries :
//   { externalId, account, date, tradedAt, instrument, side, qty,
//     entryPrice, exitPrice, pnl (NET), commissions (≥ 0), grossPnl }
// `date` et `tradedAt` sont l'heure murale du fichier, comme une saisie
// manuelle (journal_entries.traded_at n'a pas de fuseau).

// CSV avec guillemets, virgules et retours à la ligne entre guillemets.
export function parseCsv(text, delimiter = ',') {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  const s = stripBom(String(text || ''))
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === delimiter) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((x) => x !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((x) => x !== '')) rows.push(row)
  return rows
}

export function stripBom(s) {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s
}

// Le délimiteur le plus fréquent sur la ligne d'en-tête.
export function sniffDelimiter(text) {
  const first = stripBom(String(text || '')).split(/\r?\n/, 1)[0] || ''
  const counts = [',', ';', '\t'].map((d) => [d, first.split(d).length - 1])
  counts.sort((a, b) => b[1] - a[1])
  return counts[0][1] > 0 ? counts[0][0] : ','
}

// Montants : « $25.00 », « $(6.25) », « "$1,708.00" », « ($510.00) »,
// « -$ 200,00 » (virgule décimale), « 1 978.59 », « -137.500000000 ».
export function parseMoney(v, { decimalComma = false } = {}) {
  if (v == null) return null
  let s = String(v).trim()
  if (!s || s === '-' || s === '—') return null
  let neg = false
  if (/^\(.*\)$/.test(s.replace(/[$€£\s]/g, ''))) neg = true
  if (/^-|^\$\s*-|^\(|\$\(/.test(s)) neg = true
  s = s.replace(/[()$€£\s +-]/g, '')
  if (decimalComma) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(/,/g, '')
  const n = parseFloat(s)
  if (!isFinite(n)) return null
  return neg ? -n : n
}

// Identifiant court et stable pour les plateformes sans identifiant de trade.
export function hashId(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

const pad = (n) => String(n).padStart(2, '0')

// « 06/14/2026 18:03:54 », « 5/4/2026 12:11:02 AM », « 2024.01.10 04:06:11 »,
// « 10/29/2025 02:34:55 -05:00 » → « 2026-06-14T18:03:54 » (heure murale).
// order : 'mdy' (défaut US) ou 'dmy'.
export function parseWallTime(v, { order = 'mdy' } = {}) {
  const s = String(v || '').trim()
  if (!s) return null
  let m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}T${pad(m[4])}:${m[5]}:${m[6] || '00'}`
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,]\d+)?\s*(AM|PM)?)?/i)
  if (!m) return null
  let [, a, b, y, hh = '0', mi = '00', ss = '00', ap] = m
  if (y.length === 2) y = `20${y}`
  const [mo, d] = order === 'dmy' ? [b, a] : [a, b]
  let h = Number(hh)
  if (ap) {
    const pm = ap.toUpperCase() === 'PM'
    if (h === 12) h = pm ? 12 : 0
    else if (pm) h += 12
  }
  if (Number(mo) > 12 || Number(d) > 31) return null
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${mi}:${ss}`
}

// Ordre jour/mois d'une colonne de dates : un premier nombre > 12 tranche pour
// jour-mois, un second > 12 pour mois-jour ; sinon le défaut fourni.
export function guessDateOrder(values, fallback = 'mdy') {
  for (const v of values) {
    const m = String(v || '').trim().match(/^(\d{1,2})[./-](\d{1,2})[./-]\d{2,4}/)
    if (!m) continue
    if (Number(m[1]) > 12) return 'dmy'
    if (Number(m[2]) > 12) return 'mdy'
  }
  return fallback
}

// Cherche l'en-tête : première ligne qui contient toutes les colonnes requises.
export function findHeader(rows, required) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const cells = rows[i].map((c) => String(c).trim())
    if (required.every((r) => cells.includes(r))) return { index: i, cols: Object.fromEntries(cells.map((c, j) => [c, j])) }
  }
  return null
}

const round2 = (n) => Math.round(n * 100) / 100

export function makeTrade(t) {
  const gross = t.grossPnl
  const fees = Math.abs(Number(t.commissions) || 0)
  const pnl = t.pnl != null ? t.pnl : gross != null ? gross - fees : null
  return {
    externalId: String(t.externalId),
    account: t.account || null,
    date: t.date || (t.exitTime || t.entryTime || '').slice(0, 10),
    tradedAt: t.entryTime || t.exitTime || null,
    entryTime: t.entryTime || null,
    exitTime: t.exitTime || null,
    instrument: t.instrument || '',
    side: t.side || '',
    qty: t.qty != null && Number(t.qty) > 0 ? Math.round(Number(t.qty) * 100) / 100 : null,
    entryPrice: t.entryPrice ?? null,
    exitPrice: t.exitPrice ?? null,
    pnl: pnl != null ? round2(pnl) : null,
    commissions: round2(fees),
    grossPnl: gross != null ? round2(gross) : null,
  }
}
