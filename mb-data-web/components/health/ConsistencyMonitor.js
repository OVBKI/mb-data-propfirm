'use client'
// Consistency Monitor — live ratio "best winning day / total profit" per funded account.
// Per-firm thresholds from PROPFIRM_RULES. Stats are computed upstream in /app/health.

import { useMemo } from 'react'
import { getFirmLogo } from '../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS } from '../../lib/constants'

const C = {
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
}

// Default consistency thresholds per firm (best day ÷ total profit ratio).
// Source : PROPFIRM_RULES "Consistency" rules in lib/constants.js.
const CONSISTENCY_THRESHOLDS = {
  'Topstep': 0.5,                   // Best Day ÷ Overall ≤ 50% (Combine)
  'Apex Trader Funding': 0.3,       // 30% sur évaluation
  'My Funded Futures': 0.3,         // 30% sur payouts
  'Lucid Trading': 0.4,
  'Tradeify': 0.4,
  'Take Profit Trader': 0.4,
  'Bulenox': 0.4,
  'Alpha Futures': 0.4,
  'Phidias Propfirm': 0.4,
  'Funded Futures Network': 0.4,
  'FuturesELites': 0.4,
}

function ratioColor(ratio, threshold) {
  if (ratio == null) return C.text3
  if (ratio < threshold - 0.1) return C.green
  if (ratio < threshold) return C.amber
  return C.red
}

function ratioLabel(ratio, threshold) {
  if (ratio == null) return 'Pas de trades'
  if (ratio < threshold - 0.1) return 'Safe'
  if (ratio < threshold) return 'Proche limite'
  return 'Violation'
}

export default function ConsistencyMonitor({ firms, statsByAccount, loading }) {
  const fundedAccounts = useMemo(() => {
    const list = []
    for (const f of (firms || [])) {
      for (const a of (f.accounts || [])) {
        if (a.status === 'Financé') list.push({ ...a, firmName: f.name })
      }
    }
    return list
  }, [firms])

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        background: C.surface,
        border: `1px dashed ${C.border}`,
        borderRadius: 12,
        textAlign: 'center',
        color: C.text3,
        fontSize: 13,
      }}>
        Chargement des trades…
      </div>
    )
  }

  if (!fundedAccounts.length) {
    return (
      <div style={{
        padding: '24px',
        background: C.surface,
        border: `1px dashed ${C.border}`,
        borderRadius: 12,
        textAlign: 'center',
        color: C.text3,
        fontSize: 13,
      }}>
        Aucun compte financé. Le consistency monitor s&apos;active dès qu&apos;un compte passe en Financé.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 12,
    }}>
      {fundedAccounts.map((a) => {
        const acctStats = statsByAccount?.[a.id]
        const threshold = CONSISTENCY_THRESHOLDS[a.firmName] || 0.4
        // Dénominateur = somme des JOURS GAGNANTS (règle Topstep/Apex), pas le net total.
        const ratio = (acctStats?.winningDaysProfit > 0 && acctStats?.bestDayAmount > 0)
          ? acctStats.bestDayAmount / acctStats.winningDaysProfit
          : null
        const color = ratioColor(ratio, threshold)
        const label = ratioLabel(ratio, threshold)
        const firmColor = FIRM_SUGGESTION_COLORS[a.firmName] || '#2d6fff'

        return (
          <div key={a.id} style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {getFirmLogo(a.firmName, firmColor, 30)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.firmName}
                </div>
                <div style={{ fontSize: 11, color: C.text3 }}>
                  Plan {(a.plan_size || '').toUpperCase()} · seuil {(threshold * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{
                padding: '3px 8px',
                background: `${color}15`,
                border: `1px solid ${color}33`,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                color,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {label}
              </div>
            </div>

            {ratio != null ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text3, marginBottom: 6 }}>
                  <span>Best day ÷ jours gagnants</span>
                  <span style={{ color, fontWeight: 700 }}>{(ratio * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
                  <div style={{
                    width: `${Math.min(ratio * 100, 100)}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }} />
                  {/* Threshold marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${threshold * 100}%`,
                    top: -2,
                    bottom: -2,
                    width: 2,
                    background: C.text3,
                    opacity: 0.5,
                  }} title={`Seuil ${(threshold * 100).toFixed(0)}%`} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div>
                    <div style={{ color: C.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Best day</div>
                    <div style={{ color: C.green, fontWeight: 600 }}>
                      ${Math.round(acctStats.bestDayAmount).toLocaleString('en-US')}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: C.text3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Jours gagnants</div>
                    <div style={{ color: C.text, fontWeight: 600 }}>
                      ${Math.round(acctStats.winningDaysProfit || 0).toLocaleString('en-US')}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
                {(acctStats?.daysCount || 0) === 0
                  ? 'Pas encore de trades enregistrés. Logue des trades ou sync Rithmic pour activer le calcul.'
                  : 'Profit total ≤ 0 — consistency non calculable.'}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
