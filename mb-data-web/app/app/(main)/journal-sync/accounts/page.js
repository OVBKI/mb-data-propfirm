'use client'
// /app/journal-sync/accounts — Hierarchical view : PropFirm > Accounts
// Lists all accounts that have a rithmic_account_id mapped, grouped by firm.

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../../../lib/supabase'
import { useApp } from '../../AppContext'
import { planSizeNum, maxDrawdown, FIRM_SUGGESTION_COLORS } from '../../../../../lib/constants'
import { getFirmLogo } from '../../../../../lib/firmLogos'

const C = {
  bg: '#0d0f14',
  surface: 'rgba(20,23,32,0.65)',
  surface2: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLt: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
  purple: '#a78bfa',
}

function statusBadgeColor(status) {
  if (status === 'Financé') return C.green
  if (status === 'Challenge') return C.amber
  if (status === 'Échoué') return C.red
  return C.text3
}

export default function AccountsListPage() {
  const { firms, user } = useApp()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all trades once with cached balances per account
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('account_id, date, pnl, net')
        .eq('user_id', user.id)
      if (!cancelled) {
        setTrades(data || [])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

  // Compute per-account stats from trades
  const statsByAccount = useMemo(() => {
    const stats = {}
    for (const t of trades) {
      const k = t.account_id
      if (!k) continue
      if (!stats[k]) stats[k] = { totalPnl: 0, days: new Set(), tradeCount: 0 }
      stats[k].totalPnl += Number(t.pnl) || 0
      stats[k].tradeCount += 1
      if (t.date) stats[k].days.add(t.date.slice(0, 10))
    }
    return stats
  }, [trades])

  // Group firms with accounts that have rithmic_account_id
  const grouped = useMemo(() => {
    const groups = []
    for (const f of (firms || [])) {
      const synced = (f.accounts || []).filter(a => a.rithmic_account_id)
      if (synced.length === 0) continue
      groups.push({
        firm: f,
        color: FIRM_SUGGESTION_COLORS[f.name] || C.blue,
        accounts: synced.map(a => {
          const s = statsByAccount[a.id] || { totalPnl: 0, days: new Set(), tradeCount: 0 }
          const initial = planSizeNum(a.plan_size) || 0
          const balance = initial + (s.totalPnl || 0)
          const maxDD = maxDrawdown(f.name, a.plan_size) || 0
          return {
            ...a,
            firmName: f.name,
            balance,
            initial,
            maxDD,
            totalPnl: s.totalPnl,
            tradingDays: s.days.size,
            tradeCount: s.tradeCount,
          }
        }),
      })
    }
    return groups
  }, [firms, statsByAccount])

  const totalSynced = grouped.reduce((sum, g) => sum + g.accounts.length, 0)

  return (
    <div style={{ padding: '40px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
      <nav style={{ fontSize: 12, color: C.text3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/app/journal-sync" style={{ color: C.text3, textDecoration: 'none' }}>Journal Sync</Link>
        <span>›</span>
        <span style={{ color: C.text2 }}>Comptes Rithmic</span>
      </nav>

      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>
          Comptes Rithmic synchronisés
        </h1>
        <p style={{ fontSize: 14, color: C.text2, lineHeight: 1.5, margin: 0 }}>
          {totalSynced} compte{totalSynced > 1 ? 's' : ''} synchronisé{totalSynced > 1 ? 's' : ''} via Rithmic API,
          regroupé{totalSynced > 1 ? 's' : ''} par PropFirm. Clique sur un compte pour voir son détail (equity curve, calendrier PnL, stats).
        </p>
      </header>

      {loading ? (
        <div style={{ padding: 24, color: C.text3, fontSize: 14 }}>Chargement…</div>
      ) : grouped.length === 0 ? (
        <div style={{
          padding: 32, background: C.surface, border: `1px dashed ${C.border2}`, borderRadius: 14,
          textAlign: 'center', color: C.text3, fontSize: 14, lineHeight: 1.7,
        }}>
          Aucun compte n&apos;a de <code style={{ color: C.purple }}>rithmic_account_id</code> rempli.
          <br />
          Va dans <Link href="/app/dashboard" style={{ color: C.blueLt }}>Dashboard</Link> pour mapper tes comptes,
          ou dans <Link href="/app/journal-sync/rithmic" style={{ color: C.blueLt }}>Rithmic Live Sync</Link> pour configurer la sync.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(({ firm, color, accounts }) => (
            <FirmGroup key={firm.id} firm={firm} color={color} accounts={accounts} />
          ))}
        </div>
      )}
    </div>
  )
}

function FirmGroup({ firm, color, accounts }) {
  const firmTotalPnl = accounts.reduce((s, a) => s + (a.totalPnl || 0), 0)
  return (
    <section style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderLeft: `4px solid ${color}`,
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <header style={{
        padding: '16px 22px',
        borderBottom: `1px solid ${C.border}`,
        background: `${color}08`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {getFirmLogo(firm.name, color, 36)}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{firm.name}</div>
          <div style={{ fontSize: 11, color: C.text3 }}>
            {accounts.length} compte{accounts.length > 1 ? 's' : ''} synchronisé{accounts.length > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            P&L total
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: firmTotalPnl >= 0 ? C.green : C.red }}>
            {firmTotalPnl >= 0 ? '+' : ''}${Math.round(firmTotalPnl).toLocaleString('en-US')}
          </div>
        </div>
      </header>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {accounts.map(acct => <AccountRow key={acct.id} acct={acct} color={color} />)}
      </div>
    </section>
  )
}

function AccountRow({ acct, color }) {
  const pnl = acct.totalPnl || 0
  const pnlPct = acct.initial > 0 ? (pnl / acct.initial) * 100 : 0
  const ddRoom = acct.maxDD > 0
    ? Math.max(0, Math.min(1, (acct.balance - (acct.initial - acct.maxDD)) / acct.maxDD))
    : null
  return (
    <Link href={`/app/journal-sync/accounts/${acct.id}`} style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(180px, 1fr) auto auto auto auto',
      gap: 16,
      padding: '14px 16px',
      background: C.surface2,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      textDecoration: 'none',
      color: C.text,
      alignItems: 'center',
      transition: 'background 0.15s, border-color 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}44` }}
    onMouseLeave={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.border }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {acct.name || `Plan ${(acct.plan_size || '').toUpperCase()}`}
          </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: `${statusBadgeColor(acct.status)}15`,
            color: statusBadgeColor(acct.status),
            border: `1px solid ${statusBadgeColor(acct.status)}33`,
          }}>{acct.status?.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>{acct.rithmic_account_id}</div>
      </div>
      <Stat label="Balance" value={`$${Math.round(acct.balance).toLocaleString('en-US')}`} color={C.text} />
      <Stat label="P&L" value={`${pnl >= 0 ? '+' : ''}$${Math.round(pnl).toLocaleString('en-US')}`} color={pnl >= 0 ? C.green : C.red} sub={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`} />
      <Stat label="Trading Days" value={acct.tradingDays} color={C.text2} sub={`${acct.tradeCount} trades`} />
      <div style={{ fontSize: 12, color: C.purple, fontWeight: 600 }}>Voir →</div>
    </Link>
  )
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.text3 }}>{sub}</div>}
    </div>
  )
}
