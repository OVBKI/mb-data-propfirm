// lib/firmEconomics.js — ce que coûte réellement un compte financé, par firm.
//
// Les flux d'un compte suivent les mêmes règles que le bilan annuel et les
// séries mensuelles du dashboard : le prix une fois (ou à chaque échéance d'un
// abonnement mensuel), l'activation à sa date, chaque payout à sa date.
// accountCashflows() est la source unique ; firmEconomics() et le rapport
// annuel (lib/annualReport.js) la lisent tous les deux.

// Un compte compte comme « financé » s'il l'est aujourd'hui, ou s'il l'a été :
// un compte financé puis cramé a quand même passé l'évaluation.
export function wasFunded(account) {
  return account?.status === 'Financé' || !!account?.funded_date
}

// Flux datés d'un compte, dans sa devise. kind : 'purchase' (achat ou première
// échéance), 'renewal' (échéance suivante d'un abonnement), 'activation', 'payout'.
export function accountCashflows(account) {
  const out = []
  const a = account || {}
  const price = Number(a.spent) || 0
  if (price > 0 && a.buy_date) {
    const months = a.payment_mode === 'monthly' ? Math.max(1, Number(a.months_count) || 1) : 1
    for (let m = 0; m < months; m++) {
      const d = new Date(a.buy_date + 'T00:00:00Z')
      d.setUTCMonth(d.getUTCMonth() + m)
      if (isNaN(d)) continue
      out.push({ date: d.toISOString().slice(0, 10), kind: m === 0 ? 'purchase' : 'renewal', amount: price, currency: a.currency })
    }
  }
  if (Number(a.activation_fee) > 0) {
    out.push({ date: a.activation_date || a.funded_date || a.buy_date || null, kind: 'activation', amount: Number(a.activation_fee), currency: a.currency })
  }
  for (const p of a.payouts || []) {
    if (Number(p.amount) > 0) out.push({ date: p.date || null, kind: 'payout', amount: Number(p.amount), currency: a.currency })
  }
  return out
}

const DAY = 86400000

// convert(amount, currency) → montant dans la devise d'affichage commune.
export function firmEconomics(firms, convert = (x) => x) {
  const rows = []
  for (const f of firms || []) {
    const accounts = f.accounts || []
    if (!accounts.length) continue
    let spent = 0, payouts = 0, funded = 0, failed = 0, daysSum = 0, daysN = 0
    for (const a of accounts) {
      for (const c of accountCashflows(a)) {
        const v = convert(c.amount, c.currency)
        if (c.kind === 'payout') payouts += v
        else spent += v
      }
      if (wasFunded(a)) {
        funded++
        if (a.funded_date && a.buy_date) {
          const d = (new Date(a.funded_date) - new Date(a.buy_date)) / DAY
          if (isFinite(d) && d >= 0) { daysSum += d; daysN++ }
        }
      } else if (a.status === 'Échoué') {
        failed++
      }
    }
    // Taux de réussite sur les évaluations TERMINÉES : un challenge en cours
    // n'est ni réussi ni raté.
    const settled = funded + failed
    rows.push({
      firmId: f.id,
      firm: f.name,
      accounts: accounts.length,
      funded,
      failed,
      passRate: settled ? funded / settled : null,
      spent,
      payouts,
      net: payouts - spent,
      costPerFunded: funded ? spent / funded : null,
      avgDaysToFunded: daysN ? daysSum / daysN : null,
    })
  }
  return rows.sort((x, y) => (x.costPerFunded ?? Infinity) - (y.costPerFunded ?? Infinity))
}
