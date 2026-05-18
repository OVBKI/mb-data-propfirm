// lib/tradeMath.js — Calculs R-multiple & Risk:Reward pour le journal Quantara.
//
// DÉFINITIONS PROFESSIONNELLES :
//
//   Risk per trade (R) = |entry_price - stop_loss| × tick_value × contracts
//     → C'est le montant en $ que tu risques sur le trade.
//     → On peut le calculer en POINTS uniquement (sans tick_value) si on veut
//       juste le ratio normalisé.
//
//   R-multiple RÉALISÉ = (PnL réalisé) / (Risk planifié)
//     → "Ce trade m'a rapporté +2.3R" = +2.3× ce que je risquais.
//     → Calcul équivalent en POINTS : (exit - entry) / (entry - stop) pour un Long.
//
//   R:R PLANIFIÉ = (Take Profit - Entry) / (Entry - Stop Loss)
//     → Ce qu'on visait AVANT le trade. Standard: viser ≥ 1:2 (= 2R minimum).
//
// CONVENTION DE SIGNES :
//   - Long  : stop < entry  (risque en dessous)  → R = (exit - entry) / (entry - stop)
//   - Short : stop > entry  (risque au-dessus)   → R = (entry - exit) / (stop - entry)
//   Si side absent : on tente d'inférer depuis l'ordre des prix (best-effort).

// === Conversion helpers ===
function num(x) {
  if (x == null) return null
  const n = typeof x === 'number' ? x : parseFloat(x)
  return Number.isFinite(n) ? n : null
}

// === Inférer le side si pas explicitement défini ===
// Heuristique : pour un trade gagnant, exit > entry → Long ; exit < entry → Short.
// Pour un trade perdant, c'est l'inverse. Si pnl=0, on ne peut pas trancher → null.
export function inferSide({ entry, exit, pnl }) {
  const e = num(entry), x = num(exit), p = num(pnl)
  if (e == null || x == null) return null
  if (x === e) return null  // pas de move = on peut pas trancher
  if (p == null || p === 0) {
    // Sans PnL, on devine au pif (le sens majoritaire = Long si exit > entry)
    return x > e ? 'Long' : 'Short'
  }
  // Trade gagnant : exit > entry → Long ; exit < entry → Short
  // Trade perdant : exit > entry → Short (a perdu en montant) ; exit < entry → Long
  const movedUp = x > e
  const isWin = p > 0
  if (movedUp && isWin) return 'Long'
  if (!movedUp && isWin) return 'Short'
  if (movedUp && !isWin) return 'Short'
  return 'Long'
}

// === R-multiple RÉALISÉ ===
// Calculé en POINTS (indépendant du tick_value/contracts).
// Retourne null si données insuffisantes ou cohérence cassée.
export function computeRMultiple({ entry, exit, stop, side, pnl }) {
  const e = num(entry), x = num(exit), s = num(stop)
  if (e == null || x == null || s == null) return null

  let sd = side
  if (sd !== 'Long' && sd !== 'Short') {
    sd = inferSide({ entry, exit, pnl })
    if (!sd) return null
  }

  if (sd === 'Long') {
    const risk = e - s   // entry au-dessus du stop = OK
    if (risk <= 0) return null  // stop ≥ entry → données incohérentes pour un Long
    return (x - e) / risk
  }
  // Short
  const risk = s - e   // stop au-dessus de l'entry
  if (risk <= 0) return null  // stop ≤ entry → incohérent pour un Short
  return (e - x) / risk
}

// === Risk:Reward PLANIFIÉ ===
// Combien on visait AVANT le trade (avant que la position soit clôturée).
// Retourne null si donnée manquante.
export function computeRiskReward({ entry, takeProfit, stop, side, pnl, exit }) {
  const e = num(entry), tp = num(takeProfit), s = num(stop)
  if (e == null || tp == null || s == null) return null

  let sd = side
  if (sd !== 'Long' && sd !== 'Short') {
    sd = inferSide({ entry, exit, pnl })
    if (!sd) return null
  }

  if (sd === 'Long') {
    const risk = e - s
    const reward = tp - e
    if (risk <= 0 || reward <= 0) return null
    return reward / risk
  }
  // Short
  const risk = s - e
  const reward = e - tp
  if (risk <= 0 || reward <= 0) return null
  return reward / risk
}

// === Formatters d'affichage ===
export function formatR(r, dec = 2) {
  if (r == null || !Number.isFinite(r)) return '—'
  return (r >= 0 ? '+' : '') + r.toFixed(dec) + 'R'
}

export function formatRR(rr, dec = 1) {
  if (rr == null || !Number.isFinite(rr) || rr <= 0) return '—'
  return '1:' + rr.toFixed(dec)
}

// === Stats agrégées ===
// Reçoit un array d'entries (journal_entries enrichies) et retourne :
//   - avgR        : moyenne des R-multiples (trades sans R sont ignorés)
//   - rCount      : nombre de trades pris en compte (= ceux avec entry+exit+stop)
//   - expectancyR : R moyen pondéré par win rate (utile pour traders pro)
//   - bestR       : meilleur trade en R
//   - worstR      : pire trade en R
export function computeRStats(entries) {
  const rs = []
  for (const e of (entries || [])) {
    const r = computeRMultiple({
      entry: e.entry_price,
      exit: e.exit_price,
      stop: e.stop_loss,
      side: e.side,
      pnl: e.pnl,
    })
    if (r != null && Number.isFinite(r)) rs.push(r)
  }
  if (rs.length === 0) {
    return { avgR: null, rCount: 0, expectancyR: null, bestR: null, worstR: null }
  }
  const sum = rs.reduce((a, b) => a + b, 0)
  const avgR = sum / rs.length
  return {
    avgR,
    rCount: rs.length,
    // Expectancy en R = moyenne (déjà pondérée naturellement par les win/loss)
    expectancyR: avgR,
    bestR: Math.max(...rs),
    worstR: Math.min(...rs),
  }
}
