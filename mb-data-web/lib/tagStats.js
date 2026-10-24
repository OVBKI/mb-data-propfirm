// lib/tagStats.js — performance par setup (tag), sur les trades affichés.
//
// Chaque trade compte dans CHACUN de ses tags : un trade « ORB » et « A+ setup »
// nourrit les deux lignes. Les trades sans tag forment leur propre ligne, pour
// que la somme des lignes ne cache pas une partie du journal.
// Espérance = P&L moyen par trade. R moyen : seulement sur les trades dont le
// R-multiple est calculable (entrée, sortie et stop renseignés).
import { computeRMultiple } from './tradeMath'

export const UNTAGGED = '__none__'

export function tagStats(entries) {
  const by = new Map()
  for (const e of entries || []) {
    const tags = Array.isArray(e.tags) && e.tags.length ? e.tags : [UNTAGGED]
    const pnl = Number(e.pnl) || 0
    const r = computeRMultiple({ entry: e.entry_price, exit: e.exit_price, stop: e.stop_loss, side: e.side, pnl: e.pnl })
    for (const tag of new Set(tags)) {
      if (!by.has(tag)) by.set(tag, { tag, count: 0, wins: 0, total: 0, rSum: 0, rCount: 0 })
      const s = by.get(tag)
      s.count++
      if (pnl > 0) s.wins++
      s.total += pnl
      if (r != null && isFinite(r)) { s.rSum += r; s.rCount++ }
    }
  }
  return [...by.values()]
    .map((s) => ({
      tag: s.tag,
      count: s.count,
      winRate: s.count ? s.wins / s.count : 0,
      total: s.total,
      expectancy: s.count ? s.total / s.count : 0,
      avgR: s.rCount ? s.rSum / s.rCount : null,
      rCount: s.rCount,
    }))
    .sort((a, b) => b.total - a.total)
}
