'use client'
// Admin — ventes de formation : qui a acheté, à quel prix, comment il paie, ce
// qu'il reste à encaisser, les frais, et un calendrier qui résume tout.
//
// Données : /api/admin/formations (service role). Calculs : lib/formationSales.js,
// partagés avec la route qui revalide tout avant d'écrire.

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { C, cardStyle, panelStyle, btnPrimary, btnGhost, inputStyle, labelStyle } from '../../../lib/theme'
import Skeleton from '../../../components/Skeleton'
import {
  buildSchedule, feesTotal, saleError, saleSummary, portfolioTotals, monthGrid,
  calendarItems, monthTotals, todayLocalISO, toCents, fromCents, FREQUENCIES,
} from '../../../lib/formationSales'

async function adminFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Non authentifié')
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const money = (v) => eur.format(Number(v) || 0)
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDay = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return dayFmt.format(new Date(y, m - 1, d))
}
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

const STATUS = {
  complete: { label: 'Payée', fg: 'var(--green)', bg: 'var(--green-bg)' },
  ongoing:  { label: 'En cours', fg: 'var(--blue-light)', bg: 'var(--blue-bg)' },
  late:     { label: 'En retard', fg: 'var(--red)', bg: 'var(--red-bg)' },
}
const CHIP = {
  paid:    { fg: 'var(--green)', bg: 'var(--green-bg)', label: 'payé' },
  due:     { fg: 'var(--blue-light)', bg: 'var(--blue-bg)', label: 'à venir' },
  overdue: { fg: 'var(--red)', bg: 'var(--red-bg)', label: 'en retard' },
  sale:    { fg: 'var(--amber)', bg: 'var(--amber-bg)', label: 'vente' },
}
const FILTERS = [
  { id: 'all', label: 'Toutes' },
  { id: 'ongoing', label: 'En cours' },
  { id: 'late', label: 'En retard' },
  { id: 'complete', label: 'Payées' },
]

const pill = (s) => ({
  display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
  color: s.fg, background: s.bg, whiteSpace: 'nowrap',
})
const smallBtn = { ...btnGhost, padding: '6px 10px', fontSize: 11.5, minHeight: 32 }
const iconBtn = { ...smallBtn, minWidth: 32, padding: '6px 0', fontSize: 13 }
const th = {
  textAlign: 'left', fontSize: 10.5, fontWeight: 600, color: C.text3, textTransform: 'uppercase',
  letterSpacing: '0.08em', padding: '10px 9px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
}
const td = { padding: '12px 9px', borderBottom: `1px solid ${C.border}`, fontSize: 13, verticalAlign: 'top' }
const num = { fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }

function emptyForm() {
  const today = todayLocalISO()
  return {
    id: null, client_name: '', client_email: '', formation: '', sale_date: today,
    price: '', payment_mode: 'once', count: 3, first_date: today, every: 'month',
    installments: [], fees: [], note: '',
  }
}

// Régénère les échéances NON payées en gardant celles déjà encaissées : modifier
// le prix ou le nombre de paiements d'une vente en cours ne doit jamais effacer
// un paiement reçu.
function regenerate(form) {
  const paid = form.installments.filter((i) => i.paid_at)
  const paidCents = paid.reduce((s, i) => s + toCents(i.amount), 0)
  const restCents = toCents(form.price) - paidCents
  if (restCents <= 0) return paid
  const count = form.payment_mode === 'once' ? 1 : Math.max(1, Number(form.count) - paid.length)
  const fresh = buildSchedule({ total: fromCents(restCents), count, firstDate: form.first_date, every: form.every })
  return [...paid, ...fresh]
}

