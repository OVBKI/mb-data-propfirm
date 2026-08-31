'use client'
// app/app/analytics/page.js — Analytics: cumulative/yearly/monthly charts + equity overlay.
// Extracted from the original monolithic app/app/page.js (lines ~1016-1038).

import { useEffect, useRef } from 'react'
import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import EquityOverlayChart from '../../../../components/EquityOverlayChart'
import { chartColors } from '../../../../lib/theme'
import { useTheme } from '../../../../components/ThemeProvider'

// ── AnalyticsCharts (extracted from original page.js) ──
function AnalyticsCharts({ sym, cLabels, cSpent, cPayout, cNet, yLabels, ySpent, yPayout, yNet, mLabels, mSpent, mPayout, mNet }) {
  const { theme } = useTheme()
  const cRef = useRef(null), yRef = useRef(null), mRef = useRef(null)
  const charts = useRef({})
  const cardS = { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)' }

  useEffect(() => {
    let destroyed = false
    // Chart.js peint dans un canvas : var() n'y est pas résolu, on lit donc les
    // jetons calculés. `theme` est en dépendance pour reconstruire à la bascule.
    const CH = chartColors()
    const destroy = (key) => { if (charts.current[key]) { charts.current[key].destroy(); delete charts.current[key] } }
    import('chart.js/auto').then((mod) => {
      if (destroyed) return
      const { Chart } = mod
      // ⚠️ beginAtZero. Sur des MONTANTS, un axe qui démarre ailleurs qu'à zéro
      // exagère les écarts et, pire, escamote les petites barres : avec une base
      // à 7 000, une dépense de 1 596 ne dessine plus rien du tout. Le graphique
      // annuel n'affichait donc que deux séries sur trois.
      const opts = {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)} ${sym}` } } },
        scales: { x: { grid: { display: false }, ticks: { color: CH.tick, font: { size: 10 }, maxTicksLimit: 10 } }, y: { beginAtZero: true, grid: { color: CH.grid }, ticks: { color: CH.tick, font: { size: 10 }, callback: v => v + sym } } }
      }
      if (cRef.current) { destroy('c'); charts.current.c = new Chart(cRef.current, { type: 'line', data: { labels: cLabels, datasets: [{ label: `Dépenses (${sym})`, data: cSpent, borderColor: CH.red, backgroundColor: CH.redFill, fill: true, tension: 0.3, pointRadius: cLabels.length > 20 ? 0 : 4, borderWidth: 2 }, { label: `Payouts (${sym})`, data: cPayout, borderColor: CH.green, backgroundColor: CH.greenFill, fill: true, tension: 0.3, pointRadius: cLabels.length > 20 ? 0 : 4, borderWidth: 2 }, { label: `Net (${sym})`, data: cNet, borderColor: CH.blue, fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2, borderDash: [6, 3] }] }, options: opts }) }
      if (yRef.current) { destroy('y'); charts.current.y = new Chart(yRef.current, { type: 'bar', data: { labels: yLabels, datasets: [{ label: `Dépenses (${sym})`, data: ySpent, backgroundColor: CH.red, borderRadius: 5 }, { label: `Payouts (${sym})`, data: yPayout, backgroundColor: CH.green, borderRadius: 5 }, { label: `Net (${sym})`, data: yNet, backgroundColor: CH.blue, borderRadius: 5 }] }, options: opts }) }
      if (mRef.current) { destroy('m'); charts.current.m = new Chart(mRef.current, { type: 'bar', data: { labels: mLabels, datasets: [{ label: `Dépenses (${sym})`, data: mSpent, backgroundColor: CH.red, borderRadius: 4 }, { label: `Payouts (${sym})`, data: mPayout, backgroundColor: CH.green, borderRadius: 4 }, { label: `Net (${sym})`, data: mNet, backgroundColor: CH.blue, borderRadius: 4 }] }, options: opts }) }
    }).catch(e => console.error('Chart.js:', e))
    return () => { destroyed = true; Object.values(charts.current).forEach(c => c?.destroy()) }
  }, [cLabels.join(','), yLabels.join(','), mLabels.join(','), theme, sym])

  const leg = (items) => <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>{items.map(it => <div key={it.l} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text2)' }}><div style={{ width: '10px', height: '3px', borderRadius: '2px', background: it.c }}></div>{it.l}</div>)}</div>

  return <>
    <div style={{ ...cardS, padding: '18px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Évolution cumulée</div>
        {leg([{ l: 'Dépenses', c: 'var(--red)' }, { l: 'Payouts', c: 'var(--green)' }, { l: 'Net', c: 'var(--blue)' }])}
      </div>
      <div style={{ position: 'relative', height: '240px' }}><canvas ref={cRef} /></div>
    </div>
    <div className="analytics-charts" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ ...cardS, padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Performance annuelle</div>
          {leg([{ l: 'Dépenses', c: 'var(--red)' }, { l: 'Payouts', c: 'var(--green)' }, { l: 'Net', c: 'var(--blue)' }])}
        </div>
        <div style={{ position: 'relative', height: '220px' }}><canvas ref={yRef} /></div>
      </div>
      <div style={{ ...cardS, padding: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>Performance mensuelle</div>
          {leg([{ l: 'Dépenses', c: 'var(--red)' }, { l: 'Payouts', c: 'var(--green)' }, { l: 'Net', c: 'var(--blue)' }])}
        </div>
        <div style={{ position: 'relative', height: '220px' }}><canvas ref={mRef} /></div>
      </div>
    </div>
  </>
}

export default function AnalyticsPage() {
  const t = useT()
  const {
    user, firms, rates, S, currency,
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

  // ⚠️ Les séries sont calculées en EUR (toEUR), mais les CARTES du haut suivent
  // la devise choisie dans les réglages. La page affichait donc « +9057.38 $ »
  // au-dessus de graphiques gradués en « 18000€ » — les mêmes montants, deux
  // unités, sur le même écran. On convertit les séries plutôt que de se contenter
  // de changer le symbole : sinon l'axe porterait un « $ » sur des chiffres en euros.
  const sym = currency === 'eur' ? '€' : '$'
  const conv = v => currency === 'eur' ? v : +(v / (rates.USD || 1)).toFixed(2)
  const cSpentD = cSpent.map(conv), cPayoutD = cPayout.map(conv), cNetD = cNet.map(conv)
  const ySpentD = ySpent.map(conv), yPayoutD = yPayout.map(conv), yNetD = yNet.map(conv)
  const mSpentD = mSpent.map(conv), mPayoutD = mPayout.map(conv), mNetD = mNet.map(conv)

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
          <AnalyticsCharts sym={sym} cLabels={cLabels} cSpent={cSpentD} cPayout={cPayoutD} cNet={cNetD} yLabels={yLabels} ySpent={ySpentD} yPayout={yPayoutD} yNet={yNetD} mLabels={mLabels} mSpent={mSpentD} mPayout={mPayoutD} mNet={mNetD} />
          <EquityOverlayChart firms={firms} user={user} />
        </>
      }
    </div>
  )
}
