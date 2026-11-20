// lib/budgetCalculator.js — le calculateur de budget (/app/budget).
//
// À partir de la situation d'une personne (entrées d'argent, charges, crédits,
// épargne, personnes à charge, stabilité des revenus, expérience), il calcule le
// montant MAXIMUM qu'elle peut consacrer chaque mois aux challenges de prop firm,
// selon deux approches :
//   • soft      — la sécurité d'abord : rien tant que l'épargne de précaution
//                 n'est pas à moitié constituée, 10 % du reste à vivre au mieux ;
//   • agressive — 25 % du reste à vivre au mieux, réduite mais pas annulée quand
//                 l'épargne de précaution manque.
//
// Un challenge n'est pas un placement : c'est une DÉPENSE, que la plupart des
// candidats ne récupèrent pas. Le calcul part donc de ce qui reste une fois TOUT
// payé, et il n'entame jamais l'épargne de précaution.
//
// Module PUR, sans dépendance : la page l'affiche, les tests le vérifient. Chaque
// coefficient est rendu dans `factors`, pour que la page montre COMMENT le chiffre
// a été obtenu au lieu d'un montant tombé du ciel.

export const STABILITY = ['stable', 'variable', 'none']
export const EXPERIENCE = ['beginner', 'intermediate', 'funded']
export const BUDGET_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF']

// Mois de dépenses essentielles à garder de côté, selon la stabilité des revenus.
// Un mois de plus par personne à charge (jusqu'à trois).
const SAFETY_MONTHS = { stable: 3, variable: 6, none: 9 }

const PROFILES = {
  soft: { rate: 0.10, oneOffShare: 0.05 },
  aggressive: { rate: 0.25, oneOffShare: 0.15 },
}
const STABILITY_MULT = { stable: 1, variable: 0.75, none: 0.5 }
const EXPERIENCE_MULT = { beginner: 0.8, intermediate: 1, funded: 1.15 }

// Endettement : part des entrées partie en remboursements de crédits. Au-delà de
// 33 %, le seuil que les banques retiennent, l'approche soft ne propose rien.
const DEBT_HIGH = 0.33
const DEBT_WATCH = 0.15

