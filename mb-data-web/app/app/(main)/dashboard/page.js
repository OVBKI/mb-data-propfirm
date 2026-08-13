'use client'
// app/app/dashboard/page.js — Dashboard: firm cards, calendar, stats, sidebar panels.
// Extracted from the original monolithic app/app/page.js (lines ~795-1015).

import { useState, useEffect, useRef } from 'react'
import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import { MONTHS_FULL } from '../../../../lib/constants'
import { chartColors } from '../../../../lib/theme'
import { useTheme } from '../../../../components/ThemeProvider'

// ── Mini Bar Chart for dashboard ──
function MiniBarChart({ firms, firmTotalSpent, firmTotalPayouts }) {
  const { theme } = useTheme()
  const ref = useRef(null)
  const chart = useRef(null)

  useEffect(() => {
    if (!ref.current || !firms.length) return
    // Chart.js peint dans un canvas : var() n'y est pas résolu, on lit les jetons
    // calculés. `theme` est en dépendance pour reconstruire à la bascule.
    const CH = chartColors()
    import('chart.js/auto').then(({ default: Chart }) => {
      if (chart.current) { chart.current.destroy(); chart.current = null }
      const labels = firms.map(f => f.name.length > 8 ? f.name.slice(0, 8) + '…' : f.name)
      const spent = firms.map(f => parseFloat(firmTotalSpent(f).toFixed(2)))
      const payouts = firms.map(f => parseFloat(firmTotalPayouts(f).toFixed(2)))
      chart.current = new Chart(ref.current, {
        type: 'bar',
        data: {
          labels, datasets: [
            { label: 'Dépensé (€)', data: spent, backgroundColor: '#e8504a', borderRadius: 4 },
            { label: 'Payouts (€)', data: payouts, backgroundColor: '#1db87a', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} €` } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: CH.tick, font: { size: 9 } } },
            y: { grid: { color: CH.grid }, ticks: { color: CH.tick, font: { size: 9 }, callback: v => v + '€' } }
          }
        }
      })
    })
    return () => { if (chart.current) { chart.current.destroy(); chart.current = null } }
  }, [firms.map(f => f.id).join(','), theme])

  return <canvas ref={ref} />
}

export default function DashboardPage() {
  const t = useT()
  const {
    user, firms, rates, profile, rateInfo,
    currency, setCurrencyMode, searchQ, setSearchQ,
    S, toEUR, fmtE, fmtENet, fmtMoney, fmtMoneyNet,
    totalPayoutsEUR, totalSpentForAccount, firmTotalSpent, firmTotalPayouts,
    accts, totalSpentEUR, totalPayoutsEUR2, totalNet, totalPayoutCount,
    setFirmModal, setNewFirmName, setFirmDrawer, setCertsFirm,
    setShowOnboarding,
    getFirmLogo, STATUS_COLORS, accountLabel, MONTHS_FR,
    marketMode, openCfdAdd,
  } = useApp()

  // Mode-gated add-PropFirm trigger: in CFD mode open the reusable CFD account
  // modal; in futures mode keep the existing add-firm flow exactly as before.
  function handleAddPropfirm() {
    if (marketMode === 'cfd') { openCfdAdd(); return }
    setFirmModal(true); setNewFirmName('')
  }

  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [selDay, setSelDay] = useState(null)

  // ── Event map (calendar) ──
  function buildEventMap() {
    const m = {}
    firms.forEach(f => {
      ;(f.accounts || []).forEach(a => {
        if (!m[a.buy_date]) m[a.buy_date] = []
        const isMonthly = a.payment_mode === 'monthly'
        const monthsBilled = a.months_count || 1
        m[a.buy_date].push({ type: 'buy', firm: f.name, amount: a.spent, currency: a.currency, firmId: f.id, acctId: a.id, label: isMonthly ? 'Mensualité #1' : 'Challenge' })
        if (isMonthly && monthsBilled > 1) {
          for (let i = 1; i < monthsBilled; i++) {
            const d = new Date(a.buy_date)
            d.setMonth(d.getMonth() + i)
            const dStr = d.toISOString().slice(0, 10)
            if (!m[dStr]) m[dStr] = []
            m[dStr].push({ type: 'buy', firm: f.name, amount: a.spent, currency: a.currency, firmId: f.id, acctId: a.id, label: `Mensualité #${i + 1}` })
          }
        }
        if (a.activation_fee > 0 && a.activation_date) {
          if (!m[a.activation_date]) m[a.activation_date] = []
          m[a.activation_date].push({ type: 'buy', firm: f.name, amount: a.activation_fee, currency: a.currency, firmId: f.id, acctId: a.id, label: 'Activation' })
        }
        ;(a.payouts || []).forEach(p => {
          if (!m[p.date]) m[p.date] = []
          m[p.date].push({ type: 'pay', firm: f.name, amount: p.amount, currency: a.currency, firmId: f.id, acctId: a.id })
        })
      })
    })
    return m
  }

  const evtMap = buildEventMap()
  const firstDay = new Date(calYear, calMonth, 1)
  let sdow = firstDay.getDay(); sdow = sdow === 0 ? 6 : sdow - 1
  const dim = new Date(calYear, calMonth + 1, 0).getDate()
  const dipm = new Date(calYear, calMonth, 0).getDate()
  const todayStr = new Date().toISOString().slice(0, 10)
  const calDays = []
  for (let i = sdow - 1; i >= 0; i--) { const d = dipm - i, m2 = calMonth === 0 ? 11 : calMonth - 1, y2 = calMonth === 0 ? calYear - 1 : calYear; calDays.push({ day: d, dateStr: `${y2}-${String(m2 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, other: true }) }
  for (let d = 1; d <= dim; d++) { const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; calDays.push({ day: d, dateStr: ds, other: false, today: ds === todayStr, selected: ds === selDay }) }
  const rem = (sdow + dim) % 7 === 0 ? 0 : 7 - (sdow + dim) % 7
  for (let d = 1; d <= rem; d++) { const m3 = calMonth === 11 ? 0 : calMonth + 1, y3 = calMonth === 11 ? calYear + 1 : calYear; calDays.push({ day: d, dateStr: `${y3}-${String(m3 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, other: true }) }

  let msSpent = 0, msPayout = 0
  Object.entries(evtMap).forEach(([d, evts]) => {
    const dt = new Date(d + 'T00:00:00')
    if (dt.getFullYear() === calYear && dt.getMonth() === calMonth) evts.forEach(e => { if (e.type === 'buy') msSpent += toEUR(e.amount, e.currency, rates); else msPayout += toEUR(e.amount, e.currency, rates) })
  })

  return (
    <div className="page-pad" style={{ maxWidth: '1160px', margin: '0 auto', padding: '32px 24px 60px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--blue-light)', letterSpacing: '0.16em', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>
            {t('app.dashboard.eyebrow')}
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-0.025em', margin: 0, marginBottom: '6px', lineHeight: 1.1 }}>
            {t('app.dashboard.greeting').replace('{name}', profile?.display_name || profile?.username || user?.email?.split('@')[0] || t('app.dashboard.defaultName'))}
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{rateInfo}</div>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid var(--hairline)', borderRadius: '8px', overflow: 'hidden', background: 'var(--tint1)' }}>
            {['native', 'eur'].map(c => <button key={c} onClick={() => setCurrencyMode(c)} style={{ padding: '7px 14px', fontSize: '12px', border: 'none', background: currency === c ? 'var(--blue)' : 'transparent', color: currency === c ? '#fff' : 'var(--text2)', cursor: 'pointer', fontWeight: '600', letterSpacing: '0.05em' }}>{c === 'native' ? 'USD' : 'EUR'}</button>)}
          </div>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder={t('app.dashboard.searchPlaceholder')} style={{ ...S.input, maxWidth: '180px', width: '100%', minWidth: 0 }} />
          <button data-tour="add-firm-btn" onClick={handleAddPropfirm} style={S.btnPrimary}>{t('app.dashboard.btnAddPropfirm')}</button>
        </div>
      </div>

      <div className="stats-5" data-tour="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: t('app.dashboard.statPropfirms'), value: `${firms.length} · ${accts.length} ${t('app.dashboard.accountsLabel')}`, small: true },
          { label: t('app.dashboard.statTotalSpent'), value: currency === 'eur' ? fmtE(totalSpentEUR) : (totalSpentEUR / rates.USD).toFixed(2) + ' $', color: 'var(--red)' },
          { label: t('app.dashboard.statTotalPayouts'), value: currency === 'eur' ? fmtE(totalPayoutsEUR2) : (totalPayoutsEUR2 / rates.USD).toFixed(2) + ' $', color: 'var(--green)' },
          { label: t('app.dashboard.statNetResult'), value: currency === 'eur' ? fmtENet(totalNet) : (totalNet >= 0 ? '+' : '') + (totalNet / rates.USD).toFixed(2) + ' $', color: totalNet >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: t('app.dashboard.statPayouts'), value: totalPayoutCount },
        ].map((k, i) => (
          <div key={i} className="qt-stat-card" style={{ ...S.card, padding: '18px 18px', transition: 'border-color 0.2s, transform 0.2s' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: '600' }}>{k.label}</div>
            <div style={{ fontSize: k.small ? '15px' : '24px', fontWeight: '700', color: k.color || 'var(--text)', letterSpacing: '-0.015em' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="firms-grid" data-tour="firms-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '16px', marginBottom: '24px' }}>
        {firms.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase())).map(firm => {
          const ts = firmTotalSpent(firm), tp = firmTotalPayouts(firm), net = tp - ts, roi = ts > 0 ? net / ts * 100 : 0
          const al = firm.accounts || []
          const challengeCount = al.filter(a => a.status === 'Challenge').length
          const financedCount = al.filter(a => a.status === 'Financé').length
          const failedCount = al.filter(a => a.status === 'Échoué').length
          const payoutCount = al.reduce((s, a) => s + (a.payouts || []).length, 0)
          const activeAccts = al.filter(a => a.status !== 'Échoué')
          return (
            <div key={firm.id} onClick={() => setFirmDrawer(firm.id)} className="qt-firm-card" style={{ ...S.card, padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(45,111,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.25), 0 0 24px rgba(45,111,255,0.08)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 0 var(--tint1) inset, 0 8px 24px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{getFirmLogo(firm.name, firm.color, 36)}<div><div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.005em' }}>{firm.name}</div><div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{al.length} compte{al.length > 1 ? 's' : ''} · {payoutCount} payout{payoutCount > 1 ? 's' : ''}</div></div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: '19px', fontWeight: '700', color: net >= 0 ? 'var(--green)' : 'var(--red)', letterSpacing: '-0.015em' }}>{currency === 'eur' ? fmtENet(net, 0) : (net >= 0 ? '+' : '') + (net / rates.USD).toFixed(0) + ' $'}</div><div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '14px' }}>
                {[{ l: 'Dépensé', v: currency === 'eur' ? fmtE(ts, 0) : (ts / rates.USD).toFixed(0) + ' $', c: 'var(--red)' }, { l: 'Payouts', v: currency === 'eur' ? fmtE(tp, 0) : (tp / rates.USD).toFixed(0) + ' $', c: 'var(--green)' }, { l: 'Actifs', v: financedCount + challengeCount }].map((s, i) => (
                  <div key={i} style={{ background: 'var(--tint1)', border: '1px solid var(--tint2)', borderRadius: '7px', padding: '10px 8px', textAlign: 'center' }}><div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontWeight: '600' }}>{s.l}</div><div style={{ fontSize: '14px', fontWeight: '700', color: s.c || 'var(--text)', letterSpacing: '-0.005em' }}>{s.v}</div></div>
                ))}
              </div>
              {activeAccts.slice(0, 3).map(a => {
                const aNet = totalPayoutsEUR(a) - totalSpentForAccount(a)
                return <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: STATUS_COLORS[a.status] || 'var(--text3)', flexShrink: 0 }} /><span title={`Acheté le ${a.buy_date}`} style={{ color: 'var(--text2)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{accountLabel(a)}</span><span style={{ ...S.badge(a.status), fontSize: '9px', padding: '1px 6px', flexShrink: 0 }}>{a.status}</span>{a.liquidated_at && <span title={`Auto-liquidé le ${new Date(a.liquidated_at).toLocaleString('fr-FR')}`} style={{ fontSize: '10px', cursor: 'help', marginLeft: '2px', flexShrink: 0 }}>{'🔥'}</span>}</div>
                  <span style={{ fontWeight: '600', color: aNet >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtMoneyNet(aNet, 0)}</span>
                </div>
              })}
              {activeAccts.length > 3 && <div style={{ fontSize: '11px', color: 'var(--text3)', padding: '4px 0' }}>+{activeAccts.length - 3} autre{activeAccts.length - 3 > 1 ? 's' : ''}...</div>}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {challengeCount > 0 && <span style={S.badge('Challenge')}>{challengeCount} {t('app.status.challenge')}{challengeCount > 1 ? 's' : ''}</span>}
                {financedCount > 0 && <span style={S.badge('Financé')}>{financedCount} {t('app.status.funded')}{financedCount > 1 ? 's' : ''}</span>}
                {failedCount > 0 && <span style={S.badge('Échoué')}>{failedCount} {t('app.status.failed')}{failedCount > 1 ? 's' : ''}</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); setCertsFirm(firm) }}
                  title={t('app.dashboard.diplomasTitle')}
                  style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 9px', borderRadius: '99px', background: 'rgba(45,111,255,0.10)', border: '1px solid rgba(45,111,255,0.30)', color: 'var(--blue-light)', cursor: 'pointer', fontWeight: '600' }}
                >{t('app.dashboard.diplomas')}</button>
              </div>
            </div>
          )
        })}
        {!firms.length && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px 24px', background: 'var(--surface2)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border2)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.6 }}>{'📊'}</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{t('app.dashboard.noPropfirmTitle')}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              {t('app.dashboard.noPropfirmBody')}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleAddPropfirm} style={S.btnPrimary}>{t('app.dashboard.btnAddFirstPropfirm')}</button>
              <button onClick={() => { localStorage.removeItem('quantara_onboarding_dismissed'); setShowOnboarding(true) }} style={S.btnGhost}>{t('app.dashboard.btnDemoData')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Content grid: Calendar (full width) */}
      <div className="grid-1-340" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '72px', alignItems: 'start' }}>
        <div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600' }}>Calendrier des transactions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()) }} style={S.btnGhost}>{'‹'}</button>
                <span style={{ fontWeight: '600', minWidth: '140px', textAlign: 'center' }}>{MONTHS_FULL[calMonth]} {calYear}</span>
                <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()) }} style={S.btnGhost}>{'›'}</button>
                <button onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); setSelDay(null) }} style={S.btnGhost}>Aujourd&apos;hui</button>
              </div>
            </div>
            <div className="stats-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
              {[{ l: 'Achats du mois', v: fmtMoney(msSpent), c: 'var(--red)' }, { l: 'Payouts du mois', v: fmtMoney(msPayout), c: 'var(--green)' }, { l: 'Net du mois', v: fmtMoneyNet(msPayout - msSpent), c: (msPayout - msSpent) >= 0 ? 'var(--green)' : 'var(--red)' }].map((s, i) => (
                <div key={i} style={{ ...S.card, padding: '10px 14px' }}><div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.l}</div><div style={{ fontSize: '15px', fontWeight: '600', color: s.c }}>{s.v}</div></div>
              ))}
            </div>
            <div className="grid-1-280" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
              <div style={{ ...S.card, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => <div key={d} style={{ padding: '12px 0', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
                  {calDays.map((day, i) => {
                    const evts = evtMap[day.dateStr] || []
                    const buyT = evts.filter(e => e.type === 'buy').reduce((s, e) => s + toEUR(e.amount, e.currency, rates), 0)
                    const payT = evts.filter(e => e.type === 'pay').reduce((s, e) => s + toEUR(e.amount, e.currency, rates), 0)
                    return <div key={i} className="cal-cell" onClick={() => setSelDay(day.dateStr)} style={{ minHeight: '108px', padding: '10px', borderRight: (i + 1) % 7 === 0 ? 'none' : '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)', cursor: 'pointer', opacity: day.other ? 0.25 : 1, background: day.selected ? 'rgba(45,111,255,0.08)' : 'transparent', outline: day.selected ? '2px solid var(--blue)' : 'none', outlineOffset: '-2px' }}>
                      <div className="cal-cell-num" style={{ fontSize: '13px', fontWeight: '600', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: day.today ? 'var(--blue)' : 'transparent', color: day.today ? '#fff' : 'var(--text2)', marginBottom: '5px' }}>{day.day}</div>
                      {buyT > 0 && <div className="cal-cell-amount" style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: 'var(--red-bg)', color: 'var(--red-text)', marginBottom: '3px', display: 'inline-block' }}>-{fmtMoney(buyT, 0)}</div>}
                      {payT > 0 && <div className="cal-cell-amount" style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', background: 'var(--green-bg)', color: 'var(--green-text)', display: 'inline-block' }}>+{fmtMoney(payT, 0)}</div>}
                    </div>
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ ...S.card, padding: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>{selDay ? new Date(selDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sélectionnez un jour'}</div>
                  {selDay ? (evtMap[selDay] || []).length > 0 ? (evtMap[selDay] || []).map((e, i) => (
                    <div key={i} onClick={() => setFirmDrawer(e.firmId)} style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', marginBottom: '8px', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontWeight: '600', fontSize: '13px' }}>{e.firm}</span><span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: e.type === 'buy' ? 'var(--red-bg)' : 'var(--green-bg)', color: e.type === 'buy' ? 'var(--red-text)' : 'var(--green-text)', fontWeight: '600' }}>{e.label || (e.type === 'buy' ? 'Achat' : 'Payout')}</span></div>
                      <div style={{ fontSize: '12px', color: e.type === 'buy' ? 'var(--red)' : 'var(--green)', fontWeight: '600' }}>{e.type === 'buy' ? '-' : '+'}{fmtMoney(toEUR(e.amount, e.currency, rates))}</div>
                    </div>
                  )) : <div style={{ color: 'var(--text3)', fontSize: '12px' }}>Aucune transaction.</div> : <div style={{ color: 'var(--text3)', fontSize: '12px' }}>Cliquez sur un jour.</div>}
                </div>
                <div style={{ ...S.card, padding: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Transactions récentes</div>
                  {Object.entries(evtMap).flatMap(([d, evts]) => evts.map(e => ({ ...e, date: d }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: e.type === 'buy' ? 'var(--red)' : 'var(--green)', marginTop: '4px', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: '12px', fontWeight: '500' }}>{e.firm}</div><div style={{ fontSize: '10px', color: 'var(--text3)' }}>{e.date} · {e.type === 'buy' ? 'Achat' : 'Payout'}</div></div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: e.type === 'buy' ? 'var(--red)' : 'var(--green)' }}>{e.type === 'buy' ? '-' : '+'}{fmtMoney(toEUR(e.amount, e.currency, rates))}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR (sous le calendrier) : Bar chart + Stats + Par firme — 3 colonnes */}
        <div className="dash-sidebar-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', alignItems: 'start' }}>
          {/* Bar chart par firme */}
          <div style={{ ...S.card, padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '10px' }}>Par firme (EUR)</div>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#e8504a' }}></div>Dépensé</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}><div style={{ width: '10px', height: '3px', borderRadius: '2px', background: '#1db87a' }}></div>Payouts</div>
            </div>
            <div style={{ position: 'relative', height: '180px' }}><MiniBarChart firms={firms} firmTotalSpent={firmTotalSpent} firmTotalPayouts={firmTotalPayouts} /></div>
          </div>

          {/* Statistiques */}
          <div style={{ ...S.card, padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '14px' }}>Statistiques</div>
            {(() => {
              const paid = accts.filter(a => a.status === 'Financé').length
              const total = accts.length
              const allP = accts.reduce((s, a) => s.concat(a.payouts || []), [])
              const bestP = allP.reduce((max, p) => { const v = toEUR(p.amount, accts.find(a => (a.payouts || []).find(x => x.id === p.id))?.currency || 'USD', rates); return v > max ? v : max }, 0)
              const activeCount = accts.filter(a => a.status === 'Challenge' || a.status === 'Financé').length
              const roi = totalSpentEUR > 0 ? totalNet / totalSpentEUR * 100 : null
              return <>
                {[
                  ['Taux de réussite', total > 0 ? Math.round(paid / total * 100) + '%' : '—', paid / total > 0.5 ? 'var(--green)' : 'var(--text)'],
                  ['Meilleur payout', bestP > 0 ? fmtMoney(bestP) : '—', 'var(--green)'],
                  ['Coût moyen challenge', total > 0 ? fmtMoney(totalSpentEUR / total) : '—', 'var(--text)'],
                  ['ROI global', roi !== null ? (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%' : '—', roi >= 0 ? 'var(--green)' : 'var(--red)'],
                  ['Comptes actifs', activeCount, 'var(--text)'],
                ].map(([label, value, color], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color }}>{value}</span>
                  </div>
                ))}
              </>
            })()}
          </div>

          {/* Par firme ranking */}
          <div style={{ ...S.card, padding: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text2)', marginBottom: '14px' }}>Par firme</div>
            {firms.slice().sort((a, b) => (firmTotalPayouts(b) - firmTotalSpent(b)) - (firmTotalPayouts(a) - firmTotalSpent(a))).map(f => {
              const net = firmTotalPayouts(f) - firmTotalSpent(f)
              return <div key={f.id} onClick={() => setFirmDrawer(f.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getFirmLogo(f.name, f.color, 22)}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600' }}>{f.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{(f.accounts || []).length} compte{(f.accounts || []).length > 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>{net >= 0 ? '+' : ''}{net.toFixed(0)} €</div>
              </div>
            })}
            {!firms.length && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Aucune donnée</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
