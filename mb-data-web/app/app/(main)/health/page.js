'use client'
// /app/health — Health Center : Drawdown Health + Consistency Monitor + Payout Pipeline.
// Centralized data loading : 1 query for ALL trades, compute per-account stats once,
// pass to the 3 child components.

import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../AppContext'
import { supabase } from '../../../../lib/supabase'
import { planSizeNum, maxDrawdown } from '../../../../lib/constants'
import DrawdownHealthCard from '../../../../components/health/DrawdownHealthCard'
import ConsistencyMonitor from '../../../../components/health/ConsistencyMonitor'
import PayoutPipeline from '../../../../components/health/PayoutPipeline'
import CfdDrawdownCard from '../../../../components/health/CfdDrawdownCard'
import { useT } from '../../../../components/LanguageProvider'

const C = {
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
}

// Compute per-account derived stats from trades (journal_entries).
// Returns: { [accountId]: { balance, peakBalance, totalPnl, bestDayAmount,
//                          totalProfit, daysCount, winningDaysCount } }
function computeStatsByAccount(trades, accountsById) {
  // Group PnL by account → by day
  const byAcct = {}
  for (const t of trades) {
    const acctId = t.account_id
    if (!acctId) continue
    const acct = accountsById[acctId]
    if (!acct) continue
    // Exclude trades before funded_date (for Funded accounts)
    if (acct.funded_date && t.date && t.date < acct.funded_date) continue
    const day = (t.date || '').slice(0, 10)
    if (!day) continue
    const pnl = Number(t.pnl) || 0
    if (!byAcct[acctId]) byAcct[acctId] = { byDay: {}, totalPnl: 0 }
    byAcct[acctId].byDay[day] = (byAcct[acctId].byDay[day] || 0) + pnl
    byAcct[acctId].totalPnl += pnl
  }

  // For each account, compute balance (initial + cumulative pnl), peak EOD balance,
  // best winning day, total profit (sum of winning days only? OR net total?)
  const stats = {}
  for (const [acctId, data] of Object.entries(byAcct)) {
    const acct = accountsById[acctId]
    const initialBalance = planSizeNum(acct.plan_size) || 0

    // Sort days chronologically + compute cumulative balance per day
    const days = Object.entries(data.byDay).sort((a, b) => a[0].localeCompare(b[0]))
    let cum = initialBalance
    let peak = initialBalance
    for (const [_, dayPnl] of days) {
      cum += dayPnl
      if (cum > peak) peak = cum
    }

    // Best winning day
    let bestDayAmount = 0
    let bestDayDate = ''
    for (const [d, p] of days) {
      if (p > bestDayAmount) { bestDayAmount = p; bestDayDate = d }
    }

    // Somme des jours GAGNANTS (dénominateur consistency, règle Topstep/Apex).
    const winningDaysProfit = days.reduce((s, [_, p]) => s + (p > 0 ? p : 0), 0)

    stats[acctId] = {
      balance: cum,
      peakBalance: peak,
      totalPnl: data.totalPnl,
      bestDayAmount,
      bestDayDate,
      daysCount: days.length,
      winningDaysCount: days.filter(([_, p]) => p > 0).length,
      winningDaysProfit,
    }
  }

  // Fallback for accounts WITH no trades : still provide initial balance
  for (const a of Object.values(accountsById)) {
    if (stats[a.id]) continue
    const init = planSizeNum(a.plan_size) || 0
    stats[a.id] = {
      balance: init,
      peakBalance: init,
      totalPnl: 0,
      bestDayAmount: 0,
      bestDayDate: '',
      daysCount: 0,
      winningDaysCount: 0,
      winningDaysProfit: 0,
    }
  }
  return stats
}

// Compute drawdown floor per account based on dd_type + firm rules.
// - static : floor = initial - maxDD
// - eod    : floor moves with peak EOD high, then locks at initial (Topstep-style)
// - trailing : floor = peak - maxDD (no cap), tick-by-tick (we approximate with EOD peak)
function computeDdFloor(account, firmName, peakBalance) {
  const initial = planSizeNum(account.plan_size) || 0
  // `account.program` = le programme choisi par le trader. Sans lui, on servait
  // le drawdown du programme principal de la firme, faux d'un quart à la moitié
  // pour qui tient un compte Apex legacy ou un FundedNext Rapid.
  const maxDD = maxDrawdown(firmName, account.plan_size, account.program)
  if (!maxDD || !initial) return null

  const ddType = (account.dd_type || 'static').toLowerCase()
  if (ddType === 'static') {
    return initial - maxDD
  }
  if (ddType === 'eod') {
    // Trailing with lock at starting balance
    const peakOrInitial = Math.max(peakBalance, initial)
    return Math.min(peakOrInitial - maxDD, initial)
  }
  // 'trailing' or unknown : pure trailing, no lock
  return Math.max(peakBalance, initial) - maxDD
}