const num = (v) => {
  const n = Number(String(v ?? '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : 0
}
// Arrondi vers le bas au multiple de 5 : un plafond affiché ne doit jamais être
// plus haut que le calcul.
const floor5 = (v) => Math.max(0, Math.floor(v / 5) * 5)

export function emptyAnswers(currency = 'EUR') {
  return { currency, income: '', fixed: '', living: '', debt: '', savings: '', dependents: null, stability: null, experience: null }
}

// Les réponses nettoyées : montants positifs, choix dans leur liste.
export function normalizeAnswers(raw = {}) {
  return {
    currency: BUDGET_CURRENCIES.includes(raw.currency) ? raw.currency : 'EUR',
    income: num(raw.income),
    fixed: num(raw.fixed),
    living: num(raw.living),
    debt: num(raw.debt),
    savings: num(raw.savings),
    dependents: Math.min(3, Math.max(0, Math.floor(Number(raw.dependents) || 0))),
    stability: STABILITY.includes(raw.stability) ? raw.stability : 'variable',
    experience: EXPERIENCE.includes(raw.experience) ? raw.experience : 'beginner',
  }
}

// Le calcul. `opts.avgChallenge` : prix d'un challenge dans la devise du budget
// (la page passe celui des comptes de l'utilisateur, sinon un repère).
// `opts.spentThisMonth` : déjà dépensé ce mois-ci en challenges, même devise.
export function computeBudget(raw, opts = {}) {
  const a = normalizeAnswers(raw)
  const essentials = a.fixed + a.living + a.debt
  const disposable = a.income - essentials
  const safetyMonths = SAFETY_MONTHS[a.stability] + a.dependents
  const safetyTarget = essentials * safetyMonths
  const coverage = safetyTarget > 0 ? Math.min(1, a.savings / safetyTarget) : 1
  const surplusSavings = Math.max(0, a.savings - safetyTarget)
  const debtRatio = a.income > 0 ? a.debt / a.income : 0

  const warnings = []
  let verdict = 'ok'
  if (a.income <= 0) verdict = 'noIncome'
  else if (disposable <= 0) verdict = 'deficit'
  if (verdict === 'ok') {
    if (debtRatio > DEBT_HIGH) warnings.push('debtHigh')
    if (coverage < 1) warnings.push('safetyMissing')
    if (a.experience === 'beginner') warnings.push('beginner')
    if (a.stability === 'none') warnings.push('irregular')
  }

  const dependentsMult = 1 - 0.1 * a.dependents
  const debtMult = (profile) => {
    if (debtRatio > DEBT_HIGH) return profile === 'soft' ? 0 : 0.5
    if (debtRatio > DEBT_WATCH) return 0.8
    return 1
  }
  // Soft : rien tant que la moitié de l'épargne de précaution manque, puis une
  // montée linéaire jusqu'à 100 % quand elle est complète. Agressive : jamais
  // moins de la moitié, mais jamais le plein tant qu'elle n'est pas complète.
  const safetyMult = (profile) => (profile === 'soft' ? Math.max(0, (coverage - 0.5) * 2) : 0.5 + 0.5 * coverage)

  const avg = num(opts.avgChallenge)
  const spent = num(opts.spentThisMonth)

  const build = (profile) => {
    const p = PROFILES[profile]
    const factors = [
      { key: 'rate', value: p.rate },
      { key: 'stability', value: STABILITY_MULT[a.stability] },
      { key: 'dependents', value: dependentsMult },
      { key: 'experience', value: EXPERIENCE_MULT[a.experience] },
      { key: 'debt', value: debtMult(profile) },
      { key: 'safety', value: safetyMult(profile) },
    ]
    if (verdict !== 'ok') {
      return { monthly: 0, oneOff: 0, yearly: 0, challenges: 0, remaining: 0, pauseAfter: 0, factors, share: 0 }
    }
    const share = factors.reduce((m, f) => m * f.value, 1)
    const monthly = floor5(disposable * share)
    // L'enveloppe de départ ne vient QUE de l'épargne au-delà de la précaution.
    const oneOff = floor5(surplusSavings * p.oneOffShare)
    return {
      monthly,
      oneOff,
      yearly: monthly * 12 + oneOff,
      share,
      challenges: avg > 0 ? Math.floor(monthly / avg) : null,
      // Sous le prix d'un challenge, un plafond mensuel ne dit rien d'utilisable :
      // on le traduit en rythme (« 1 challenge tous les 10 mois », en épargnant).
      monthsPerChallenge: avg > 0 && monthly > 0 && monthly < avg ? Math.ceil(avg / monthly) : null,
      remaining: Math.max(0, monthly - spent),
      overspent: Math.max(0, spent - monthly),
      // Règle d'arrêt : trois mois de budget dépensés sans payout, on fait une pause.
      pauseAfter: monthly * 3,
      factors,
    }
  }

  return {
    answers: a,
    verdict,
    essentials,
    disposable,
    safetyMonths,
    safetyTarget,
    safetyMissing: Math.max(0, safetyTarget - a.savings),
    coverage,
    surplusSavings,
    debtRatio,
    warnings,
    soft: build('soft'),
    aggressive: build('aggressive'),
  }
}

// Une question est-elle répondue ? Les montants acceptent 0 (aucun crédit), sauf
// les entrées d'argent ; les choix doivent être faits.
export function isAnswered(key, answers) {
  const v = answers?.[key]
  if (key === 'income') return num(v) > 0
  if (['fixed', 'living', 'debt', 'savings'].includes(key)) return v !== '' && v != null && Number.isFinite(Number(String(v).replace(',', '.'))) && Number(String(v).replace(',', '.')) >= 0
  if (key === 'dependents') return v !== null && v !== undefined && v !== ''
  if (key === 'stability') return STABILITY.includes(v)
  if (key === 'experience') return EXPERIENCE.includes(v)
  return true
}

// Ce qui a déjà été dépensé en challenges pendant le mois de `now`, en EUR. Mêmes
// règles de comptage que les graphiques du dashboard : le prix à l'achat, chaque
// échéance d'un abonnement mensuel, les frais d'activation.
export function spentInMonthEUR(firms, toEUR, rates, now = new Date()) {
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  let total = 0
  for (const f of firms || []) {
    for (const acc of f.accounts || []) {
      const months = acc.payment_mode === 'monthly' ? (acc.months_count || 1) : 1
      for (let m = 0; m < months; m++) {
        const d = new Date(acc.buy_date)
        if (isNaN(d)) break
        d.setMonth(d.getMonth() + m)
        if (d.toISOString().slice(0, 7) === key) total += toEUR(Number(acc.spent) || 0, acc.currency, rates)
      }
      if (acc.activation_fee > 0 && String(acc.activation_date || '').slice(0, 7) === key) {
        total += toEUR(Number(acc.activation_fee) || 0, acc.currency, rates)
      }
    }
  }
  return total
}

// Prix médian d'un challenge chez l'utilisateur, en EUR, ou null sans compte.
// La médiane plutôt que la moyenne : un 300K acheté une fois ne doit pas faire
// croire que chaque challenge coûte 600 €.
export function medianChallengeEUR(firms, toEUR, rates) {
  const prices = []
  for (const f of firms || []) {
    for (const acc of f.accounts || []) {
      const v = toEUR(Number(acc.spent) || 0, acc.currency, rates)
      if (v > 0) prices.push(v)
    }
  }
  if (!prices.length) return null
  prices.sort((x, y) => x - y)
  const mid = Math.floor(prices.length / 2)
  return prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
}
