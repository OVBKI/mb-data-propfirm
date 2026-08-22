'use client'
// components/EquityOverlayChart.js — Overlay multi-comptes equity curves.
//
// Sur la page Analytics, permet de comparer la progression de plusieurs
// comptes côte à côte (ex: PRO 1 vs PRO 2 chez Topstep, ou Apex vs Lucid).
//
// USAGE :
//   <EquityOverlayChart firms={firms} user={user} />
//
// FONCTIONNEMENT :
//   1. L'utilisateur sélectionne 2 à 5 comptes via des chips cliquables
//   2. On fetch les trades de chaque compte
//   3. On calcule la balance cumulée jour par jour pour chaque compte
//   4. Chart.js dessine N lignes superposées
//
// NORMALISATION :
//   - Mode "PnL cumulé $" : chaque compte démarre à 0 et cumule son PnL
//   - Mode "Progression %" : chaque compte démarre à 100% et progresse en % du plan size
//
// Note : les comptes avec funded_date excluent les trades antérieurs.

import { useEffect, useRef, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { accountLabel, planSizeNum } from '../lib/constants'
import Skeleton from './Skeleton'
import { chartColors } from '../lib/theme'
import { useTheme } from './ThemeProvider'

const C = {
  surface:  'var(--glass)',
  border:   'var(--border)',
  text:     'var(--text)',
  text2:    'var(--text2)',
  text3:    'var(--text3)',
  green:    '#1db87a',
  red:      '#e8504a',
  blue:     '#2d6fff',
  blueLt:   '#4d8fff',
  amber:    '#fac775',
}

// La carte passe par les jetons `--card-*` (app/globals.css). Elle etait
// redefinie ici avec ses propres valeurs, ce qui faisait cohabiter deux
// cartes legerement differentes selon la page.
const card = { background: 'var(--card-bg)', border: 'var(--card-border)', borderRadius: 'var(--card-radius)', boxShadow: 'var(--card-shadow)' }

// Palette de couleurs distinctes pour chaque ligne (jusqu'à 5 comptes)
const LINE_COLORS = [
  { stroke: '#2d6fff', fill: 'var(--blue-bg)' },   // blue
  { stroke: '#1db87a', fill: 'var(--green-bg)' },   // green
  { stroke: '#fac775', fill: 'var(--amber-bg)' },  // amber
  { stroke: '#e8504a', fill: 'var(--red-bg)' },    // red
  { stroke: '#a76ef5', fill: 'rgba(167,110,245,0.08)' },  // purple
]

const MAX_ACCOUNTS = 5

export default function EquityOverlayChart({ firms = [], user }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  // Tous les comptes plats (firm + account info)
  const allAccounts = useMemo(() => {
    return firms.flatMap(f => (f.accounts || []).map(a => ({
      ...a,
      firmId: f.id, firmName: f.name, firmColor: f.color,
    })))
  }, [firms])

  // Comptes sélectionnés pour overlay (IDs)
  const { theme } = useTheme()
  const [selected, setSelected] = useState([])
  const [mode, setMode] = useState('absolute') // 'absolute' = PnL $ | 'percent' = % gain
  const [entriesByAccount, setEntriesByAccount] = useState({}) // { acctId: [entry, ...] }
  const [loading, setLoading] = useState(false)

  // Auto-select : sur premier render, sélectionne les 2 comptes Financés avec le plus de trades.
  // Si pas de Financés, prend les 2 premiers comptes actifs.
  useEffect(() => {
    if (allAccounts.length === 0) return
    if (selected.length > 0) return // déjà initialisé
    const candidates = allAccounts
      .filter(a => a.status === 'Financé')
      .slice(0, 2)
    if (candidates.length >= 2) {
      setSelected(candidates.map(a => a.id))
    } else {
      const fallback = allAccounts.filter(a => a.status !== 'Échoué').slice(0, 2)
      setSelected(fallback.map(a => a.id))
    }
  }, [allAccounts]) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle un compte (ajouter/retirer de la sélection, max 5)
  const toggleAccount = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
    } else {
      if (selected.length >= MAX_ACCOUNTS) return
      setSelected([...selected, id])
    }
  }

  // Charger les entries de chaque compte sélectionné
  useEffect(() => {
    if (!user || selected.length === 0) {
      setEntriesByAccount({})
      return
    }
    async function load() {
      setLoading(true)
      const result = {}
      // Fetch en parallèle
      const promises = selected.map(async acctId => {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('account_id, date, pnl')
          .eq('user_id', user.id)
          .eq('account_id', acctId)
          .order('date', { ascending: true })
        if (error) {
          console.error('[equity overlay]', error)
          return [acctId, []]
        }
        return [acctId, data || []]
      })
      const results = await Promise.all(promises)
      for (const [acctId, entries] of results) {
        result[acctId] = entries
      }
      setEntriesByAccount(result)
      setLoading(false)
    }
    load()
  }, [user, selected.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  // Calcule la balance cumulée pour chaque compte sélectionné, alignée sur toutes les dates uniques.
  const chartData = useMemo(() => {
    if (selected.length === 0) return null

    // 1. Récupérer toutes les dates uniques de tous les comptes
    const allDates = new Set()
    selected.forEach(acctId => {
      (entriesByAccount[acctId] || []).forEach(e => {
        // Si le compte a un funded_date, exclure les trades antérieurs
        const acc = allAccounts.find(a => a.id === acctId)
        if (acc?.funded_date && e.date < acc.funded_date) return
        allDates.add(e.date)
      })
    })
    const dates = Array.from(allDates).sort()
    if (dates.length === 0) return null

    // 2. Pour chaque compte, calculer la balance cumulée à chaque date
    const datasets = selected.map((acctId, idx) => {
      const acc = allAccounts.find(a => a.id === acctId)
      if (!acc) return null
      const color = LINE_COLORS[idx % LINE_COLORS.length]
      const entries = entriesByAccount[acctId] || []
      // Group PnL par date
      const pnlByDate = {}
      for (const e of entries) {
        if (acc.funded_date && e.date < acc.funded_date) continue
        pnlByDate[e.date] = (pnlByDate[e.date] || 0) + (Number(e.pnl) || 0)
      }
      // Cumul jour par jour
      let cum = 0
      const dataPoints = dates.map(d => {
        if (pnlByDate[d]) cum += pnlByDate[d]
        // Mode % : convertir en % du plan size
        if (mode === 'percent') {
          const planSize = planSizeNum(acc.plan_size) || 50000
          return +(cum / planSize * 100).toFixed(2)
        }
        return +cum.toFixed(2)
      })
      return {
        label: `${acc.firmName} · ${accountLabel(acc)}`,
        data: dataPoints,
        borderColor: color.stroke,
        backgroundColor: color.fill,
        fill: true,
        tension: 0.3,
        pointRadius: dates.length > 30 ? 0 : 3,
        borderWidth: 2,
      }
    }).filter(Boolean)

    return { labels: dates, datasets }
  }, [selected, entriesByAccount, allAccounts, mode])

  // Render Chart.js
  useEffect(() => {
    let destroyed = false
    if (!canvasRef.current || !chartData) {
      // Destroy existing chart if no data
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null }
      return
    }
    const CH = chartColors()
    import('chart.js/auto').then(({ Chart }) => {
      if (destroyed || !canvasRef.current) return
      if (chartRef.current) chartRef.current.destroy()
      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}${mode === 'percent' ? '%' : ' $'}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: CH.tick, font: { size: 10 }, maxTicksLimit: 12 },
            },
            y: {
              grid: { color: CH.grid },
              ticks: {
                color: CH.tick, font: { size: 10 },
                callback: v => mode === 'percent' ? `${v}%` : `${v}$`,
              },
            },
          },
        },
      })
    })
    return () => { destroyed = true }
    // `theme` en dépendance : Chart.js peint dans un canvas et ne résout pas
    // var(), donc le graphe doit être reconstruit à chaque bascule de thème.
  }, [chartData, mode, theme])

  // Stats par compte sélectionné (synthèse à droite du chart)
  const perAccountStats = useMemo(() => {
    return selected.map((acctId, idx) => {
      const acc = allAccounts.find(a => a.id === acctId)
      if (!acc) return null
      const entries = entriesByAccount[acctId] || []
      const filtered = entries.filter(e => !(acc.funded_date && e.date < acc.funded_date))
      const totalPnL = filtered.reduce((s, e) => s + (Number(e.pnl) || 0), 0)
      const winCount = filtered.filter(e => Number(e.pnl) > 0).length
      const winRate = filtered.length > 0 ? (winCount / filtered.length * 100) : 0
      // Max DD = drawdown max sur la courbe cumulée (peak-to-trough)
      let cum = 0, peak = 0, maxDD = 0
      for (const e of filtered) {
        cum += Number(e.pnl) || 0
        if (cum > peak) peak = cum
        const dd = peak - cum
        if (dd > maxDD) maxDD = dd
      }
      return {
        id: acctId,
        label: `${acc.firmName} · ${accountLabel(acc)}`,
        color: LINE_COLORS[idx % LINE_COLORS.length].stroke,
        totalPnL,
        winRate,
        maxDD,
        tradeCount: filtered.length,
      }
    }).filter(Boolean)
  }, [selected, entriesByAccount, allAccounts])

  if (allAccounts.length === 0) {
    return null
  }

  // Groupé par firme pour le picker
  const accountsByFirm = firms.map(f => ({
    firm: f,
    accounts: (f.accounts || []).filter(a => a.status !== 'Échoué'),
  })).filter(g => g.accounts.length > 0)

  return (
    <div style={{ ...card, padding: 18, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>
            🔀 Overlay multi-comptes
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 3 }}>
            Compare la progression de jusqu'à {MAX_ACCOUNTS} comptes côte à côte
          </div>
        </div>
        {/* Toggle mode absolu / % */}
        <div style={{ display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {[
            { k: 'absolute', l: 'PnL $' },
            { k: 'percent',  l: '% du plan' },
          ].map(opt => (
            <button
              key={opt.k}
              onClick={() => setMode(opt.k)}
              style={{
                padding: '5px 11px', fontSize: 11, fontWeight: 600,
                background: mode === opt.k ? C.blue : 'transparent',
                color: mode === opt.k ? '#fff' : C.text2,
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', letterSpacing: '0.04em',
              }}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Picker comptes — chips groupés par firme */}
      <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--tint1)', borderRadius: 8, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 8 }}>
          Comptes à comparer ({selected.length}/{MAX_ACCOUNTS})
        </div>
        {accountsByFirm.map(({ firm, accounts }) => (
          <div key={firm.id} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: C.text2, fontWeight: 600, marginBottom: 4 }}>
              {firm.name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {accounts.map(a => {
                const isSel = selected.includes(a.id)
                const colorIdx = selected.indexOf(a.id)
                const color = isSel ? LINE_COLORS[colorIdx % LINE_COLORS.length].stroke : null
                const disabled = !isSel && selected.length >= MAX_ACCOUNTS
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAccount(a.id)}
                    disabled={disabled}
                    style={{
                      padding: '4px 9px', fontSize: 10, fontWeight: 600,
                      borderRadius: 99,
                      background: isSel ? `${color}22` : 'transparent',
                      color: isSel ? color : (disabled ? C.text3 : C.text2),
                      border: `1px solid ${isSel ? `${color}66` : C.border}`,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      fontFamily: 'inherit', letterSpacing: '0.04em',
                    }}
                  >
                    {accountLabel(a)} · {a.status}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Stats */}
      {selected.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.text3, fontSize: 12 }}>
          Sélectionne au moins 1 compte pour comparer ↑
        </div>
      ) : loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.text3, fontSize: 12 }}>
          <Skeleton width={200} height={14} style={{ margin: '0 auto 16px' }} />
          <Skeleton width="100%" height={200} style={{ borderRadius: 8 }} />
        </div>
      ) : !chartData || chartData.datasets.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.text3, fontSize: 12 }}>
          Aucun trade pour les comptes sélectionnés
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', height: 280, marginBottom: 14 }}>
            <canvas ref={canvasRef} />
          </div>

          {/* Stats résumé par compte */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${perAccountStats.length}, 1fr)`,
            gap: 8,
          }} className="equity-overlay-stats">
            {perAccountStats.map(s => (
              <div key={s.id} style={{
                padding: '10px 12px',
                background: 'var(--tint1)',
                border: `1px solid ${C.border}`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: 6,
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.text2, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10 }}>
                  <span style={{ color: C.text3 }}>
                    Net : <strong style={{ color: s.totalPnL >= 0 ? C.green : C.red, fontFamily: 'ui-monospace, monospace' }}>
                      {s.totalPnL >= 0 ? '+' : ''}{s.totalPnL.toFixed(0)} $
                    </strong>
                  </span>
                  <span style={{ color: C.text3 }}>
                    WR : <strong style={{ color: s.winRate >= 50 ? C.green : C.amber }}>{s.winRate.toFixed(0)}%</strong>
                  </span>
                  <span style={{ color: C.text3 }}>
                    Max DD : <strong style={{ color: C.red, fontFamily: 'ui-monospace, monospace' }}>−{s.maxDD.toFixed(0)} $</strong>
                  </span>
                  <span style={{ color: C.text3 }}>
                    {s.tradeCount} trades
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 760px) {
          .equity-overlay-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
