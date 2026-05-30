'use client'
// Payout Pipeline — kanban-style tracker per funded account.
// Stages :
//   1. Setup        : compte financé sans aucun trade
//   2. Building     : trades en cours, profit < seuil payout (ou jours min non atteints)
//   3. Eligible     : conditions remplies, peut demander un payout
//   4. Received     : a déjà reçu au moins 1 payout
//
// Conditions Eligible (par défaut, conservateur) :
//   - min_trading_days atteint
//   - profit cumulé > 50% du seuil payout target (ou simplement positif si pas de target)

import { useMemo } from 'react'
import { getFirmLogo } from '../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS, planSizeNum } from '../../lib/constants'

const C = {
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  amber: '#fac775',
  red: '#e8504a',
  grey: '#565e78',
}

const STAGES = [
  { id: 'setup',    label: 'Setup',     color: C.grey,      desc: 'Compte fraîchement financé, pas encore de trades.' },
  { id: 'building', label: 'Building',  color: C.amber,     desc: 'Trades en cours, profit insuffisant ou jours min non atteints.' },
  { id: 'eligible', label: 'Eligible',  color: C.green,     desc: 'Toutes les conditions sont remplies. Tu peux demander un payout.' },
  { id: 'received', label: 'Received',  color: C.blueLight, desc: 'Au moins 1 payout déjà reçu. Continue à scaler.' },
]

function classifyAccount(account, firmName) {
  const payouts = account.payouts || []
  if (payouts.length > 0) return 'received'

  const balance = account.balance
  const initialBalance = planSizeNum(account.plan_size)
  const profit = (balance != null) ? (balance - initialBalance) : null
  const target = account.payout_target
  const minDays = account.min_trading_days

  // Setup: no balance change yet
  if (balance == null || profit === 0 || profit === null) return 'setup'

  // Building: in profit but not yet eligible
  // Eligible: profit ≥ target (if target set) OR profit > 0 and minDays = 0/null
  const hitsTarget = target != null && profit >= (target - initialBalance)
  const hitsMinDays = minDays == null || minDays === 0

  if (hitsTarget && hitsMinDays) return 'eligible'
  if (profit > 0) return 'building'
  return 'setup'
}

export default function PayoutPipeline({ firms }) {
  const cards = useMemo(() => {
    const acc = []
    for (const f of (firms || [])) {
      for (const a of (f.accounts || [])) {
        if (a.status !== 'Financé') continue
        acc.push({
          ...a,
          firmName: f.name,
          stage: classifyAccount(a, f.name),
        })
      }
    }
    return acc
  }, [firms])

  const byStage = useMemo(() => {
    const map = {}
    for (const s of STAGES) map[s.id] = []
    for (const c of cards) (map[c.stage] || map.setup).push(c)
    return map
  }, [cards])

  if (!cards.length) {
    return (
      <div style={{ color: C.text3, fontSize: 13, padding: '16px 0' }}>
        Aucun compte financé. Le payout pipeline s&apos;active dès qu&apos;un compte passe en Financé.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 12,
    }} className="payout-pipeline-grid">
      {STAGES.map((stage) => {
        const items = byStage[stage.id] || []
        return (
          <div key={stage.id} style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderTop: `3px solid ${stage.color}`,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            minHeight: 200,
          }}>
            <div>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: stage.color,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}>
                <span>{stage.label}</span>
                <span style={{
                  padding: '1px 7px',
                  background: `${stage.color}22`,
                  borderRadius: 99,
                  fontSize: 11,
                }}>{items.length}</span>
              </div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.4 }}>
                {stage.desc}
              </div>
            </div>

            {items.length === 0 ? (
              <div style={{ fontSize: 11, color: C.text3, fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                — aucun compte —
              </div>
            ) : (
              items.map((item) => {
                const firmColor = FIRM_SUGGESTION_COLORS[item.firmName] || C.blue
                const balance = item.balance
                const initial = planSizeNum(item.plan_size)
                const profit = balance != null ? balance - initial : null
                const payoutCount = (item.payouts || []).length
                return (
                  <div key={item.id} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    padding: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {getFirmLogo(item.firmName, firmColor, 22)}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.firmName}
                        </div>
                        <div style={{ fontSize: 10, color: C.text3 }}>
                          {(item.plan_size || '').toUpperCase()}{item.name ? ` · ${item.name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.text2 }}>
                      <span>
                        {profit != null
                          ? <>P&amp;L : <strong style={{ color: profit >= 0 ? C.green : C.red }}>${Math.round(profit).toLocaleString('en-US')}</strong></>
                          : '—'}
                      </span>
                      {payoutCount > 0 && (
                        <span style={{ color: C.blueLight }}>{payoutCount} payout{payoutCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )
      })}
      <style jsx>{`
        @media (max-width: 900px) {
          :global(.payout-pipeline-grid) {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          :global(.payout-pipeline-grid) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
