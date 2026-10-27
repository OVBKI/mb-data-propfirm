// lib/formationSales.js — calculs du suivi des ventes de formation (/admin/formations).
//
// Une VENTE a un prix, un mode (en une fois ou en plusieurs fois), des frais
// divers et un ÉCHÉANCIER : la liste des paiements attendus, chacun avec sa date
// et son montant, marqué payé ou non. Tout le reste en découle : ce qui reste à
// payer, le prochain paiement obligatoire, le retard, le calendrier.
//
// Module PUR, sans dépendance : la page et la route API l'importent toutes les
// deux, et les tests le couvrent sans base de données.
//
// Les montants sont calculés en CENTIMES : 1 000 € en trois fois donne
// 333,33 + 333,33 + 333,34, jamais 999,99 ni 1 000,01.
//
// Les dates sont des chaînes 'YYYY-MM-DD' (colonnes `date` de Postgres) : elles
// se comparent dans l'ordre alphabétique sans passer par un fuseau horaire.

export const toCents = (v) => Math.round((Number(v) || 0) * 100)
export const fromCents = (c) => Math.round(c) / 100

const pad = (n) => String(n).padStart(2, '0')

// Date du jour en heure LOCALE. `toISOString()` donnerait la date UTC : à Paris
// avant 2 h du matin en été, une échéance du jour passerait pour celle de demain.
export function todayLocalISO(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parse(iso) {
  const [y, m, d] = String(iso).split('-').map(Number)
  return { y, m, d }
}

export function isISODate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return false
  const { y, m, d } = parse(v)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

// Ajoute n mois en gardant le jour, ramené au dernier jour du mois s'il n'existe
// pas : le 31 janvier + 1 mois donne le 28 (ou 29) février, pas le 3 mars.
export function addMonths(iso, n) {
  const { y, m, d } = parse(iso)
  const total = (m - 1) + n
  const ty = y + Math.floor(total / 12)
  const tm = ((total % 12) + 12) % 12
  const last = new Date(ty, tm + 1, 0).getDate()
  return `${ty}-${pad(tm + 1)}-${pad(Math.min(d, last))}`
}

export function addDays(iso, n) {
  const { y, m, d } = parse(iso)
  return todayLocalISO(new Date(y, m - 1, d + n))
}

export const FREQUENCIES = [
  { value: 'month', label: 'Tous les mois' },
  { value: '2weeks', label: 'Toutes les 2 semaines' },
  { value: 'week', label: 'Toutes les semaines' },
]

function step(iso, every, i) {
  if (every === 'week') return addDays(iso, 7 * i)
  if (every === '2weeks') return addDays(iso, 14 * i)
  return addMonths(iso, i)
}

// Échéancier régulier : `count` paiements égaux à partir de `firstDate`. Les
// centimes qui ne se répartissent pas vont sur la DERNIÈRE échéance.
// En une fois : count = 1, une seule échéance du montant total.
export function buildSchedule({ total, count = 1, firstDate, every = 'month' }) {
  const n = Math.max(1, Math.floor(Number(count) || 1))
  const cents = toCents(total)
  if (cents <= 0 || !isISODate(firstDate)) return []
  const base = Math.floor(cents / n)
  return Array.from({ length: n }, (_, i) => ({
    due_date: step(firstDate, every, i),
    amount: fromCents(i === n - 1 ? cents - base * (n - 1) : base),
    paid_at: null,
  }))
}

// Frais divers : une liste [{ label, amount }]. Ce sont des COÛTS du vendeur
// (commission de plateforme, frais bancaires, support…) : ils ne s'ajoutent pas
// à ce que le client doit, ils se retranchent de ce que la vente rapporte.
export function feesTotal(fees) {
  return fromCents((Array.isArray(fees) ? fees : []).reduce((s, f) => s + toCents(f?.amount), 0))
}

// Raison pour laquelle une vente ne peut pas être enregistrée, ou null.
export function saleError({ client_name, price, sale_date, fees, installments }) {
  if (!String(client_name || '').trim()) return 'Le nom du client est obligatoire.'
  if (!(toCents(price) > 0)) return 'Le prix vendu doit être supérieur à 0.'
  if (!isISODate(sale_date)) return 'La date de vente est invalide.'
  for (const f of Array.isArray(fees) ? fees : []) {
    if (toCents(f?.amount) < 0) return 'Un frais divers ne peut pas être négatif.'
  }
  const list = Array.isArray(installments) ? installments : []
  if (!list.length) return 'L\'échéancier est vide : ajoute au moins un paiement.'
  for (const it of list) {
    if (!isISODate(it?.due_date)) return 'Une échéance n\'a pas de date valide.'
    if (!(toCents(it?.amount) > 0)) return 'Chaque échéance doit avoir un montant supérieur à 0.'
    if (it?.paid_at != null && it.paid_at !== '' && !isISODate(it.paid_at)) return 'Une date de paiement est invalide.'
  }
  const sum = list.reduce((s, it) => s + toCents(it.amount), 0)
  if (sum !== toCents(price)) {
    return `L'échéancier totalise ${fromCents(sum).toFixed(2)} € pour un prix de ${fromCents(toCents(price)).toFixed(2)} € : les deux doivent être égaux.`
  }
  return null
}

const byDue = (a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0)

export function daysBetween(fromISO, toISO) {
  const a = parse(fromISO)
  const b = parse(toISO)
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000)
}

