'use client'
// app/app/alerts/page.js — Alerts: upcoming bills, payment reminders, ROI alerts.
// Extracted from the original monolithic app/app/page.js (lines ~1043-1126).

import { useApp } from '../AppContext'
import { useT } from '../../../../components/LanguageProvider'
import PushNotificationToggle from '../../../../components/PushNotificationToggle'

export default function AlertsPage() {
  const t = useT()
  const { firms, alerts, upcomingBills, S } = useApp()

  return (
    <div className="page-pad" style={{ maxWidth: '1160px', margin: '0 auto', padding: '32px 24px 60px' }}>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'var(--amber)', letterSpacing: '0.16em', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>{t('app.alerts.eyebrow')}</div>
        <h1 style={{ fontSize: '30px', fontWeight: '700', letterSpacing: '-0.025em', margin: 0, marginBottom: '6px', lineHeight: 1.1 }}>{t('app.alerts.title')}</h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>{t('app.alerts.subtitle')}</p>
      </div>

      {/* Toggle Push notifications */}
      <div style={{ marginBottom: '24px' }}>
        <PushNotificationToggle />
      </div>

      {/* Liste des alertes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
        {alerts.map((alert, i) => (
          <div key={i} style={{ ...S.card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', background: alert.type === 'success' ? 'var(--green-bg)' : alert.type === 'warn' ? 'var(--amber-bg)' : 'var(--surface)', borderColor: alert.type === 'success' ? 'var(--green)' : alert.type === 'warn' ? 'var(--amber-text)' : 'rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: '22px' }}>{alert.icon}</div>
            <div><div style={{ fontSize: '13px', fontWeight: '600' }}>{alert.title}</div><div style={{ fontSize: '12px', color: 'var(--text2)' }}>{alert.sub}</div></div>
          </div>
        ))}
      </div>

      {/* Prochains prélèvements (30 jours) */}
      {upcomingBills.length > 0 && (() => {
        const totalCost = upcomingBills.reduce((s, b) => s + (b.cost || 0), 0)
        const byCur = {}
        upcomingBills.forEach(b => { byCur[b.sym] = (byCur[b.sym] || 0) + b.cost })
        const totalsStr = Object.entries(byCur).map(([s, t]) => `${t.toFixed(0)} ${s}`).join(' + ')
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{'📅'} Prochains prélèvements (30 prochains jours)</div>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{upcomingBills.length} prélèvement{upcomingBills.length > 1 ? 's' : ''} à venir · Total : <strong style={{ color: 'var(--red)' }}>{totalsStr}</strong></div>
              </div>
            </div>
            <div style={{ ...S.card, overflow: 'hidden' }}>
              {upcomingBills.map((b, i) => {
                const isImminent = b.daysLeft <= 2
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 16px',
                    borderBottom: i < upcomingBills.length - 1 ? '0.5px solid var(--border)' : 'none',
                    background: isImminent ? 'rgba(250,199,117,0.05)' : 'transparent',
                  }}>
                    <div style={{
                      width: '44px', textAlign: 'center', flexShrink: 0,
                      fontSize: '10px', color: 'var(--text3)', fontWeight: '600', letterSpacing: '0.4px',
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: isImminent ? 'var(--amber-text)' : 'var(--text)' }}>{b.date.getDate()}</div>
                      <div style={{ textTransform: 'uppercase' }}>{b.date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</div>
                    </div>
                    <div style={{ width: '2px', alignSelf: 'stretch', background: b.firmColor || 'var(--blue)', borderRadius: '2px', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{b.firm} · {b.account}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {b.daysLeft === 0 ? 'Aujourd\'hui' : b.daysLeft === 1 ? 'Demain' : `Dans ${b.daysLeft} jours`}
                        {isImminent && <span style={{ marginLeft: '8px', padding: '1px 7px', borderRadius: '99px', background: 'rgba(250,199,117,0.15)', color: 'var(--amber-text)', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{'⚠'} Imminent</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--red)', flexShrink: 0 }}>-{b.cost} {b.sym}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: '11px', color: 'var(--text3)', lineHeight: 1.5 }}>
              {'💡'} Les prélèvements s&apos;arrêtent automatiquement quand tu passes le compte en <strong style={{ color: 'var(--green)' }}>Financé</strong> via le bouton {'🚀'} dans le drawer du compte.
            </div>
          </div>
        )
      })()}

      {/* Si aucun prélèvement à venir */}
      {upcomingBills.length === 0 && firms.some(f => (f.accounts || []).some(a => a.status === 'Challenge' && a.payment_mode === 'monthly')) && (
        <div style={{ padding: '14px 18px', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: '12px', color: 'var(--text3)' }}>
          {'✓'} Aucun prélèvement prévu dans les 30 prochains jours.
        </div>
      )}
    </div>
  )
}
