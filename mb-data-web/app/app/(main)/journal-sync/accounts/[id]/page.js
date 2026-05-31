'use client'
// /app/journal-sync/accounts/[id] — Detail view for a single account.
// Shows: 5 stat cards, equity curve (Balance + DD floor), trading calendar (PnL/Events), advanced stats.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../../../../lib/supabase'
import { useApp } from '../../../AppContext'
import { planSizeNum, maxDrawdown, FIRM_SUGGESTION_COLORS, MONTHS_FULL } from '../../../../../../lib/constants'
import { getFirmLogo } from '../../../../../../lib/firmLogos'

const C = {
  bg: '#0d0f14',
  surface: 'rgba(20,23,32,0.65)',
  surface2: 'rgba(255,255,255,0.025)',
  surface3: 'rgba(255,255,255,0.04)',
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

const DAY_LABELS_FR = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM']

export default function AccountDetailPage() {
  const params = useParams()
  const accountId = params?.id
  const { firms, user } = useApp()
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [calMode, setCalMode] = useState('pnl')  // 'pnl' or 'events'
  const [cursorMonth, setCursorMonth] = useState(() => new Date())

  // Find the account + firm in firms
  const { firm, acct } = useMemo(() => {
    for (const f of (firms || [])) {
      const a = (f.accounts || []).find(x => x.id === accountId)
      if (a) return { firm: f, acct: a }
    }
    return { firm: null, acct: null }
  }, [firms, accountId])

  // Load all trades for this account
  useEffect(() => {
    if (!user || !accountId) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('id, date, pnl, net, instrument, side, qty, entry_price')
        .eq('user_id', user.id)
        .eq('account_id', accountId)
        .order('date', { ascending: true })
      if (!cancelled) {
        setTrades(data || [])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user, accountId])

  // Compute everything
  const computed = useMemo(() => {
    if (!acct) return null
    const initial = planSizeNum(acct.plan_size) || 50000
    const maxDD = (firm && maxDrawdown(firm.name, acct.plan_size)) || 0
    const minProfit = acct.min_daily_profit || 0

    // Group trades by date
    const pnlByDate = {}
    const tradesByDate = {}
    for (const t of trades) {
      const d = (t.date || '').slice(0, 10)
      if (!d) continue
      pnlByDate[d] = (pnlByDate[d] || 0) + (Number(t.pnl) || 0)
      tradesByDate[d] = (tradesByDate[d] || 0) + 1
    }
    const dates = Object.keys(pnlByDate).sort()
    let cumBalance = initial
    let peak = initial
    const balanceSeries = []
    const ddFloorSeries = []
    for (const d of dates) {
      cumBalance += pnlByDate[d]
      if (cumBalance > peak) peak = cumBalance
      // DD floor : starts at initial - maxDD, trails peak, locks at initial
      const ddFloor = maxDD > 0
        ? Math.min(initial, Math.max(initial, peak) - maxDD)
        : null
      balanceSeries.push({ date: d, balance: cumBalance })
      ddFloorSeries.push({ date: d, ddFloor })
    }

    const totalPnl = cumBalance - initial
    const tradingDays = dates.length
    const winningDays = dates.filter(d => pnlByDate[d] > 0).length
    const losingDays = dates.filter(d => pnlByDate[d] < 0).length

    const winningPnls = dates.filter(d => pnlByDate[d] > 0).map(d => pnlByDate[d])
    const losingPnls = dates.filter(d => pnlByDate[d] < 0).map(d => pnlByDate[d])
    const bestDay = winningPnls.length ? Math.max(...winningPnls) : 0
    const worstDay = losingPnls.length ? Math.min(...losingPnls) : 0
    const avgWin = winningPnls.length ? winningPnls.reduce((s, x) => s + x, 0) / winningPnls.length : 0
    const avgLoss = losingPnls.length ? losingPnls.reduce((s, x) => s + x, 0) / losingPnls.length : 0
    const winRate = tradingDays ? (winningDays / tradingDays) : 0
    const profitFactor = (avgLoss !== 0)
      ? (winningPnls.reduce((s, x) => s + x, 0) / Math.abs(losingPnls.reduce((s, x) => s + x, 0) || 1))
      : (winningPnls.length ? Infinity : 0)
    const consistency = (totalPnl > 0 && bestDay > 0) ? bestDay / totalPnl : null

    return {
      initial, maxDD, minProfit,
      balance: cumBalance,
      ddFloorCurrent: ddFloorSeries.length ? ddFloorSeries[ddFloorSeries.length - 1].ddFloor : (initial - maxDD),
      peak,
      totalPnl,
      tradingDays,
      winningDays,
      losingDays,
      bestDay,
      worstDay,
      avgWin,
      avgLoss,
      winRate,
      profitFactor,
      consistency,
      pnlByDate,
      tradesByDate,
      balanceSeries,
      ddFloorSeries,
    }
  }, [acct, firm, trades])

  if (!acct || !firm) {
    return (
      <div style={{ padding: 40, color: C.text3, fontSize: 14 }}>
        {loading ? 'Chargement…' : 'Compte introuvable.'}
        <div style={{ marginTop: 12 }}>
          <Link href="/app/journal-sync/accounts" style={{ color: C.blueLt }}>← Retour aux comptes</Link>
        </div>
      </div>
    )
  }

  const color = FIRM_SUGGESTION_COLORS[firm.name] || C.blue

  return (
    <div style={{ padding: '32px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
      <nav style={{ fontSize: 12, color: C.text3, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/app/journal-sync" style={{ color: C.text3, textDecoration: 'none' }}>Journal Sync</Link>
        <span>›</span>
        <Link href="/app/journal-sync/accounts" style={{ color: C.text3, textDecoration: 'none' }}>Comptes Rithmic</Link>
        <span>›</span>
        <span style={{ color: C.text2 }}>{acct.name || acct.plan_size?.toUpperCase()}</span>
      </nav>

      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
        {getFirmLogo(firm.name, color, 48)}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            {firm.name}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: C.text, marginTop: 2 }}>
            {acct.name || `Plan ${(acct.plan_size || '').toUpperCase()}`}
          </h1>
          <div style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace', marginTop: 2 }}>
            {acct.rithmic_account_id}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {acct.status === 'Financé' && (
            <span style={badgeStyle(C.green)}>FUNDED</span>
          )}
          {acct.status === 'Challenge' && (
            <span style={badgeStyle(C.amber)}>CHALLENGE</span>
          )}
          {acct.status === 'Échoué' && (
            <span style={badgeStyle(C.red)}>ÉCHOUÉ</span>
          )}
          {trades.length > 0 && (
            <span style={badgeStyle(C.blueLt)}>ACTIVE</span>
          )}
        </div>
      </header>

      {/* 5 stat cards */}
      {computed && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 10,
          marginBottom: 24,
        }} className="acct-stats-grid">
          <StatCard label="ACCOUNT BALANCE" value={`$${Math.round(computed.balance).toLocaleString('en-US')}`} />
          <StatCard label="MINIMUM BALANCE" value={`$${Math.round(computed.ddFloorCurrent || 0).toLocaleString('en-US')}`} />
          <StatCard
            label="TOTAL P&L"
            value={`${computed.totalPnl >= 0 ? '+' : ''}$${Math.round(computed.totalPnl).toLocaleString('en-US')}`}
            color={computed.totalPnl >= 0 ? C.green : C.red}
          />
          <StatCard label="TRADING DAYS" value={computed.tradingDays} />
          <StatCard label="MIN PROFIT AMOUNT" value={`$${Math.round(computed.minProfit || 0).toLocaleString('en-US')}`} />
        </section>
      )}

      {/* Equity curve */}
      {computed && computed.balanceSeries.length > 0 && (
        <EquityChart computed={computed} color={color} />
      )}

      {/* Trading calendar */}
      <section style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.text }}>Trading Calendar</h2>
          <div style={{ display: 'flex', background: C.surface3, borderRadius: 8, padding: 3 }}>
            <button onClick={() => setCalMode('pnl')} style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 700,
              background: calMode === 'pnl' ? C.green : 'transparent',
              color: calMode === 'pnl' ? '#000' : C.text2,
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>PNL</button>
            <button onClick={() => setCalMode('events')} style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 700,
              background: calMode === 'events' ? C.green : 'transparent',
              color: calMode === 'events' ? '#000' : C.text2,
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>Events</button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setCursorMonth(d => addMonths(d, -1))} style={navBtn}>←</button>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, minWidth: 110, textAlign: 'center' }}>
              {MONTHS_FULL[cursorMonth.getMonth()].toLowerCase()} {cursorMonth.getFullYear()}
            </div>
            <button onClick={() => setCursorMonth(d => addMonths(d, 1))} style={navBtn}>→</button>
          </div>
        </div>
        <CalendarGrid
          year={cursorMonth.getFullYear()}
          month={cursorMonth.getMonth()}
          pnlByDate={computed?.pnlByDate || {}}
          tradesByDate={computed?.tradesByDate || {}}
          mode={calMode}
        />
      </section>

      {/* Advanced stats */}
      {computed && computed.tradingDays > 0 && (
        <section style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, marginBottom: 16, color: C.text }}>
            Statistiques avancées
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
          }}>
            <StatCard label="WIN RATE" value={`${(computed.winRate * 100).toFixed(1)}%`} sub={`${computed.winningDays}W · ${computed.losingDays}L`} />
            <StatCard label="BEST DAY" value={`+$${Math.round(computed.bestDay).toLocaleString('en-US')}`} color={C.green} />
            <StatCard label="WORST DAY" value={`$${Math.round(computed.worstDay).toLocaleString('en-US')}`} color={C.red} />
            <StatCard label="AVG WIN" value={`+$${Math.round(computed.avgWin).toLocaleString('en-US')}`} color={C.green} />
            <StatCard label="AVG LOSS" value={`$${Math.round(computed.avgLoss).toLocaleString('en-US')}`} color={C.red} />
            <StatCard
              label="PROFIT FACTOR"
              value={Number.isFinite(computed.profitFactor) ? computed.profitFactor.toFixed(2) : '∞'}
              color={(computed.profitFactor > 1) ? C.green : C.red}
            />
            {computed.consistency != null && (
              <StatCard
                label="CONSISTENCY"
                value={`${(computed.consistency * 100).toFixed(1)}%`}
                color={computed.consistency < 0.4 ? C.green : (computed.consistency < 0.5 ? C.amber : C.red)}
                sub="best day / total"
              />
            )}
            <StatCard label="PEAK BALANCE" value={`$${Math.round(computed.peak).toLocaleString('en-US')}`} color={C.text} />
          </div>
        </section>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.acct-stats-grid) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}