export default function HealthPage() {
  const { firms, user, marketMode, reload, showToast } = useApp()
  const t = useT()
  const [trades, setTrades] = useState([])
  const [tradesLoading, setTradesLoading] = useState(true)
  const [tradesError, setTradesError] = useState(null)

  // Load all trades once with the authenticated supabase client
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) { setTradesLoading(false); return }
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('id, account_id, date, pnl')
          .eq('user_id', user.id)
        if (cancelled) return
        if (error) { setTradesError(error.message || 'Erreur chargement trades'); setTrades([]) }
        else setTrades(data || [])
      } catch (e) {
        if (!cancelled) setTradesError(e.message || 'Erreur réseau')
      } finally {
        if (!cancelled) setTradesLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  // Build lookups
  const monitoredAccounts = useMemo(() => {
    const list = []
    for (const f of (firms || [])) {
      for (const a of (f.accounts || [])) {
        if (a.status === 'Échoué') continue
        list.push({ ...a, firmName: f.name })
      }
    }
    return list
  }, [firms])

  const accountsById = useMemo(() => {
    const map = {}
    for (const a of monitoredAccounts) map[a.id] = a
    return map
  }, [monitoredAccounts])

  // CFD accounts: flatten firms → accounts, attach firmName. In CFD mode the AppContext
  // already scopes `firms` to market='cfd', so this is just a flatten (gauges use stored
  // balance, not trades — no trades-stats computation required for the CFD branch).
  const cfdAccounts = useMemo(() => {
    const list = []
    for (const f of (firms || [])) {
      for (const acc of (f.accounts || [])) {
        list.push({ ...acc, firmName: f.name })
      }
    }
    return list
  }, [firms])

  // Compute per-account stats from trades
  const statsByAccount = useMemo(() => computeStatsByAccount(trades, accountsById), [trades, accountsById])

  // Enrich accounts with computed balance + dd_floor + stats
  const enrichedAccounts = useMemo(() => {
    return monitoredAccounts.map((a) => {
      const s = statsByAccount[a.id] || {}
      const computedBalance = s.balance
      // Prefer manually-set balance, else use computed from trades
      const balance = a.balance != null ? Number(a.balance) : computedBalance
      const peakBalance = Math.max(s.peakBalance || 0, balance || 0)
      const computedDdFloor = computeDdFloor(a, a.firmName, peakBalance)
      const ddFloor = a.dd_floor != null ? Number(a.dd_floor) : computedDdFloor
      return {
        ...a,
        balance,
        dd_floor: ddFloor,
        _computed: {
          totalPnl: s.totalPnl || 0,
          bestDayAmount: s.bestDayAmount || 0,
          daysCount: s.daysCount || 0,
        },
      }
    })
  }, [monitoredAccounts, statsByAccount])

  // Summary stats — % is calculated against the firm's max drawdown allowance,
  // NOT against total balance. Example: 50K plan / $2K maxDD, balance at $50K
  // → room $2K / maxDD $2K = 100% (safe), not $2K / $50K = 4% (which was wrong).
  const summary = useMemo(() => {
    let safe = 0, caution = 0, danger = 0, noData = 0
    for (const a of enrichedAccounts) {
      if (a.balance == null || a.dd_floor == null) { noData++; continue }
      const maxDD = maxDrawdown(a.firmName, a.plan_size, a.program)
      if (!maxDD || maxDD <= 0) { noData++; continue }
      const room = Math.max(0, a.balance - a.dd_floor)
      const pct = Math.min(1, room / maxDD)
      if (pct >= 0.7) safe++
      else if (pct >= 0.5) caution++
      else danger++
    }
    return { safe, caution, danger, noData, total: enrichedAccounts.length }
  }, [enrichedAccounts])

  // ── CFD branch ────────────────────────────────────────────────────────────
  // Render the CFD "Santé" view instead of the 3 futures components. The futures
  // trades-stats memos above still run (hooks must stay unconditional) but their
  // output is not used here.
  if (marketMode === 'cfd') {
    return (
      <div style={{ padding: '24px 28px 60px', maxWidth: 1280, width: '100%', boxSizing: 'border-box' }}>
        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: 6, color: C.text }}>
            Health Center
          </h1>
          <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.5, margin: 0 }}>
            {t('app.cfdHealth.sectionSubtitle')}
          </p>
        </header>

        <Section title={t('app.cfdHealth.sectionTitle')} subtitle={t('app.cfdHealth.sectionSubtitle')}>
          {cfdAccounts.length === 0 ? (
            <EmptyState text={t('app.cfdHealth.empty')} />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12,
            }}>
              {cfdAccounts.map((acc) => (
                <CfdDrawdownCard
                  key={acc.id}
                  account={acc}
                  firmName={acc.firmName}
                  onSaved={reload}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </Section>
      </div>
    )
  }

  // ── Futures branch (unchanged) ──────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 28px 60px', maxWidth: 1280, width: '100%', boxSizing: 'border-box' }}>
      {/* Page header */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: 6, color: C.text }}>
          Health Center
        </h1>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.5, margin: 0 }}>
          Vue d&apos;ensemble en temps réel de la santé de tes comptes PropFirm : drawdown, consistency, pipeline payouts.
        </p>
      </header>

      {tradesError && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--red-bg)',
          border: '1px solid var(--red)',
          borderRadius: 10,
          fontSize: 13,
          color: C.red,
          marginBottom: 20,
        }}>
          Erreur chargement des trades : {tradesError}
        </div>
      )}

      {/* Summary row */}
      {enrichedAccounts.length > 0 && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 32,
        }}>
          <SummaryCard label="Comptes actifs" value={summary.total} color={C.text2} />
          <SummaryCard label="Safe (≥70%)" value={summary.safe} color={C.green} />
          <SummaryCard label="Caution (50-70%)" value={summary.caution} color={C.amber} />
          <SummaryCard label="Danger (<50%)" value={summary.danger} color={C.red} />
          {summary.noData > 0 && <SummaryCard label="Sans data" value={summary.noData} color={C.text3} />}
        </section>
      )}

      {/* 1. Drawdown Health */}
      <Section
        title="Drawdown Health"
        subtitle="Marge de drawdown restante par compte (en % de l'allowance max de la firm). Ex : $2K room sur $2K maxDD = 100% safe. Vert ≥70%, ambre 50-70%, rouge <50%."
      >
        {tradesLoading ? (
          <EmptyState text="Chargement des trades…" />
        ) : enrichedAccounts.length === 0 ? (
          <EmptyState text="Aucun compte actif. Crée une firm puis un compte (Challenge ou Financé) pour activer le drawdown tracking." />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 12,
          }}>
            {enrichedAccounts.map((a) => (
              <DrawdownHealthCard key={a.id} account={a} firmName={a.firmName} />
            ))}
          </div>
        )}
      </Section>

      {/* 2. Consistency Monitor */}
      <Section
        title="Consistency Monitor"
        subtitle="Best winning day / profit total — comparé au seuil consistency de chaque firm. Calculé en live depuis tes trades journal."
      >
        <ConsistencyMonitor
          firms={firms}
          statsByAccount={statsByAccount}
          loading={tradesLoading}
        />
      </Section>

      {/* 3. Payout Pipeline */}
      <Section
        title="Payout Pipeline"
        subtitle="Suivi des comptes financés à travers les 4 étapes : Setup → Building → Eligible → Received."
      >
        <PayoutPipeline firms={firms} statsByAccount={statsByAccount} />
      </Section>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, marginBottom: 4, color: C.text }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 13, color: C.text3, lineHeight: 1.5, margin: 0, marginBottom: 18 }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  )
}

function EmptyState({ text }) {
  return (
    <div style={{
      padding: '24px',
      background: C.surface,
      border: `1px dashed ${C.border}`,
      borderRadius: 12,
      textAlign: 'center',
      color: C.text3,
      fontSize: 13,
      lineHeight: 1.5,
    }}>
      {text}
    </div>
  )
}