// Tout ce que le tableau affiche pour une vente.
export function saleSummary(sale, installments, today = todayLocalISO()) {
  const list = [...(installments || [])].sort(byDue)
  const total = toCents(sale?.price)
  const paid = list.filter((i) => i.paid_at).reduce((s, i) => s + toCents(i.amount), 0)
  const unpaid = list.filter((i) => !i.paid_at)
  const overdue = unpaid.filter((i) => i.due_date < today)
  const next = unpaid[0] || null
  const fees = toCents(feesTotal(sale?.fees))
  const remaining = Math.max(0, total - paid)
  const complete = list.length > 0 && remaining === 0
  return {
    total: fromCents(total),
    paid: fromCents(paid),
    remaining: fromCents(remaining),
    fees: fromCents(fees),
    // Ce que la vente rapporte une fois les frais retirés, et ce qui est déjà en poche.
    net: fromCents(total - fees),
    netCollected: fromCents(paid - fees),
    count: list.length,
    paidCount: list.length - unpaid.length,
    complete,
    nextDue: next ? { ...next, overdue: next.due_date < today, daysLeft: daysBetween(today, next.due_date) } : null,
    overdueCount: overdue.length,
    overdueAmount: fromCents(overdue.reduce((s, i) => s + toCents(i.amount), 0)),
    status: complete ? 'complete' : overdue.length ? 'late' : 'ongoing',
  }
}

// Totaux du haut de page, sur toutes les ventes.
export function portfolioTotals(sales, installmentsBySale, today = todayLocalISO()) {
  const sum = { sold: 0, collected: 0, remaining: 0, overdue: 0, fees: 0, net: 0, count: 0, complete: 0, late: 0 }
  for (const s of sales || []) {
    const r = saleSummary(s, installmentsBySale[s.id] || [], today)
    sum.sold += toCents(r.total)
    sum.collected += toCents(r.paid)
    sum.remaining += toCents(r.remaining)
    sum.overdue += toCents(r.overdueAmount)
    sum.fees += toCents(r.fees)
    sum.net += toCents(r.net)
    sum.count += 1
    if (r.status === 'complete') sum.complete += 1
    if (r.status === 'late') sum.late += 1
  }
  for (const k of ['sold', 'collected', 'remaining', 'overdue', 'fees', 'net']) sum[k] = fromCents(sum[k])
  return sum
}

// Les 42 cases (6 semaines, lundi en premier) d'un mois de calendrier.
export function monthGrid(year, month /* 1-12 */) {
  const first = new Date(year, month - 1, 1)
  const offset = (first.getDay() + 6) % 7 // lundi = 0
  const start = todayLocalISO(new Date(year, month - 1, 1 - offset))
  const prefix = `${year}-${pad(month)}`
  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(start, i)
    return { date, inMonth: date.startsWith(prefix) }
  })
}

// Tout ce qui se passe dans le calendrier, indexé par date :
//   • 'sale'        le jour de la vente
//   • 'installment' chaque échéance, à sa date prévue, avec son état
//                   (payée, à venir, en retard)
export function calendarItems(sales, installmentsBySale, today = todayLocalISO()) {
  const out = {}
  const push = (date, item) => { (out[date] ||= []).push(item) }
  for (const s of sales || []) {
    push(s.sale_date, { kind: 'sale', saleId: s.id, client: s.client_name, amount: Number(s.price) || 0 })
    for (const it of installmentsBySale[s.id] || []) {
      const status = it.paid_at ? 'paid' : it.due_date < today ? 'overdue' : 'due'
      push(it.due_date, { kind: 'installment', saleId: s.id, id: it.id, client: s.client_name, amount: Number(it.amount) || 0, status, paid_at: it.paid_at || null })
    }
  }
  return out
}

// Bilan d'un mois ('YYYY-MM') : ce qui était attendu, encaissé, en retard, vendu.
export function monthTotals(items, yyyymm) {
  const t = { expected: 0, collected: 0, overdue: 0, sold: 0 }
  for (const [date, list] of Object.entries(items || {})) {
    if (!date.startsWith(yyyymm)) continue
    for (const it of list) {
      const c = toCents(it.amount)
      if (it.kind === 'sale') { t.sold += c; continue }
      t.expected += c
      if (it.status === 'paid') t.collected += c
      if (it.status === 'overdue') t.overdue += c
    }
  }
  for (const k of Object.keys(t)) t[k] = fromCents(t[k])
  return t
}