function badgeStyle(color) {
  return {
    padding: '4px 12px',
    background: `${color}15`,
    color,
    border: `1px solid ${color}33`,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.08em',
  }
}

function StatCard({ label, value, color = C.text, sub }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function EquityChart({ computed, color }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    let destroyed = false
    if (!canvasRef.current) return
    import('chart.js/auto').then(({ Chart }) => {
      if (destroyed) return
      if (chartRef.current) chartRef.current.destroy()
      const dates = computed.balanceSeries.map(p => p.date)
      const balances = computed.balanceSeries.map(p => p.balance)
      const ddFloors = computed.ddFloorSeries.map(p => p.ddFloor)

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Balance',
              data: balances,
              borderColor: C.green,
              backgroundColor: `${C.green}22`,
              fill: true,
              tension: 0.35,
              pointRadius: 0,
              borderWidth: 2.5,
            },
            {
              label: 'Minimum',
              data: ddFloors,
              borderColor: C.red,
              borderDash: [6, 6],
              borderWidth: 2,
              pointRadius: 0,
              fill: false,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'start',
              labels: { color: C.text2, font: { size: 11 }, padding: 16, usePointStyle: true, pointStyle: 'circle' },
            },
            tooltip: {
              backgroundColor: 'rgba(20,23,32,0.95)',
              borderColor: C.border2,
              borderWidth: 1,
              titleColor: C.text,
              bodyColor: C.text2,
              padding: 10,
            },
          },
          scales: {
            x: { ticks: { color: C.text3, maxTicksLimit: 10, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: {
              ticks: {
                color: C.text3, font: { size: 10 },
                callback: v => `$${(v / 1000).toFixed(0)} 000`,
              },
              grid: { color: 'rgba(255,255,255,0.04)' },
            },
          },
        },
      })
    })
    return () => { destroyed = true; if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null } }
  }, [computed])

  return (
    <section style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 14,
      padding: '20px 22px',
      marginBottom: 24,
    }}>
      <div style={{ height: 320 }}>
        <canvas ref={canvasRef} />
      </div>
    </section>
  )
}

