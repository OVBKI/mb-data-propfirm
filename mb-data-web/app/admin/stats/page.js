'use client'
// Admin Stats — analytics agrégées pour piloter Quantara.
// Funnel d'activation, distributions, courbes temporelles 30j.

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
  pink: '#f472b6',
}

const STATUS_COLORS = {
  Challenge: C.amber,
  'Financé': C.green,
  'Échoué': C.red,
}

function BarChart({ data, height = 120, color = C.blue }) {
  // data: array of {label, value}
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = (d.value / max) * 100
        return (
          <div key={i} title={`${d.label} : ${d.value}`} style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            position: 'relative',
          }}>
            <div style={{
              height: `${h}%`,
              background: d.value > 0 ? `linear-gradient(180deg, ${color}, ${color}80)` : C.surface3,
              borderRadius: '3px 3px 0 0',
              minHeight: d.value > 0 ? 2 : 0,
              transition: 'height 0.3s',
            }} />
          </div>
        )
      })}
    </div>
  )
}

function HorizontalBar({ items, total, getColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(({ label, value }) => {
        const pct = total > 0 ? (value / total) * 100 : 0
        const color = getColor ? getColor(label) : C.blue
        return (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: C.text2 }}>{label}</span>
              <span style={{ fontWeight: 600, color: C.text }}>{value} <span style={{ color: C.text3, fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
            </div>
            <div style={{ height: 8, background: C.surface2, borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: color, transition: 'width 0.4s',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children, span = 1 }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 20,
      gridColumn: `span ${span}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.text3,
        textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 16,
      }}>{title}</div>
      {children}
    </div>
  )
}

export default function AdminStatsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const now = new Date()
        const day30Ago = new Date(now); day30Ago.setDate(now.getDate() - 30)

        // Fetch users via admin API
        let users = []
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const res = await fetch('/api/admin/users?q=', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (res.ok) users = (await res.json()).users || []
          }
        } catch {}

        // Fetch DB data
        const [firmsRes, accountsRes, tradesRes, payoutsRes] = await Promise.all([
          supabase.from('firms').select('id, user_id, name'),
          supabase.from('accounts').select('id, status, payment_mode, plan_size, profit_split, user_id, created_at, months_count, spent, currency'),
          supabase.from('journal_entries').select('id, user_id, account_id, pnl, created_at'),
          supabase.from('payouts').select('id, user_id, account_id, amount, created_at'),
        ])

        const accounts = accountsRes.data || []
        const trades = tradesRes.data || []
        const payouts = payoutsRes.data || []
        const firms = firmsRes.data || []

        // === Funnel d'activation ===
        const usersWithFirm = new Set(firms.map(f => f.user_id))
        const usersWithAccount = new Set(accounts.map(a => a.user_id))
        const usersWithTrade = new Set(trades.map(t => t.user_id))
        const usersWithPayout = new Set(payouts.map(p => p.user_id))

        // === Distribution statuts comptes ===
        const statusDist = { Challenge: 0, 'Financé': 0, 'Échoué': 0 }
        accounts.forEach(a => { if (statusDist[a.status] !== undefined) statusDist[a.status]++ })

        // === Distribution mode paiement ===
        const paymentDist = { Mensuel: 0, 'One-time': 0 }
        accounts.forEach(a => {
          if (a.payment_mode === 'onetime') paymentDist['One-time']++
          else paymentDist.Mensuel++
        })

        // === Distribution plan size ===
        const planDist = {}
        accounts.forEach(a => {
          const p = (a.plan_size || '50k').toUpperCase()
          planDist[p] = (planDist[p] || 0) + 1
        })
        const planEntries = Object.entries(planDist).sort((a, b) => b[1] - a[1])

        // === Distribution profit split ===
        const splitDist = {}
        accounts.forEach(a => {
          const s = `${a.profit_split || 90}/${100 - (a.profit_split || 90)}`
          splitDist[s] = (splitDist[s] || 0) + 1
        })
        const splitEntries = Object.entries(splitDist).sort((a, b) => b[1] - a[1])

        // === Daily signups & trades (30 jours) ===
        const dailySignups = []
        const dailyTrades = []
        for (let i = 30; i >= 0; i--) {
          const d = new Date(now); d.setDate(now.getDate() - i)
          const dayStr = d.toISOString().slice(0, 10)
          const sCount = users.filter(u => u.created_at?.slice(0, 10) === dayStr).length
          const tCount = trades.filter(t => t.created_at?.slice(0, 10) === dayStr).length
          dailySignups.push({ label: dayStr.slice(5), value: sCount })
          dailyTrades.push({ label: dayStr.slice(5), value: tCount })
        }

        // === Trades stats ===
        const totalPnL = trades.reduce((s, t) => s + (Number(t.pnl) || 0), 0)
        const wins = trades.filter(t => Number(t.pnl) > 0).length
        const losses = trades.filter(t => Number(t.pnl) < 0).length
        const winRate = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0
        const avgWin = wins > 0 ? trades.filter(t => Number(t.pnl) > 0).reduce((s, t) => s + Number(t.pnl), 0) / wins : 0
        const avgLoss = losses > 0 ? trades.filter(t => Number(t.pnl) < 0).reduce((s, t) => s + Number(t.pnl), 0) / losses : 0

        // === Payouts stats ===
        const totalPayoutsAmount = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
        const avgPayout = payouts.length > 0 ? totalPayoutsAmount / payouts.length : 0

        // === Revenu cumulé pour Quantara (estimation des dépenses des users) ===
        // = somme(spent × months_count) sur comptes Challenge monthly + spent sur onetime
        let totalUserSpend = 0
        accounts.forEach(a => {
          const months = a.months_count || 1
          totalUserSpend += (Number(a.spent) || 0) * months
        })

        if (!mounted) return
        setData({
          totalUsers: users.length,
          funnel: [
            { label: 'Inscrits', value: users.length },
            { label: '1ère firme', value: usersWithFirm.size },
            { label: '1er compte', value: usersWithAccount.size },
            { label: '1er trade', value: usersWithTrade.size },
            { label: '1er payout', value: usersWithPayout.size },
          ],
          statusDist, paymentDist, planEntries, splitEntries,
          dailySignups, dailyTrades,
          totalAccounts: accounts.length,
          totalTrades: trades.length,
          totalPayouts: payouts.length,
          totalPayoutsAmount,
          avgPayout,
          totalPnL,
          winRate, wins, losses, avgWin, avgLoss,
          totalUserSpend,
        })
      } catch (err) {
        if (mounted) setError(err.message || 'Erreur chargement stats')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: 11, color: '#e8504a', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 6 }}>Statistiques</h1>
        <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>⏳ Calcul des statistiques...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: 11, color: '#e8504a', letterSpacing: '0.16em', marginBottom: 10, textTransform: 'uppercase', fontWeight: 600 }}>Admin</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 6 }}>Statistiques</h1>
        <div style={{
          padding: 16, background: 'rgba(232,80,74,0.08)',
          border: `1px solid ${C.red}`, borderRadius: 10, color: C.red,
        }}>⚠ {error || 'Aucune donnée'}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📈 Statistiques</h1>
      <p style={{ fontSize: 13, color: C.text3, marginBottom: 22 }}>
        Vue analytique de Quantara. Funnel d'activation, distributions, tendances sur 30 jours.
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16, marginBottom: 24,
      }}>
        {/* === Funnel d'activation === */}
        <Section title="🎯 Funnel d'activation" span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.funnel.map((step, i) => {
              const pctOfTotal = data.totalUsers > 0 ? (step.value / data.totalUsers) * 100 : 0
              const pctDropoff = i > 0 && data.funnel[i - 1].value > 0
                ? ((data.funnel[i - 1].value - step.value) / data.funnel[i - 1].value) * 100
                : 0
              return (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {step.label}</span>
                    <span style={{ fontSize: 12, color: C.text2 }}>
                      <strong style={{ color: C.text }}>{step.value}</strong> users
                      <span style={{ color: C.text3 }}> · {pctOfTotal.toFixed(0)}% du total</span>
                      {i > 0 && pctDropoff > 0 && <span style={{ color: C.red, marginLeft: 8 }}>↓ {pctDropoff.toFixed(0)}% drop</span>}
                    </span>
                  </div>
                  <div style={{ height: 14, background: C.surface2, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pctOfTotal}%`, height: '100%',
                      background: `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`,
                      transition: 'width 0.4s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{
            marginTop: 14, padding: '8px 12px', background: C.surface2, borderRadius: 6,
            fontSize: 11, color: C.text3, lineHeight: 1.5,
          }}>
            💡 Les drop-offs te montrent où tes users abandonnent. Une grosse chute "1er compte → 1er trade" = signal que ton onboarding doit être amélioré.
          </div>
        </Section>

        {/* === Signups 30j === */}
        <Section title="📅 Inscriptions sur 30 jours">
          <BarChart data={data.dailySignups} color={C.blueLight} />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3 }}>
            <span>{data.dailySignups[0].label}</span>
            <span>{data.dailySignups[data.dailySignups.length - 1].label}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: C.text2 }}>
            Total : <strong style={{ color: C.text }}>{data.dailySignups.reduce((s, d) => s + d.value, 0)}</strong> inscriptions
          </div>
        </Section>

        {/* === Trades 30j === */}
        <Section title="📔 Trades loggés sur 30 jours">
          <BarChart data={data.dailyTrades} color={C.green} />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3 }}>
            <span>{data.dailyTrades[0].label}</span>
            <span>{data.dailyTrades[data.dailyTrades.length - 1].label}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: C.text2 }}>
            Total : <strong style={{ color: C.text }}>{data.dailyTrades.reduce((s, d) => s + d.value, 0)}</strong> trades
          </div>
        </Section>

        {/* === Distribution statuts === */}
        <Section title="📊 Statuts des comptes">
          <HorizontalBar
            items={Object.entries(data.statusDist).map(([label, value]) => ({ label, value }))}
            total={data.totalAccounts}
            getColor={label => STATUS_COLORS[label] || C.text3}
          />
        </Section>

        {/* === Mode de paiement === */}
        <Section title="💳 Mode de paiement">
          <HorizontalBar
            items={Object.entries(data.paymentDist).map(([label, value]) => ({ label, value }))}
            total={data.totalAccounts}
            getColor={label => label === 'One-time' ? C.blueLight : C.amber}
          />
        </Section>

        {/* === Plans populaires === */}
        <Section title="🏆 Plans les plus utilisés">
          <HorizontalBar
            items={data.planEntries.slice(0, 6).map(([label, value]) => ({ label, value }))}
            total={data.totalAccounts}
            getColor={() => C.blue}
          />
        </Section>

        {/* === Profit splits === */}
        <Section title="💸 Profit splits utilisés">
          <HorizontalBar
            items={data.splitEntries.map(([label, value]) => ({ label, value }))}
            total={data.totalAccounts}
            getColor={() => C.pink}
          />
        </Section>

        {/* === Trading stats === */}
        <Section title="🎯 Performance trading globale" span={2}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14,
          }}>
            {[
              { label: 'PnL cumulé', value: `${data.totalPnL >= 0 ? '+' : ''}${data.totalPnL.toFixed(0)} $`, color: data.totalPnL >= 0 ? C.green : C.red },
              { label: 'Win rate', value: `${data.winRate.toFixed(1)}%`, color: data.winRate >= 50 ? C.green : C.amber },
              { label: 'Trades gagnants', value: data.wins, color: C.green },
              { label: 'Trades perdants', value: data.losses, color: C.red },
              { label: 'Avg win', value: `+${data.avgWin.toFixed(0)} $`, color: C.green },
              { label: 'Avg loss', value: `${data.avgLoss.toFixed(0)} $`, color: C.red },
            ].map((s, i) => (
              <div key={i} style={{
                background: C.surface2, borderRadius: 8, padding: 14,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.text3,
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
                }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* === Volume payouts === */}
        <Section title="💰 Volume payouts" span={2}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14,
          }}>
            {[
              { label: 'Total payouts (NET)', value: `${data.totalPayoutsAmount.toFixed(0)} $`, color: C.green },
              { label: 'Nombre de payouts', value: data.totalPayouts, color: C.text },
              { label: 'Payout moyen', value: `${data.avgPayout.toFixed(0)} $`, color: C.green },
              { label: 'Coûts users cumulés', value: `${data.totalUserSpend.toFixed(0)} $`, color: C.red, sub: 'estimé · challenges + mensualités' },
            ].map((s, i) => (
              <div key={i} style={{
                background: C.surface2, borderRadius: 8, padding: 14,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: C.text3,
                  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
                }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
