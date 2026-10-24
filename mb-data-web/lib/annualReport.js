// lib/annualReport.js — bilan d'une année civile, en CSV.
//
// Détail de chaque flux de l'année (achat, échéance, activation, payout) puis un
// récapitulatif par firm et par devise. Les montants restent dans la devise du
// compte : convertir au taux du jour fausserait un document qu'on remet à son
// comptable. Mêmes règles de comptage que le dashboard (lib/firmEconomics).
//
// Ce n'est pas un document fiscal : on le dit en tête de fichier.
import { accountCashflows } from './firmEconomics'

const KIND = {
  fr: { purchase: 'Achat', renewal: 'Échéance abonnement', activation: 'Activation', payout: 'Payout' },
  en: { purchase: 'Purchase', renewal: 'Subscription renewal', activation: 'Activation', payout: 'Payout' },
}
const L = {
  fr: {
    title: 'Bilan annuel Quantara',
    disclaimer: 'Récapitulatif établi à partir de ta saisie. Ce n’est pas un document fiscal : vérifie-le avec tes relevés et ton comptable.',
    detail: 'Détail', summary: 'Récapitulatif par firm',
    head: ['Date', 'Firm', 'Compte', 'Type', 'Montant', 'Devise'],
    sumHead: ['Firm', 'Devise', 'Frais payés', 'Payouts reçus', 'Net'],
    total: 'TOTAL',
  },
  en: {
    title: 'Quantara annual report',
    disclaimer: 'Summary built from your own entries. This is not a tax document: check it against your statements and your accountant.',
    detail: 'Detail', summary: 'Summary by firm',
    head: ['Date', 'Firm', 'Account', 'Type', 'Amount', 'Currency'],
    sumHead: ['Firm', 'Currency', 'Fees paid', 'Payouts received', 'Net'],
    total: 'TOTAL',
  },
}

function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const row = (cells) => cells.map(cell).join(',')
const num = (n) => (Math.round(n * 100) / 100).toFixed(2)

// Années pour lesquelles au moins un flux existe, de la plus récente à la plus ancienne.
export function reportYears(firms) {
  const ys = new Set()
  for (const f of firms || []) for (const a of f.accounts || []) for (const c of accountCashflows(a)) {
    if (c.date) ys.add(Number(c.date.slice(0, 4)))
  }
  return [...ys].filter(Boolean).sort((a, b) => b - a)
}

export function annualReport(firms, year, { lang = 'fr', accountName = (a) => a.name || a.label || '' } = {}) {
  const l = L[lang] || L.fr
  const kinds = KIND[lang] || KIND.fr
  const y = String(year)
  const lines = []
  const sums = new Map() // `${firm}|${currency}` → { firm, currency, fees, payouts }
  for (const f of firms || []) {
    for (const a of f.accounts || []) {
      const currency = a.currency || 'USD'
      for (const c of accountCashflows(a)) {
        if (!c.date || c.date.slice(0, 4) !== y) continue
        lines.push({ date: c.date, firm: f.name, account: accountName(a), kind: c.kind, amount: c.amount, currency })
        const k = `${f.name}|${currency}`
        if (!sums.has(k)) sums.set(k, { firm: f.name, currency, fees: 0, payouts: 0 })
        const s = sums.get(k)
        if (c.kind === 'payout') s.payouts += c.amount
        else s.fees += c.amount
      }
    }
  }
  lines.sort((a, b) => a.date.localeCompare(b.date) || a.firm.localeCompare(b.firm))

  const out = [row([`${l.title} ${y}`]), row([l.disclaimer]), '', row([l.detail]), row(l.head)]
  for (const x of lines) {
    const signed = x.kind === 'payout' ? x.amount : -x.amount
    out.push(row([x.date, x.firm, x.account, kinds[x.kind], num(signed), x.currency]))
  }
  out.push('', row([l.summary]), row(l.sumHead))
  const summary = [...sums.values()].sort((a, b) => a.firm.localeCompare(b.firm) || a.currency.localeCompare(b.currency))
  for (const s of summary) out.push(row([s.firm, s.currency, num(s.fees), num(s.payouts), num(s.payouts - s.fees)]))
  // Un total par devise : additionner des dollars et des euros n'a pas de sens.
  const byCur = new Map()
  for (const s of summary) {
    const t = byCur.get(s.currency) || { fees: 0, payouts: 0 }
    t.fees += s.fees; t.payouts += s.payouts
    byCur.set(s.currency, t)
  }
  for (const [cur, t] of byCur) out.push(row([l.total, cur, num(t.fees), num(t.payouts), num(t.payouts - t.fees)]))
  return { csv: out.join('\r\n'), lines, summary }
}