function CalendarGrid({ year, month, pnlByDate, tradesByDate, mode }) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  // Build a 6x7 grid (max 42 cells)
  const cells = []
  // Previous month padding
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Pad to multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  function dateStr(day) {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {DAY_LABELS_FR.map(d => (
          <div key={d} style={{
            fontSize: 11, color: C.text3, textAlign: 'center', padding: '6px 0',
            fontWeight: 600, letterSpacing: '0.06em', background: C.surface2, borderRadius: 6,
          }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} style={{ padding: '8px 4px' }} />
          const ds = dateStr(d)
          const pnl = pnlByDate[ds]
          const trades = tradesByDate[ds] || 0
          const hasData = pnl != null && pnl !== 0
          const bg = hasData
            ? (pnl > 0 ? 'rgba(29,184,122,0.12)' : 'rgba(232,80,74,0.12)')
            : C.surface2
          const borderColor = hasData
            ? (pnl > 0 ? `${C.green}55` : `${C.red}55`)
            : C.border
          return (
            <div key={i} style={{
              padding: '8px 6px',
              minHeight: 64,
              background: bg,
              border: `1px solid ${borderColor}`,
              borderRadius: 6,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 11, color: hasData ? C.text : C.text3, fontWeight: 700 }}>{d}</div>
              {hasData && mode === 'pnl' && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: pnl > 0 ? C.green : C.red, letterSpacing: '-0.01em' }}>
                    {pnl > 0 ? '+' : ''}${Math.round(pnl).toLocaleString('en-US')}
                  </div>
                  <div style={{ fontSize: 9, color: C.text3 }}>{trades} trade{trades > 1 ? 's' : ''}</div>
                </>
              )}
              {hasData && mode === 'events' && (
                <div style={{ fontSize: 10, color: C.text3 }}>—</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

const navBtn = {
  padding: '6px 12px',
  background: C.surface3,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.text2,
  fontSize: 13,
  cursor: 'pointer',
}
