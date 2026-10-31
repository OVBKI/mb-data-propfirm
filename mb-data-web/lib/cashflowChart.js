// lib/cashflowChart.js — les trois courbes du widget « Dépenses, payouts et net »
// et l'échelle de son axe. Pur, sans dépendance : le widget le dessine, les tests
// le vérifient.

// rows : la série mensuelle de useOverviewData ({ payout, spent } par mois, en EUR).
// En cumulé, chaque point est la somme depuis le début de la période ; sinon, le
// montant du mois. Le net est toujours payouts − dépenses, point par point.
export function cashflowLines(rows, cumulative = true) {
  const payout = []
  const spent = []
  const net = []
  let p = 0
  let s = 0
  for (const r of rows || []) {
    const mp = Number(r?.payout) || 0
    const ms = Number(r?.spent) || 0
    p = cumulative ? p + mp : mp
    s = cumulative ? s + ms : ms
    payout.push(p)
    spent.push(s)
    net.push(p - s)
  }
  const totals = (rows || []).reduce(
    (acc, r) => ({ payout: acc.payout + (Number(r?.payout) || 0), spent: acc.spent + (Number(r?.spent) || 0) }),
    { payout: 0, spent: 0 },
  )
  totals.net = totals.payout - totals.spent
  return { payout, spent, net, totals }
}

// Pas « rond » (1, 2, 2,5 ou 5 × 10ⁿ) qui découpe l'étendue en `count` intervalles
// au plus.
function niceStep(span, count) {
  const raw = span / Math.max(1, count)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const f = raw / mag
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * mag
}

// Échelle de l'axe : bornes arrondies au pas, et les graduations. Zéro est
// TOUJOURS dans l'étendue : sans lui, un net négatif et des payouts positifs
// partageraient un axe dont on ne verrait pas où passe l'équilibre.
export function niceScale(values, count = 4) {
  const finite = (values || []).filter(Number.isFinite)
  let lo = Math.min(0, ...finite)
  let hi = Math.max(0, ...finite)
  if (hi === lo) hi = lo + 1
  const step = niceStep(hi - lo, count)
  lo = Math.floor(lo / step) * step
  hi = Math.ceil(hi / step) * step
  const ticks = []
  // Arrondi à 1e-9 près : 0,1 + 0,2 ne doit pas produire une graduation 0,30000000000000004.
  for (let v = lo; v <= hi + step / 1e6; v += step) ticks.push(Math.round(v * 1e9) / 1e9)
  return { min: lo, max: hi, step, ticks }
}

// Index des mois dont on écrit le libellé : au plus `max`, en partant du dernier
// mois (celui qu'on lit en premier) pour qu'il soit toujours étiqueté.
export function labelIndexes(n, max = 8) {
  if (n <= 0) return []
  const step = Math.max(1, Math.ceil(n / max))
  const out = []
  for (let i = n - 1; i >= 0; i -= step) out.unshift(i)
  return out
}
