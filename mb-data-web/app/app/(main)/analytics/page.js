'use client'
// app/app/analytics/page.js — Analytics: cumulative/yearly/monthly charts + equity overlay.
// Extracted from the original monolithic app/app/page.js (lines ~1016-1038).

import { useEffect, useRef } from 'react'
import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import EquityOverlayChart from '../../../../components/EquityOverlayChart'

// ── AnalyticsCharts (extracted from original page.js) ──
function AnalyticsCharts({ cLabels, cSpent, cPayout, cNet, yLabels, ySpent, yPayout, yNet, mLabels, mSpent, mPayout, mNet }) {
  const cRef = useRef(null), yRef = useRef(null), mRef = useRef(null)
  const charts = useRef({})
  const cardS = { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }

  useEffect(() => {
    let destroyed = false
    const destroy = (key) => { if (charts.current[key]) { charts.current[key].destroy(); delete charts.current[key] } }
    import('chart.js/auto').then((mod) => {
      if (destroyed) return
      const { Chart } = mod
      const opts = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)} €` } } },
        scales: { x: { grid: { display: false }, ticks: { color: '#7b839b', font: { size: 10 }, maxTicksLimit: 10 } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7b839b', font: { size: 10 }, callback: v => v + '€' } } }
      }
      if (cRef.current) { destroy('c'); charts.current.c = new Chart(cRef.current, { type: 'line', data: { labels: cLabels, datasets: [{ label: 'Dépenses (€)', data: cSpent, borderColor: '#e8504a', backgroundColor: 'rgba(232,80,74,0.06)', fill: true, tension: 0.3, pointRadius: cLabels.length > 20 ? 0 : 4, borderWidth: 2 }, { label: 'Payouts (€)', data: cPayout, borderColor: '#1db87a', backgroundColor: 'rgba(29,184,122,0.06)', fill: true, tension: 0.3, pointRadius: cLabels.length > 20 ? 0 : 4, borderWidth: 2 }, { label: 'Net (€)', data: cNet, borderColor: '#2d6fff', fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2, borderDash: [6, 3] }] }, options: opts }) }
      if (yRef.current) { destroy('y'); charts.current.y = new Chart(yRef.current, { type: 'bar', data: { labels: yLabels, datasets: [{ label: 'Dépenses (€)', data: ySpent, backgroundColor: '#e8504a', borderRadius: 5 }, { label: 'Payouts (€)', data: yPayout, backgroundColor: '#1db87a', borderRadius: 5 }, { label: 'Net (€)', data: yNet, backgroundColor: yNet.map(v => v >= 0 ? 'rgba(45,111,255,0.7)' : 'rgba(232,80,74,0.4)'), borderRadius: 5 }] }, options: opts }) }
      if (mRef.current) { destroy('m'); charts.current.m = new Chart(mRef.current, { type: 'bar', data: { labels: mLabels, datasets: [{ label: 'Dépenses (€)', data: mSpent, backgroundColor: '#e8504a', borderRadius: 4 }, { label: 'Payouts (€)', data: mPayout, backgroundColor: '#1db87a', borderRadius: 4 }, { label: 'Net (€)', data: mNet, backgroundColor: mNet.map(v => v >= 0 ? 'rgba(45,111,255,0.7)' : 'rgba(232,80,74,0.4)'), borderRadius: 4 }] }, options: opts }) }
    }).catch(e => console.error('Chart.js:', e))
    return () => { destroyed = true; Object.values(charts.current).forEach(c => c?.destroy()) }
  }, [cLabels.join(','), yLabels.join(','), mLabels.join(',')])

  const leg = (items) => <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>{items.map(it => <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text2)' }}><div style={{ width: '10px', height: '3px', borderRadius: '2px', background: it.c }}></div>{it.l}</div>)}</div>

  return <>
    <div style={{ ...cardS, padding: '18px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Évolution cumulée</div>
        {leg([{ l: 'Dépenses', c: '#e8504a' }, { l: 'Payouts', c: '#1db87a' }, { l: 'Net', c: '#2d6fff' }])}
      </div>
      <div style={{ position: 'relative', height: '240px' }}><canvas ref={cRef} /></div>
    </div>
    <div className="analytics-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ ...cardS, padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Performance annuelle</div>
          {leg([{ l: 'Dépenses', c: '#e8504a' }, { l: 'Payouts', c: '#1db87a' }, { l: 'Net', c: 'rgba(45,111,255,0.8)' }])}
        </div>
        <div style={{ position: 'relative', height: '220px' }}><canvas ref={yRef} /></div>
      </div>
      <div style={{ ...cardS, padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Performance mensuelle</div>
          {leg([{ l: 'Dépenses', c: '#e8504a' }, { l: 'Payouts', c: '#1db87a' }, { l: 'Net', c: 'rgba(45,111,255,0.8)' }])}
        </div>
        <div style={{ position: 'relative', height: '220px' }}><canvas ref={mRef} /></div>
      </div>
    </div>
  </>
}

export default function AnalyticsPage() {
  const t = useT()
  const {
    user, firms, rates, S,
    toEUR, fmtMoney, fmtMoneyNet,
    totalPayoutsEUR, totalSpentForAccount,
    totalSpentEUR, totalPayoutsEUR2, totalNet, totalPayoutCount,
    MONTHS_FR,
  } = useApp()

  // ── Build chart data ──
  const events = []
  firms.forEach(f => {
    ;(f.accounts || []).forEach(a => {
      events.push({ date: a.buy_date, type: 'spent', amount: toEUR(a.spent, a.currency, rates) })
      if (a.payment_mode === 'monthly' && (a.months_count || 1) > 1) {
        for (let i = 1; i < (a.months_count || 1); i++) {
          const d = new Date(a.buy_date)
          d.setMonth(d.getMonth() + i)
          events.push({ date: d.toISOString().slice(0, 10), type: 'spent', amount: toEUR(a.spent, a.currency, rates) })
        }
      }
      if (a.activation_fee > 0 && a.activation_date) events.push({ date: a.activation_date, type: 'spent', amount: toEUR(a.activation_fee, a.currency, rates) })
      ;(a.payouts || []).forEach(p => events.push({ date: p.date, type: 'payout', amount: toEUR(p.amount, a.currency, rates) }))
    })
  })
  events.sort((a, b) => a.date.localeCompare(b.date))
  const byDate = {}; events.forEach(e => { if (!byDate[e.date]) byDate[e.date] = { spent: 0, payout: 0 }; byDate[e.date][e.type] += e.amount })
  let cs = 0, cp = 0; const cLabels = [], cSpent = [], cPayout = [], cNet = []
  Object.keys(byDate).sort().forEach(d => { cs += byDate[d].spent; cp += byDate[d].payout; cLabels.push(d); cSpent.push(+cs.toFixed(2)); cPayout.push(+cp.toFixed(2)); cNet.push(+(cp - cs).toFixed(2)) })
  const byYear = {}; events.forEach(e => { const y = e.date.slice(0, 4); if (!byYear[y]) byYear[y] = { spent: 0, payout: 0 }; byYear[y][e.type] += e.amount })
  const yLabels = Object.keys(byYear).sort(), ySpent = yLabels.map(y => +byYear[y].spent.toFixed(2)), yPayout = yLabels.map(y => +byYear[y].payout.toFixed(2)), yNet = yLabels.map(y => +(byYear[y].payout - byYear[y].spent).toFixed(2))
  const byMonth = {}; events.forEach(e => { const ym = e.date.slice(0, 7); if (!byMonth[ym]) byMonth[ym] = { spent: 0, payout: 0 }; byMonth[ym][e.type] += e.amount })
  const mSlice = Object.keys(byMonth).sort().slice(-12)
  const mLabels = mSlice.map(ym => { const p = ym.split('-'); return MONTHS_FR[parseInt(p[1]) - 1] + ' ' + p[0].slice(2) })
  const mSpent = mSlice.map(ym => +byMonth[ym].spent.toFixed(2)), mPayout = mSlice.map(ym => +byMonth[ym].payout.toFixed(2)), mNet = mSlice.map(ym => +(byMonth[ym].payout - byMonth[ym].spent).toFixed(2))

  return (
    <div className="page-pad" style={{ maxWidth: '1160px', margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'var(--blue-light)', letterSpacing: '0.16em', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>{t('app.analytics.eyebrow')}</div>
        <h1 style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-0.025em', margin: 0, marginBottom: '6px', lineHeight: 1.1 }}>{t('app.analytics.title')}</h1>
        <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{t('app.analytics.subtitle')}</div>
      </div>
      <div className="stats-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
        {[{ l: t('app.analytics.statNetGlobal'), v: fmtMoneyNet(totalNet), c: totalNet >= 0 ? 'var(--green)' : 'var(--red)' }, { l: t('app.analytics.statTotalSpent'), v: fmtMoney(totalSpentEUR), c: 'var(--red)' }, { l: t('app.analytics.statTotalPayouts'), v: fmtMoney(totalPayoutsEUR2), c: 'var(--green)' }, { l: t('app.analytics.statAvgPayout'), v: totalPayoutCount > 0 ? fmtMoney(totalPayoutsEUR2 / totalPayoutCount) : '—', c: 'var(--green)' }].map((k, i) => (
          <div key={i} style={{ ...S.card, padding: '18px' }}><div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: '600' }}>{k.l}</div><div style={{ fontSize: '22px', fontWeight: '700', color: k.c, letterSpacing: '-0.015em' }}>{k.v}</div></div>
        ))}
      </div>
      {!cLabels.length
        ? <div style={{ ...S.card, padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>{t('app.analytics.empty')}</div>
        : <>
          <AnalyticsCharts cLabels={cLabels} cSpent={cSpent} cPayout={cPayout} cNet={cNet} yLabels={yLabels} ySpent={ySpent} yPayout={yPayout} yNet={yNet} mLabels={mLabels} mSpent={mSpent} mPayout={mPayout} mNet={mNet} />
          <EquityOverlayChart firms={firms} user={user} />
        </>
      }
    </div>
  )
}