export default function AdminFormationsPage() {
  const [sales, setSales] = useState([])
  const [installments, setInstallments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(() => new Set())
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(null)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() + 1 }
  })

  const load = useCallback(async () => {
    setError('')
    try {
      const json = await adminFetch('/api/admin/formations')
      setSales(json.sales || [])
      setInstallments(json.installments || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const today = todayLocalISO()
  const bySale = useMemo(() => {
    const m = {}
    for (const i of installments) (m[i.sale_id] ||= []).push(i)
    return m
  }, [installments])
  const rows = useMemo(() => sales.map((s) => ({ sale: s, sum: saleSummary(s, bySale[s.id] || [], today) })), [sales, bySale, today])
  const totals = useMemo(() => portfolioTotals(sales, bySale, today), [sales, bySale, today])
  const visible = rows.filter(({ sale, sum }) => {
    if (filter !== 'all' && sum.status !== filter) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [sale.client_name, sale.client_email, sale.formation].some((v) => String(v || '').toLowerCase().includes(q))
  })

  const items = useMemo(() => calendarItems(sales, bySale, today), [sales, bySale, today])
  const yyyymm = `${cursor.y}-${String(cursor.m).padStart(2, '0')}`
  const month = monthTotals(items, yyyymm)
  const grid = monthGrid(cursor.y, cursor.m)
  const moveMonth = (n) => setCursor(({ y, m }) => {
    const t = (m - 1) + n
    return { y: y + Math.floor(t / 12), m: (((t % 12) + 12) % 12) + 1 }
  })

  function toggleOpen(id) {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function focusSale(id) {
    setFilter('all')
    setQuery('')
    setOpen((prev) => new Set(prev).add(id))
    requestAnimationFrame(() => document.getElementById(`sale-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  async function setPaid(inst, paidAt) {
    setBusy(inst.id)
    try {
      await adminFetch('/api/admin/formations', { method: 'PATCH', body: JSON.stringify({ installment_id: inst.id, paid_at: paidAt }) })
      setInstallments((list) => list.map((i) => (i.id === inst.id ? { ...i, paid_at: paidAt } : i)))
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setBusy(null)
  }

  async function remove(sale) {
    if (!confirm(`Supprimer la vente de ${sale.client_name} et tout son échéancier ?`)) return
    try {
      await adminFetch(`/api/admin/formations?id=${sale.id}`, { method: 'DELETE' })
      load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
  }

  function openNew() {
    setForm(emptyForm())
  }
  function openEdit(sale) {
    const list = [...(bySale[sale.id] || [])].sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    const firstUnpaid = list.find((i) => !i.paid_at)
    setForm({
      id: sale.id,
      client_name: sale.client_name || '',
      client_email: sale.client_email || '',
      formation: sale.formation || '',
      sale_date: sale.sale_date,
      price: String(sale.price),
      payment_mode: sale.payment_mode,
      count: Math.max(list.length, sale.payment_mode === 'once' ? 1 : 2),
      first_date: firstUnpaid?.due_date || list[0]?.due_date || sale.sale_date,
      every: 'month',
      installments: list.map((i) => ({ id: i.id, due_date: i.due_date, amount: Number(i.amount), paid_at: i.paid_at })),
      fees: (sale.fees || []).map((f) => ({ label: f.label || '', amount: f.amount })),
      note: sale.note || '',
    })
  }

  // Les champs qui définissent l'échéancier le recalculent ; le reste non.
  function change(patch) {
    setForm((f) => {
      const next = { ...f, ...patch }
      if (patch.sale_date && !f.id && f.first_date === f.sale_date) next.first_date = patch.sale_date
      const shaping = ['price', 'payment_mode', 'count', 'first_date', 'every', 'sale_date'].some((k) => k in patch)
      if (shaping) next.installments = regenerate(next)
      return next
    })
  }
  const setRow = (idx, patch) => setForm((f) => ({ ...f, installments: f.installments.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }))
  const setFee = (idx, patch) => setForm((f) => ({ ...f, fees: f.fees.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }))

  const formError = form ? saleError({ ...form, installments: form.installments }) : null
  const scheduleSum = form ? fromCents(form.installments.reduce((s, i) => s + toCents(i.amount), 0)) : 0

  async function save() {
    if (formError) return
    setSaving(true)
    const payload = {
      id: form.id,
      client_name: form.client_name,
      client_email: form.client_email,
      formation: form.formation,
      sale_date: form.sale_date,
      price: Number(form.price),
      payment_mode: form.installments.length > 1 ? 'installments' : 'once',
      fees: form.fees,
      note: form.note,
      installments: form.installments,
    }
    try {
      await adminFetch('/api/admin/formations', { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      setForm(null)
      load()
    } catch (err) {
      alert('Erreur : ' + err.message)
    }
    setSaving(false)
  }

  const tiles = [
    { label: 'Vendu', value: money(totals.sold), hint: `${totals.count} vente${totals.count > 1 ? 's' : ''}` },
    { label: 'Encaissé', value: money(totals.collected), hint: `${totals.complete} payée${totals.complete > 1 ? 's' : ''} en totalité`, tone: 'var(--green)' },
    { label: 'Reste à encaisser', value: money(totals.remaining), hint: 'échéances non payées' },
    { label: 'En retard', value: money(totals.overdue), hint: `${totals.late} client${totals.late > 1 ? 's' : ''} concerné${totals.late > 1 ? 's' : ''}`, tone: totals.overdue > 0 ? 'var(--red)' : undefined },
    { label: 'Frais divers', value: money(totals.fees), hint: 'commissions, frais, support' },
    { label: 'Net', value: money(totals.net), hint: 'vendu moins les frais' },
  ]

  return (
    <div style={{ padding: '32px clamp(16px, 3vw, 32px)' }}>
      <div style={{ fontSize: 11, color: 'var(--red)', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Ventes de formation</h1>
        <button onClick={openNew} style={{ ...btnPrimary, minHeight: 36 }}>+ Nouvelle vente</button>
      </div>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22, maxWidth: 680 }}>
        Chaque vente a son échéancier : les paiements attendus, leur date et leur montant.
        Coche un paiement à sa réception ; le reste à payer, le prochain paiement obligatoire et le calendrier se mettent à jour.
      </p>

      {error && (
        <div style={{ padding: 16, marginBottom: 20, background: 'var(--red-bg)', border: `1px solid ${C.red}`, borderRadius: 10, fontSize: 13, color: C.red }}>
          {error}
        </div>
      )}

      {/* Résumé */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ ...cardStyle, padding: '14px 16px' }}>
            <div style={{ ...labelStyle, marginBottom: 8 }}>{t.label}</div>
            {loading ? <Skeleton width={110} height={22} /> : (
              <div style={{ ...num, fontSize: 20, fontWeight: 700, color: t.tone || C.text }}>{t.value}</div>
            )}
            <div style={{ fontSize: 11.5, color: C.text3, marginTop: 4 }}>{t.hint}</div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div style={{ ...cardStyle, padding: 0, marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div role="group" aria-label="Filtrer les ventes" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} style={{
                ...smallBtn,
                color: filter === f.id ? C.text : C.text2,
                fontWeight: filter === f.id ? 600 : 500,
                background: filter === f.id ? 'var(--tint2)' : 'var(--tint1)',
              }}>{f.label}</button>
            ))}
          </div>
          <input id="formation-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Chercher un client, une formation…" aria-label="Chercher une vente"
            style={{ ...inputStyle, width: 260, maxWidth: '100%', padding: '8px 12px' }} />
        </div>

        {loading ? (
          <div style={{ padding: 16 }}><Skeleton.Table rows={4} /></div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: C.text3, fontSize: 14 }}>
            Aucune vente enregistrée.
            <div><button onClick={openNew} style={{ ...btnPrimary, marginTop: 14 }}>+ Enregistrer la première vente</button></div>
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: C.text3, fontSize: 13 }}>Aucune vente ne correspond à ce filtre.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Client</th>
                  <th style={th}>Prix vendu</th>
                  <th style={th}>Prochain paiement obligatoire</th>
                  <th style={th}>Paiement</th>
                  <th style={th}>Reste à payer</th>
                  <th style={th}>Paiement complet</th>
                  <th style={th}>Frais divers</th>
                  <th style={{ ...th, textAlign: 'right' }}><span style={srOnly}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ sale, sum }) => {
                  const isOpen = open.has(sale.id)
                  const list = [...(bySale[sale.id] || [])].sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
                  const next = sum.nextDue
                  return (
                    <Fragment key={sale.id}>
                      <tr id={`sale-${sale.id}`}>
                        <td style={{ ...td, maxWidth: 190, overflowWrap: 'anywhere' }}>
                          <div style={{ fontWeight: 600 }}>{sale.client_name}</div>
                          <div style={{ fontSize: 11.5, color: C.text3, marginTop: 2 }}>
                            {[sale.formation, sale.client_email].filter(Boolean).join(' · ') || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Vendue le {fmtDay(sale.sale_date)}</div>
                        </td>
                        <td style={{ ...td, ...num, fontWeight: 600 }}>{money(sum.total)}</td>
                        <td style={td}>
                          {next ? (
                            <>
                              <div style={{ ...num, fontWeight: 600, color: next.overdue ? C.red : C.text }}>{money(next.amount)}</div>
                              <div style={{ fontSize: 11.5, color: next.overdue ? C.red : C.text3, marginTop: 2 }}>
                                {fmtDay(next.due_date)} · {next.overdue ? `en retard de ${-next.daysLeft} j` : next.daysLeft === 0 ? 'aujourd\'hui' : `dans ${next.daysLeft} j`}
                              </div>
                            </>
                          ) : <span style={{ color: C.text3 }}>Plus rien à payer</span>}
                        </td>
                        <td style={td}>
                          <div style={{ whiteSpace: 'nowrap' }}>{sum.count > 1 ? `En ${sum.count} fois` : 'En une fois'}</div>
                          <div style={{ fontSize: 11.5, color: C.text3, marginTop: 2 }}>{sum.paidCount}/{sum.count} payé{sum.paidCount > 1 ? 's' : ''}</div>
                        </td>
                        <td style={{ ...td, ...num, fontWeight: 600, color: sum.remaining > 0 ? C.text : C.text3 }}>{money(sum.remaining)}</td>
                        <td style={td}>
                          <span style={pill(STATUS[sum.status])}>{sum.status === 'complete' ? '✓ Oui' : STATUS[sum.status].label}</span>
                        </td>
                        <td style={td} title={(sale.fees || []).map((f) => `${f.label || 'Frais'} : ${money(f.amount)}`).join('\n')}>
                          <div style={num}>{money(sum.fees)}</div>
                          {(sale.fees || []).length > 0 && (
                            <div style={{ fontSize: 11.5, color: C.text3, marginTop: 2, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {(sale.fees || []).map((f) => f.label || 'Frais').join(', ')}
                            </div>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'nowrap' }}>
                            {next && (
                              <button onClick={() => setPaid(next, today)} disabled={busy === next.id} style={{ ...smallBtn, color: C.text, fontWeight: 600, whiteSpace: 'nowrap' }}
                                title={`Marquer ${money(next.amount)} comme payé aujourd'hui`}>
                                Encaisser
                              </button>
                            )}
                            <button onClick={() => toggleOpen(sale.id)} aria-expanded={isOpen} aria-label={`Échéancier de ${sale.client_name}`} title="Voir l'échéancier" style={iconBtn}>
                              {isOpen ? '▴' : '▾'}
                            </button>
                            <button onClick={() => openEdit(sale)} aria-label={`Modifier la vente de ${sale.client_name}`} title="Modifier" style={iconBtn}>✎</button>
                            <button onClick={() => remove(sale)} aria-label={`Supprimer la vente de ${sale.client_name}`} title="Supprimer" style={{ ...iconBtn, color: C.red }}>✕</button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={8} style={{ ...td, background: 'var(--tint1)', padding: '12px 16px 16px' }}>
                            <div style={{ display: 'grid', gap: 6, maxWidth: 640 }}>
                              {list.map((i, k) => {
                                const st = i.paid_at ? 'paid' : i.due_date < today ? 'overdue' : 'due'
                                return (
                                  <div key={i.id} style={{ display: 'grid', gridTemplateColumns: '28px 130px 110px 1fr auto', gap: 10, alignItems: 'center', fontSize: 12.5 }}>
                                    <span style={{ color: C.text3, ...num }}>{k + 1}.</span>
                                    <span style={num}>{fmtDay(i.due_date)}</span>
                                    <span style={{ ...num, fontWeight: 600 }}>{money(i.amount)}</span>
                                    <span><span style={pill(CHIP[st])}>{i.paid_at ? `payé le ${fmtDay(i.paid_at)}` : CHIP[st].label}</span></span>
                                    <button onClick={() => setPaid(i, i.paid_at ? null : today)} disabled={busy === i.id} style={smallBtn}>
                                      {i.paid_at ? 'Annuler' : 'Marquer payé'}
                                    </button>
                                  </div>
                                )
                              })}
                              {sale.note && <div style={{ fontSize: 12, color: C.text2, marginTop: 6 }}>Note : {sale.note}</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Calendrier */}
      <div style={{ ...cardStyle, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => moveMonth(-1)} aria-label="Mois précédent" style={{ ...smallBtn, minWidth: 32 }}>‹</button>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>
              {monthFmt.format(new Date(cursor.y, cursor.m - 1, 1))}
            </h2>
            <button onClick={() => moveMonth(1)} aria-label="Mois suivant" style={{ ...smallBtn, minWidth: 32 }}>›</button>
            <button onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 }) }} style={smallBtn}>Aujourd&apos;hui</button>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: C.text2 }}>
            <span>Vendu <strong style={{ ...num, color: C.text }}>{money(month.sold)}</strong></span>
            <span>Attendu <strong style={{ ...num, color: C.text }}>{money(month.expected)}</strong></span>
            <span>Encaissé <strong style={{ ...num, color: 'var(--green)' }}>{money(month.collected)}</strong></span>
            <span>En retard <strong style={{ ...num, color: month.overdue > 0 ? C.red : C.text }}>{money(month.overdue)}</strong></span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 700 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                <div key={d} style={{ ...labelStyle, marginBottom: 0, textAlign: 'center' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {grid.map(({ date, inMonth }) => {
                const list = items[date] || []
                const isToday = date === today
                return (
                  <div key={date} style={{
                    minHeight: 92, padding: 6, borderRadius: 8,
                    background: inMonth ? 'var(--tint1)' : 'transparent',
                    border: `1px solid ${isToday ? 'var(--blue)' : C.border}`,
                    opacity: inMonth ? 1 : 0.45,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--blue-light)' : C.text3, marginBottom: 4, ...num }}>
                      {Number(date.slice(8))}
                    </div>
                    <div style={{ display: 'grid', gap: 3 }}>
                      {list.map((it, k) => {
                        const s = CHIP[it.kind === 'sale' ? 'sale' : it.status]
                        return (
                          <button key={k} onClick={() => focusSale(it.saleId)}
                            title={`${it.kind === 'sale' ? 'Vente' : `Échéance ${s.label}`} · ${it.client} · ${money(it.amount)}`}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                              fontFamily: 'inherit', fontSize: 10.5, lineHeight: 1.3, padding: '3px 5px', borderRadius: 5,
                              color: s.fg, background: s.bg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                            {it.kind === 'sale' ? '★ ' : ''}{it.client} · <span style={num}>{money(it.amount)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12, fontSize: 11.5, color: C.text3 }}>
          {[['sale', '★ Vente'], ['paid', 'Échéance payée'], ['due', 'Échéance à venir'], ['overdue', 'Échéance en retard']].map(([k, l]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: CHIP[k].bg, border: `1px solid ${CHIP[k].fg}` }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Modale vente */}
      {form && (
        <div onClick={() => !saving && setForm(null)} style={{
          position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="formation-modal-title" onClick={(e) => e.stopPropagation()} style={{
            ...panelStyle, padding: 24, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto',
          }}>
            <h3 id="formation-modal-title" style={{ fontSize: 18, fontWeight: 700, margin: '0 0 18px' }}>
              {form.id ? `Modifier la vente de ${form.client_name || 'ce client'}` : 'Nouvelle vente'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label htmlFor="f-client" style={labelStyle}>Client *</label>
                <input id="f-client" value={form.client_name} onChange={(e) => change({ client_name: e.target.value })} style={inputStyle} autoFocus />
              </div>
              <div>
                <label htmlFor="f-email" style={labelStyle}>E-mail</label>
                <input id="f-email" type="email" value={form.client_email} onChange={(e) => change({ client_email: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="f-formation" style={labelStyle}>Formation</label>
                <input id="f-formation" value={form.formation} onChange={(e) => change({ formation: e.target.value })} placeholder="Ex : Formation futures 8 semaines" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="f-date" style={labelStyle}>Date de vente *</label>
                <input id="f-date" type="date" value={form.sale_date} onChange={(e) => change({ sale_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="f-price" style={labelStyle}>Prix vendu (€) *</label>
                <input id="f-price" type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={(e) => change({ price: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {/* Mode de paiement */}
            <div style={{ ...labelStyle, marginTop: 6 }}>Paiement</div>
            <div role="radiogroup" aria-label="Mode de paiement" style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {[['once', 'En une fois'], ['installments', 'En plusieurs fois']].map(([v, l]) => (
                <button key={v} role="radio" aria-checked={form.payment_mode === v} onClick={() => change({ payment_mode: v })} style={{
                  ...smallBtn, padding: '8px 14px', fontSize: 12.5,
                  color: form.payment_mode === v ? C.text : C.text2, fontWeight: form.payment_mode === v ? 600 : 500,
                  background: form.payment_mode === v ? 'var(--tint2)' : 'var(--tint1)',
                  borderColor: form.payment_mode === v ? 'var(--blue)' : 'var(--hairline)',
                }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
              {form.payment_mode === 'installments' && (
                <div>
                  <label htmlFor="f-count" style={labelStyle}>Nombre de paiements</label>
                  <input id="f-count" type="number" min="2" max="36" value={form.count} onChange={(e) => change({ count: Math.min(36, Math.max(2, Number(e.target.value) || 2)) })} style={inputStyle} />
                </div>
              )}
              <div>
                <label htmlFor="f-first" style={labelStyle}>{form.payment_mode === 'once' ? 'Date du paiement' : '1ʳᵉ échéance'}</label>
                <input id="f-first" type="date" value={form.first_date} onChange={(e) => change({ first_date: e.target.value })} style={inputStyle} />
              </div>
              {form.payment_mode === 'installments' && (
                <div>
                  <label htmlFor="f-every" style={labelStyle}>Périodicité</label>
                  <select id="f-every" value={form.every} onChange={(e) => change({ every: e.target.value })} style={inputStyle}>
                    {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Échéancier */}
            <div style={{ ...labelStyle, marginTop: 6 }}>Échéancier</div>
            <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
              {form.installments.length === 0 && (
                <div style={{ fontSize: 12.5, color: C.text3 }}>Renseigne le prix pour générer l&apos;échéancier.</div>
              )}
              {form.installments.map((r, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto 32px', gap: 6, alignItems: 'center' }}>
                  <input type="date" aria-label={`Date de l'échéance ${idx + 1}`} value={r.due_date} onChange={(e) => setRow(idx, { due_date: e.target.value })} style={{ ...inputStyle, padding: '8px 10px' }} />
                  <input type="number" min="0" step="0.01" aria-label={`Montant de l'échéance ${idx + 1}`} value={r.amount} onChange={(e) => setRow(idx, { amount: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', ...num }} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.text2, whiteSpace: 'nowrap', minHeight: 32 }}>
                    <input type="checkbox" checked={!!r.paid_at} onChange={(e) => setRow(idx, { paid_at: e.target.checked ? today : null })} />
                    {r.paid_at ? (
                      <input type="date" aria-label={`Payée le (échéance ${idx + 1})`} value={r.paid_at} onChange={(e) => setRow(idx, { paid_at: e.target.value || null })} style={{ ...inputStyle, padding: '6px 8px', width: 140 }} />
                    ) : 'Payée'}
                  </label>
                  <button onClick={() => setForm((f) => ({ ...f, installments: f.installments.filter((_, i) => i !== idx) }))}
                    aria-label={`Retirer l'échéance ${idx + 1}`} style={{ ...smallBtn, minWidth: 32, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={() => setForm((f) => ({
                ...f, payment_mode: 'installments',
                installments: [...f.installments, { due_date: f.installments.at(-1)?.due_date || f.first_date, amount: 0, paid_at: null }],
              }))} style={smallBtn}>+ Ajouter une échéance</button>
              <span style={{ fontSize: 12, ...num, color: toCents(scheduleSum) === toCents(form.price) ? C.text3 : C.red }}>
                Total échéancier {money(scheduleSum)} / prix {money(form.price)}
              </span>
            </div>

            {/* Frais divers */}
            <div style={{ ...labelStyle, marginTop: 6 }}>Frais divers</div>
            <p style={{ fontSize: 11.5, color: C.text3, margin: '0 0 8px' }}>Ce que la vente t&apos;a coûté : commission de plateforme, frais bancaires, affiliation… Ils sont retirés du net, pas ajoutés au prix du client.</p>
            <div style={{ display: 'grid', gap: 6, marginBottom: 8 }}>
              {form.fees.map((f, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 32px', gap: 6 }}>
                  <input aria-label={`Libellé du frais ${idx + 1}`} value={f.label} placeholder="Ex : Commission Stripe" onChange={(e) => setFee(idx, { label: e.target.value })} style={{ ...inputStyle, padding: '8px 10px' }} />
                  <input type="number" min="0" step="0.01" aria-label={`Montant du frais ${idx + 1}`} value={f.amount} onChange={(e) => setFee(idx, { amount: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', ...num }} />
                  <button onClick={() => setForm((x) => ({ ...x, fees: x.fees.filter((_, i) => i !== idx) }))} aria-label={`Retirer le frais ${idx + 1}`} style={{ ...smallBtn, minWidth: 32, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <button onClick={() => setForm((f) => ({ ...f, fees: [...f.fees, { label: '', amount: '' }] }))} style={smallBtn}>+ Ajouter un frais</button>
              <span style={{ fontSize: 12, color: C.text3, ...num }}>
                Frais {money(feesTotal(form.fees))} · net {money(fromCents(toCents(form.price) - toCents(feesTotal(form.fees))))}
              </span>
            </div>

            <label htmlFor="f-note" style={labelStyle}>Note</label>
            <textarea id="f-note" rows={2} value={form.note} onChange={(e) => change({ note: e.target.value })} style={{ ...inputStyle, resize: 'vertical', marginBottom: 14 }} />

            {formError && (form.client_name || form.price) && (
              <div role="alert" style={{ fontSize: 12.5, color: C.red, marginBottom: 12 }}>{formError}</div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setForm(null)} disabled={saving} style={btnGhost}>Annuler</button>
              <button onClick={save} disabled={saving || !!formError} style={{ ...btnPrimary, opacity: formError ? 0.5 : 1, cursor: formError ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Enregistrement…' : form.id ? 'Enregistrer' : 'Créer la vente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
