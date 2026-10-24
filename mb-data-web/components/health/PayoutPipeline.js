'use client'
// Payout Pipeline — kanban-style tracker per funded account.
// Stages :
//   1. Setup        : compte financé sans aucun trade
//   2. Building     : trades en cours, profit < seuil payout (ou jours min non atteints)
//   3. Eligible     : conditions remplies, peut demander un payout
//   4. Received     : a déjà reçu au moins 1 payout
//
// Eligible = toutes les conditions de payout connues sont tenues sur la période
// depuis le dernier payout (lib/payoutReadiness : profit, jours qualifiants,
// consistance). Chaque carte affiche où en est chaque condition. Un compte déjà
// payé redevient « Eligible » quand le payout suivant est disponible.

import { useMemo } from 'react'
import { payoutReadiness } from '../../lib/payoutReadiness'
import { useT } from '../LanguageProvider'
import { getFirmLogo } from '../../lib/firmLogos'
import { FIRM_SUGGESTION_COLORS, planSizeNum } from '../../lib/constants'

const C = {
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text2)',
  text3: 'var(--text3)',
  blue: 'var(--blue)',
  blueLight: 'var(--blue-light)',
  green: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  grey: '#565e78',
}

const STAGES = [
  { id: 'setup',    label: 'Setup',     color: C.grey,      desc: 'Compte fraîchement financé, pas encore de trades.' },
  { id: 'building', label: 'Building',  color: C.amber,     desc: 'Trades en cours, profit insuffisant ou jours min non atteints.' },
  { id: 'eligible', label: 'Eligible',  color: C.green,     desc: 'Toutes les conditions connues sont remplies depuis le dernier payout. Vérifie sur ta plateforme puis demande-le.' },
  { id: 'received', label: 'Received',  color: C.blueLight, desc: 'Au moins 1 payout déjà reçu, le suivant n’est pas encore disponible.' },
]

function classifyAccount(account, firmName, computedBalance) {
  const payouts = account.payouts || []
  if (payouts.length > 0) return 'received'

  const balance = account.balance != null ? Number(account.balance) : computedBalance
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

function stageFor(account, firmName, computedBalance, readiness) {
  if (!readiness || readiness.checks.length === 0) return classifyAccount(account, firmName, computedBalance)
  if (readiness.ready) return 'eligible'
  if ((account.payouts || []).length > 0) return 'received'
  return readiness.tradingDays > 0 ? 'building' : 'setup'
}

const usd = (v) => `$${Math.round(v).toLocaleString('en-US')}`
const SR_ONLY = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }

// Une ligne par condition : ✓ tenue, ○ pas encore.
function ReadinessList({ readiness, t }) {
  if (!readiness || !readiness.checks.length) return null
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'grid', gap: 3, fontSize: 11, color: C.text2 }}>
      {readiness.checks.map(c => {
        let text
        if (c.key === 'profit') text = t('app.health.readyProfit').replace('{cur}', usd(c.current)).replace('{req}', usd(c.required))
        else if (c.key === 'days') text = t(c.minDailyProfit ? 'app.health.readyDaysMin' : 'app.health.readyDays').replace('{cur}', c.current).replace('{req}', c.required).replace('{min}', usd(c.minDailyProfit || 0))
        else text = t('app.health.readyConsistency').replace('{cur}', c.current == null ? '—' : `${Math.round(c.current * 100)} %`).replace('{req}', `${Math.round(c.required * 100)} %`)
        return (
          <li key={c.key} style={{ display: 'flex', gap: 6 }}>
            <span aria-hidden="true" style={{ color: c.ok ? C.green : C.text3, width: 10 }}>{c.ok ? '✓' : '○'}</span>
            <span style={{ color: c.ok ? C.text2 : C.text3 }}>
              <span style={SR_ONLY}>{c.ok ? t('app.health.readyOk') : t('app.health.readyTodo')} : </span>{text}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default function PayoutPipeline({ firms, statsByAccount, trades }) {
  const t = useT()
  const cards = useMemo(() => {
    const acc = []
    for (const f of (firms || [])) {
      for (const a of (f.accounts || [])) {
        if (a.status !== 'Financé') continue
        const computedBalance = statsByAccount?.[a.id]?.balance
        const readiness = trades ? payoutReadiness({ account: a, firmName: f.name, trades }) : null
        acc.push({
          ...a,
          firmName: f.name,
          _computedBalance: computedBalance,
          _readiness: readiness,
          stage: stageFor(a, f.name, computedBalance, readiness),
        })
      }
    }
    return acc
  }, [firms, statsByAccount, trades])

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
                const balance = item.balance != null ? Number(item.balance) : item._computedBalance
                const initial = planSizeNum(item.plan_size)
                const profit = balance != null ? balance - initial : null
                const payoutCount = (item.payouts || []).length
                return (
                  <div key={item.id} style={{
                    background: 'var(--tint1)',
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
                    <ReadinessList readiness={item._readiness} t={t} />
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
